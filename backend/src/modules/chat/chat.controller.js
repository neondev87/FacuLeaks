// ════════════════════════════════════════════════════════════════════════
// MÓDULO: chat/chat.controller.js — lo que se hace por HTTP en el chat
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE:
//   - getConversaciones(): arma la lista de "con quién hablaste" (últimos
//     mensajes) + tus amigos, para la barra lateral del chat.
//   - getMensajes(): trae el historial completo con una persona.
//   - sendAudio() / sendImagen(): reciben el archivo, lo VALIDAN de verdad
//     (magic bytes — los primeros bytes reales del archivo, no solo la
//     extensión, para que nadie suba un .exe disfrazado de .webp), lo
//     comprimen (Sharp → WebP en el caso de imagen) y crean el mensaje.
//   - serveAudio(): sirve un audio de DM, pero SOLO si quien lo pide es el
//     que lo mandó o el que lo recibió — por eso no está bajo la carpeta
//     pública /uploads, tiene su propia ruta gateada en server.js.
//   - deletemensaje(): borra un mensaje (solo su dueño puede).
//
// PARA QUÉ SIRVE:
//   Es la mitad "por HTTP" del chat. La otra mitad — mandar texto, marcar
//   leído, indicador de "escribiendo" — vive en chat.socket.js porque es
//   instantánea y no necesita esperar una respuesta HTTP.
//
// CON QUÉ SE CONECTA:
//   - config/db.js (Prisma) → tabla messages.
//   - upload/upload.security.js → verificarMagicBytes (misma validación
//     anti-archivo-falso que usa el módulo upload/ para el muro).
//   - req.io (Socket.io) → avisa en vivo con message:receive:audio /
//     message:receive:image / message:deleted.
//   - Frontend: hooks/useChat.js, hooks/useChatImage.js y
//     hooks/useAudioRecorder.js llaman a estos endpoints.
// ════════════════════════════════════════════════════════════════════════
const fs     = require('fs');
const path   = require('path');
const sharp  = require('sharp');
const crypto = require('crypto');
const prisma = require('../../config/db');
const { verificarMagicBytes } = require('../upload/upload.security');

const getConversaciones = async (req, res) => {
  try {
    const userId = req.userId;

    const amistades = await prisma.amistades.findMany({
      where: {
        estado: 'ACEPTADO',
        OR: [{ solicitanteId: userId }, { receptorId: userId }]
      },
      include: {
        users_amistades_solicitanteIdTousers: { select: { id: true, username: true, nombre: true, imagen: true } },
        users_amistades_receptorIdTousers:    { select: { id: true, username: true, nombre: true, imagen: true } },
      }
    });

    const todosAmigos = amistades.map(a => ({
      userId:   a.solicitanteId === userId ? a.receptorId : a.solicitanteId,
      username: a.solicitanteId === userId
        ? a.users_amistades_receptorIdTousers.username
        : a.users_amistades_solicitanteIdTousers.username,
      nombre: a.solicitanteId === userId
        ? a.users_amistades_receptorIdTousers.nombre
        : a.users_amistades_solicitanteIdTousers.nombre,
      imagen: a.solicitanteId === userId
        ? a.users_amistades_receptorIdTousers.imagen
        : a.users_amistades_solicitanteIdTousers.imagen,
    }));
    const amigoIds = new Set(todosAmigos.map(a => a.userId));

    const mensajes = await prisma.messages.findMany({
      where: { OR: [{ emisorId: userId }, { receptorId: userId }] },
      include: {
        users_messages_emisorIdTousers:   { select: { id: true, username: true, imagen: true } },
        users_messages_receptorIdTousers: { select: { id: true, username: true, imagen: true } },
      },
      orderBy: { creadoEn: 'desc' },
    });

    // yoEnvie: true si en ALGÚN momento el usuario logueado le escribió a esa
    // persona — no hace falta un campo "aceptada" en la BD: si nunca le
    // escribiste y no son amigos, es una "solicitud" pendiente para vos; en
    // cuanto respondés una vez, deja de filtrar acá y pasa a "recientes" sola
    // (mismo comportamiento que las solicitudes de mensaje de Instagram).
    const convMap = new Map();
    for (const msg of mensajes) {
      const otherId   = msg.emisorId === userId ? msg.receptorId : msg.emisorId;
      const otherUser = msg.emisorId === userId
        ? msg.users_messages_receptorIdTousers
        : msg.users_messages_emisorIdTousers;
      const yoLoEnvie = msg.emisorId === userId;
      if (!convMap.has(otherId)) {
        convMap.set(otherId, {
          userId:   otherId,
          username: otherUser?.username || 'unknown',
          imagen:   otherUser?.imagen || null,
          lastMsg:  msg.tipo === 'audio' ? '🎤 Audio' : msg.tipo === 'imagen' ? '📷 Imagen' : msg.contenido,
          lastTime: msg.creadoEn,
          unread:   msg.receptorId === userId && !msg.leido ? 1 : 0,
          yoEnvie:  yoLoEnvie,
        });
      } else {
        const conv = convMap.get(otherId);
        if (msg.receptorId === userId && !msg.leido) conv.unread++;
        if (yoLoEnvie) conv.yoEnvie = true;
      }
    }

    const recientes   = [];
    const solicitudes = [];
    for (const { yoEnvie, ...conv } of convMap.values()) {
      (amigoIds.has(conv.userId) || yoEnvie ? recientes : solicitudes).push(conv);
    }

    res.json({ recientes, solicitudes, amigos: todosAmigos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener conversaciones' });
  }
};

const getMensajes = async (req, res) => {
  try {
    const userId      = req.userId;
    const otherUserId = parseInt(req.params.userId);

    const mensajes = await prisma.messages.findMany({
      where: {
        OR: [
          { emisorId: userId,      receptorId: otherUserId },
          { emisorId: otherUserId, receptorId: userId      },
        ]
      },
      include: {
        users_messages_emisorIdTousers: { select: { id: true, username: true, imagen: true } }
      },
      orderBy: { creadoEn: 'asc' },
    });

    const mensajesNorm = mensajes.map(m => ({
      ...m,
      emisor: m.users_messages_emisorIdTousers,
    }));

    const otherUser = await prisma.users.findUnique({
      where:  { id: otherUserId },
      select: { id: true, username: true, imagen: true }
    });

    res.json({ mensajes: mensajesNorm, otherUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
};

// POST /api/chat/audio/:receptorId — guardar audio y notificar por socket
const sendAudio = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió audio' });

  const emisorId   = req.userId;
  const receptorId = parseInt(req.params.receptorId);
  if (!Number.isInteger(receptorId)) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'receptorId inválido' });
  }

  // Asegurar que existe la carpeta
  const dir = path.join('uploads', 'audios');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const audioUrl = `/uploads/audios/${req.file.filename}`;

  try {
    const msg = await prisma.messages.create({
      data: {
        emisorId,
        receptorId,
        contenido: '🎤 Audio',
        tipo:      'audio',
        audioUrl,
      },
      include: {
        users_messages_emisorIdTousers: { select: { id: true, username: true, imagen: true } }
      }
    });

    const msgNorm = { ...msg, emisor: msg.users_messages_emisorIdTousers };

    // Notificar al receptor por socket si está conectado
    const io = req.io;
    if (io) {
      // Buscar socket del receptor — el server.js expone onlineUsers en req.io
      // Emitir a todos y el cliente filtra por emisorId/receptorId
      io.emit('message:receive:audio', msgNorm);
    }

    res.json({ ok: true, msg: msgNorm });
  } catch (err) {
    // Limpiar archivo si falla la BD
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('sendAudio error:', err.message);
    res.status(500).json({ error: 'Error al guardar audio' });
  }
};

// POST /api/chat/imagen/:receptorId — B4: enviar una imagen por DM.
// Mismo pipeline que el muro (magic bytes + Sharp → WebP). El archivo final
// queda en uploads/imagenes (servido de forma pública, igual que las imágenes
// de posts; el nombre es un hash aleatorio).
const sendImagen = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió imagen' });

  const tmpPath    = req.file.path;
  const emisorId   = req.userId;
  const receptorId = parseInt(req.params.receptorId);

  if (!Number.isInteger(receptorId)) {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    return res.status(400).json({ error: 'receptorId inválido' });
  }

  try {
    if (!verificarMagicBytes(tmpPath, 'imagen')) {
      fs.unlinkSync(tmpPath);
      return res.status(400).json({ error: 'Archivo inválido' });
    }

    const outName = `${crypto.randomBytes(16).toString('hex')}.webp`;
    const outPath = path.join('uploads', 'imagenes', outName);

    await sharp(tmpPath)
      .rotate()
      .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82, effort: 6 })
      .toFile(outPath);

    fs.unlinkSync(tmpPath);

    const imageUrl = `/uploads/imagenes/${outName}`;

    const msg = await prisma.messages.create({
      data: {
        emisorId,
        receptorId,
        contenido: '📷 Imagen',
        tipo:      'imagen',
        imageUrl,
      },
      include: {
        users_messages_emisorIdTousers: { select: { id: true, username: true, imagen: true } }
      }
    });

    const msgNorm = { ...msg, emisor: msg.users_messages_emisorIdTousers };

    if (req.io) req.io.emit('message:receive:image', msgNorm);

    res.json({ ok: true, msg: msgNorm });
  } catch (err) {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    console.error('sendImagen error:', err.message);
    res.status(500).json({ error: 'Error al enviar imagen' });
  }
};

// GET /uploads/audios/:file — sirve un audio de DM SOLO a su emisor o receptor.
// Montada antes de express.static para que los .webm no sean públicos.
const serveAudio = async (req, res) => {
  const userId   = req.userId;
  const filename = path.basename(String(req.params.file)); // corta path traversal
  const audioUrl = `/uploads/audios/${filename}`;
  try {
    const msg = await prisma.messages.findFirst({
      where:  { audioUrl, OR: [{ emisorId: userId }, { receptorId: userId }] },
      select: { id: true },
    });
    if (!msg) return res.status(403).json({ error: 'No autorizado' });

    // root + ruta relativa: evita que send() rechace la ruta si algún
    // segmento del cwd empieza con "." (p.ej. .claude en un worktree).
    const rel = path.join('uploads', 'audios', filename);
    return res.sendFile(rel, { root: process.cwd(), dotfiles: 'allow' }, (err) => {
      if (err && !res.headersSent) res.status(404).json({ error: 'Audio no encontrado' });
    });
  } catch (err) {
    console.error('serveAudio error:', err.message);
    if (!res.headersSent) res.status(500).json({ error: 'Error al servir audio' });
  }
};

// DELETE /api/chat/mensaje/:id
const deletemensaje = async (req, res) => {
  const msgId  = parseInt(req.params.id);
  const userId = req.userId;
  try {
    const msg = await prisma.messages.findUnique({ where: { id: msgId } });
    if (!msg) return res.status(404).json({ error: 'Mensaje no encontrado' });
    if (msg.emisorId !== userId) return res.status(403).json({ error: 'No autorizado' });
    await prisma.messages.delete({ where: { id: msgId } });
    // Notificar al receptor
    const io = req.io;
    if (io) io.emit('message:deleted', { id: msgId });
    res.json({ ok: true });
  } catch (err) {
    console.error('deletemensaje error:', err.message);
    res.status(500).json({ error: 'Error al eliminar mensaje' });
  }
};

module.exports = { getConversaciones, getMensajes, sendAudio, sendImagen, deletemensaje, serveAudio };
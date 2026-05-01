const fs    = require('fs');
const path  = require('path');
const prisma = require('../../config/db');

const getConversaciones = async (req, res) => {
  try {
    const userId = req.userId;

    const amistades = await prisma.amistades.findMany({
      where: {
        estado: 'ACEPTADO',
        OR: [{ solicitanteId: userId }, { receptorId: userId }]
      },
      include: {
        users_amistades_solicitanteIdTousers: { select: { id: true, username: true, nombre: true } },
        users_amistades_receptorIdTousers:    { select: { id: true, username: true, nombre: true } },
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
    }));

    const mensajes = await prisma.messages.findMany({
      where: { OR: [{ emisorId: userId }, { receptorId: userId }] },
      include: {
        users_messages_emisorIdTousers:   { select: { id: true, username: true } },
        users_messages_receptorIdTousers: { select: { id: true, username: true } },
      },
      orderBy: { creadoEn: 'desc' },
    });

    const convMap = new Map();
    for (const msg of mensajes) {
      const otherId   = msg.emisorId === userId ? msg.receptorId : msg.emisorId;
      const otherUser = msg.emisorId === userId
        ? msg.users_messages_receptorIdTousers
        : msg.users_messages_emisorIdTousers;
      if (!convMap.has(otherId)) {
        convMap.set(otherId, {
          userId:   otherId,
          username: otherUser?.username || 'unknown',
          lastMsg:  msg.tipo === 'audio' ? '🎤 Audio' : msg.contenido,
          lastTime: msg.creadoEn,
          unread:   msg.receptorId === userId && !msg.leido ? 1 : 0,
        });
      } else if (msg.receptorId === userId && !msg.leido) {
        convMap.get(otherId).unread++;
      }
    }

    const recientes = Array.from(convMap.values());
    res.json({ recientes, amigos: todosAmigos });
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
        users_messages_emisorIdTousers: { select: { id: true, username: true } }
      },
      orderBy: { creadoEn: 'asc' },
    });

    const mensajesNorm = mensajes.map(m => ({
      ...m,
      emisor: m.users_messages_emisorIdTousers,
    }));

    const otherUser = await prisma.users.findUnique({
      where:  { id: otherUserId },
      select: { id: true, username: true }
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
        users_messages_emisorIdTousers: { select: { id: true, username: true } }
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

module.exports = { getConversaciones, getMensajes, sendAudio, deletemensaje };
// ════════════════════════════════════════════════════════════════════════
// MÓDULO: chat/chat.socket.js — la mitad "en vivo" del chat
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: acá vive TODO lo del chat que pasa por Socket.io (WebSockets) en
// vez de HTTP normal — porque necesita ser instantáneo, sin esperar que el
// navegador arme y mande una petición nueva cada vez:
//   - message:send    → guarda el mensaje de texto en la BD y lo empuja al
//                        instante a la otra persona (si está online).
//   - messages:read   → marca como leídos los mensajes de una conversación.
//   - typing:start/stop, audio:start/stop → avisos efímeros ("Fulano está
//     escribiendo...") que NO se guardan en la base de datos, solo se
//     retransmiten al otro usuario mientras dura.
//
// PARA QUÉ SIRVE:
//   Antes esta lógica vivía suelta dentro de server.js, mezclada con el
//   arranque del servidor — se sacó para acá el 2026-09-04 así el módulo
//   chat/ tiene TODO su dominio junto (rutas HTTP + sockets), como los
//   demás módulos.
//
// CON QUÉ SE CONECTA:
//   - server.js → llama a registerChatSocketHandlers(io, socket, onlineUsers)
//     una vez por CADA conexión nueva de un usuario (dentro de io.on('connection')).
//   - config/db.js (Prisma) → tabla messages.
//   - onlineUsers → un Map en memoria (vive en server.js) que dice
//     "id de usuario → id de su socket", para saber a quién mandarle el evento.
//   - Frontend: hooks/useChat.js escucha message:receive, message:sent,
//     message:error, typing:start/stop, etc.
// ════════════════════════════════════════════════════════════════════════
const prisma = require('../../config/db');

// Se llama una vez por cada socket conectado.
function registerChatSocketHandlers(io, socket, onlineUsers) {
  // ── message:send (texto, con replyToId opcional) ──
  socket.on('message:send', async (data) => {
    const { receptorId, contenido, emisorId, replyToId } = data || {};
    const texto = String(contenido || '').trim();
    if (!texto || !emisorId || !receptorId) return;

    try {
      const msg = await prisma.messages.create({
        data: {
          emisorId:   parseInt(emisorId),
          receptorId: parseInt(receptorId),
          contenido:  texto,
          ...(replyToId ? { replyToId: parseInt(replyToId) } : {}),
        },
        include: {
          users_messages_emisorIdTousers: { select: { id: true, username: true, imagen: true } },
        },
      });

      const msgNorm = { ...msg, emisor: msg.users_messages_emisorIdTousers };

      const receptorSocket = onlineUsers.get(String(receptorId));
      if (receptorSocket) io.to(receptorSocket).emit('message:receive', msgNorm);
      socket.emit('message:sent', msgNorm);
    } catch (err) {
      console.error('[socket message:send]', err.message);
      // Antes un fallo de BD dejaba al emisor sin feedback; ahora avisa.
      socket.emit('message:error', { error: 'No se pudo enviar el mensaje' });
    }
  });

  // ── messages:read — marcar como leídos los que me mandó `emisorId` ──
  socket.on('messages:read', async (data) => {
    const { emisorId, receptorId } = data || {};
    if (!emisorId || !receptorId) return;

    try {
      await prisma.messages.updateMany({
        where: { emisorId: parseInt(emisorId), receptorId: parseInt(receptorId), leido: false },
        data:  { leido: true, leidoEn: new Date() },
      });
      const emisorSocket = onlineUsers.get(String(emisorId));
      if (emisorSocket) io.to(emisorSocket).emit('messages:read:confirm', { receptorId });
    } catch (err) {
      console.error('[socket messages:read]', err.message);
    }
  });

  // ── Relays efímeros (sin BD): indicadores de escritura y de audio ──
  socket.on('typing:start', ({ receptorId } = {}) => {
    const receptorSocket = onlineUsers.get(String(receptorId));
    if (receptorSocket) io.to(receptorSocket).emit('typing:start', { userId: socket.userId });
  });

  socket.on('typing:stop', ({ receptorId } = {}) => {
    const receptorSocket = onlineUsers.get(String(receptorId));
    if (receptorSocket) io.to(receptorSocket).emit('typing:stop', { userId: socket.userId });
  });

  socket.on('audio:start', ({ receptorId } = {}) => {
    const receptorSocket = onlineUsers.get(String(receptorId));
    if (receptorSocket) io.to(receptorSocket).emit('audio:start', { userId: socket.userId });
  });

  socket.on('audio:stop', ({ receptorId } = {}) => {
    const receptorSocket = onlineUsers.get(String(receptorId));
    if (receptorSocket) io.to(receptorSocket).emit('audio:stop', { userId: socket.userId });
  });
}

module.exports = { registerChatSocketHandlers };

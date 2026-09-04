const prisma = require('../../config/db');

// Handlers de socket del dominio chat. server.js solo cablea la conexión y la
// presencia (onlineUsers); TODA la lógica de chat —persistir mensajes, marcar
// leídos, relays de typing/audio— vive acá, en el módulo.
//
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
          users_messages_emisorIdTousers: { select: { id: true, username: true } },
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

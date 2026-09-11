// ════════════════════════════════════════════════════════════════════════
// MÓDULO: chat/chat.socket.js — la mitad "en vivo" del chat
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: acá vive TODO lo del chat que pasa por Socket.io (WebSockets) en
// vez de HTTP normal — porque necesita ser instantáneo, sin esperar que el
// navegador arme y mande una petición nueva cada vez:
//   - socketAuthMiddleware → el "portero" del WebSocket. Igual que
//     middleware/auth.js para el HTTP: verifica un JWT firmado con
//     JWT_SECRET y deja la identidad REAL en socket.userId. Antes el socket
//     confiaba en un userId que mandaba el cliente (`user:connect`), lo que
//     permitía hacerse pasar por cualquiera y recibir sus DMs.
//   - message:send    → guarda el mensaje de texto en la BD y lo empuja al
//                        instante a la otra persona. El emisor SIEMPRE es
//                        socket.userId, nunca lo que diga el payload.
//   - messages:read   → marca como leídos los mensajes que me mandó alguien.
//                        El lector siempre soy yo (socket.userId).
//   - typing:start/stop, audio:start/stop → avisos efímeros ("Fulano está
//     escribiendo...") que NO se guardan en la BD, solo se retransmiten al
//     otro usuario. El userId que viaja es SIEMPRE el autenticado.
//
// ENTREGA DIRIGIDA:
//   Cada socket entra a una "room" propia: `user:<id>`. Para mandarle algo a
//   una persona se emite a su room — llega a TODAS sus pestañas/dispositivos
//   y a nadie más. Nunca se hace io.emit() (broadcast a todos).
//
// CON QUÉ SE CONECTA:
//   - server.js → io.use(socketAuthMiddleware) una vez, y
//     registerChatSocketHandlers(io, socket) por cada conexión.
//   - middleware/auth.js → comparten JWT_SECRET / algoritmo (HS256).
//   - chat.controller.js → emite a las mismas rooms `user:<id>` para
//     audio/imagen/borrado.
//   - config/db.js (Prisma) → tabla messages.
//   - Frontend: hooks/useChat.js pide un "ticket" a GET /api/chat/socket-ticket
//     y lo pasa en el handshake (socket.auth.token).
// ════════════════════════════════════════════════════════════════════════
const prisma = require('../../config/db');
const jwt    = require('jsonwebtoken');

// Lee UNA cookie del header `Cookie` sin traer una dependencia nueva.
function readCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const i = part.indexOf('=');
    if (i === -1) continue;
    if (part.slice(0, i).trim() === name) {
      return decodeURIComponent(part.slice(i + 1).trim());
    }
  }
  return null;
}

// ── El "portero" del WebSocket ──────────────────────────────────────────
// Busca el token en dos lugares, en este orden:
//   1. handshake.auth.token → "ticket" corto que el frontend pide a
//      GET /api/chat/socket-ticket. Funciona aunque el socket vaya a un
//      origen distinto al de la cookie (túnel/demo con dominios separados).
//   2. cookie `token` del handshake → caso simple same-site (desarrollo).
// LENIENTE: si el token falta o no verifica, NO rechaza la conexión — el
// socket queda anónimo (sin socket.userId). Anónimo = recibe los eventos
// públicos (feed/foro) pero NO puede mandar DMs ni entra a la sala privada
// `user:<id>`, así que no recibe mensajes de nadie.
function socketAuthMiddleware(socket, next) {
  try {
    const fromAuth = socket.handshake.auth && socket.handshake.auth.token;
    const cookieHeader = socket.handshake.headers && socket.handshake.headers.cookie;
    const token = fromAuth || readCookie(cookieHeader, 'token');
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
      if (decoded && decoded.id != null) socket.userId = String(decoded.id);
    }
  } catch {
    // token inválido / expirado → socket anónimo, sin acceso al chat
  }
  return next();
}

// Se llama una vez por CADA socket (autenticado o no). Los handlers de chat
// solo corren si el socket tiene identidad verificada (socket.userId); un
// socket anónimo puede escuchar eventos públicos pero no operar el chat.
function registerChatSocketHandlers(io, socket) {
  const myId = socket.userId || null;       // identidad verificada por io.use()
  if (!myId) return;                        // socket anónimo → sin handlers de chat

  // ── message:send (texto, con replyToId opcional) ──
  socket.on('message:send', async (data) => {
    const { receptorId, contenido, replyToId } = data || {};
    const texto = String(contenido || '').trim();
    const rId   = parseInt(receptorId);
    if (!texto || !Number.isInteger(rId)) return;
    if (String(rId) === myId) return;        // no te mandás mensajes a vos mismo

    try {
      const msg = await prisma.messages.create({
        data: {
          emisorId:   parseInt(myId),        // ← del socket, NO del payload
          receptorId: rId,
          contenido:  texto,
          ...(replyToId ? { replyToId: parseInt(replyToId) } : {}),
        },
        include: {
          users_messages_emisorIdTousers: { select: { id: true, username: true, imagen: true, facultad: true } },
        },
      });

      const msgNorm = { ...msg, emisor: msg.users_messages_emisorIdTousers };

      io.to(`user:${rId}`).emit('message:receive', msgNorm);
      socket.emit('message:sent', msgNorm);
    } catch (err) {
      console.error('[socket message:send]', err.message);
      // Antes un fallo de BD dejaba al emisor sin feedback; ahora avisa.
      socket.emit('message:error', { error: 'No se pudo enviar el mensaje' });
    }
  });

  // ── messages:read — marcar como leídos los que me mandó `emisorId` ──
  // El lector siempre soy yo; del payload solo sale DE QUIÉN marco leídos.
  socket.on('messages:read', async (data) => {
    const emisorId = parseInt((data || {}).emisorId);
    if (!Number.isInteger(emisorId)) return;

    try {
      await prisma.messages.updateMany({
        where: { emisorId, receptorId: parseInt(myId), leido: false },
        data:  { leido: true, leidoEn: new Date() },
      });
      io.to(`user:${emisorId}`).emit('messages:read:confirm', { receptorId: parseInt(myId) });
    } catch (err) {
      console.error('[socket messages:read]', err.message);
    }
  });

  // ── Relays efímeros (sin BD): indicadores de escritura y de audio ──
  // El `userId` que se retransmite es SIEMPRE el autenticado.
  const relay = (evt) => ({ receptorId } = {}) => {
    const rId = parseInt(receptorId);
    if (!Number.isInteger(rId)) return;
    io.to(`user:${rId}`).emit(evt, { userId: myId });
  };
  socket.on('typing:start', relay('typing:start'));
  socket.on('typing:stop',  relay('typing:stop'));
  socket.on('audio:start',  relay('audio:start'));
  socket.on('audio:stop',   relay('audio:stop'));
}

module.exports = { registerChatSocketHandlers, socketAuthMiddleware };

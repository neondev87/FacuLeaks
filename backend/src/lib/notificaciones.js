// ════════════════════════════════════════════════════════════════════════
// MÓDULO: lib/notificaciones.js — crear una notificación desde cualquier módulo
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: `crearNotificacion()` es la única puerta de entrada para meter
// una fila en la tabla `notifications` — la usan amigos.controller.js
// (solicitud enviada/aceptada) y posts.controller.js (like/comentario). Si
// `usuarioId === generadorId` (te likeaste tu propio post, aceptaste tu
// propia solicitud — no debería pasar, pero por las dudas) no crea nada:
// nadie necesita que le avisen de su propia acción.
//
// Además de guardar en la BD, empuja la notificación en vivo por Socket.io a
// la room `user:<usuarioId>` (la misma que usa chat.socket.js) — así el
// icono de la navbar se actualiza al instante sin esperar el próximo poll.
//
// CON QUÉ SE CONECTA:
//   - config/db.js (Prisma) → tabla notifications.
//   - lib/author.js (AUTHOR_SELECT/flattenAuthor) → el "generador" que viaja
//     con la notificación en vivo tiene la misma forma que el autor de un post.
//   - server.js pone `req.io = io` en cada request, así que cualquier
//     controller puede pasarlo acá sin importar server.js directo.
// ════════════════════════════════════════════════════════════════════════
const prisma = require('../config/db');
const { AUTHOR_SELECT, flattenAuthor } = require('./author');

async function crearNotificacion(io, { usuarioId, generadorId = null, tipo, entidadId = null, entidadTipo = null, mensaje = null }) {
  if (!usuarioId || usuarioId === generadorId) return null;

  try {
    const notif = await prisma.notifications.create({
      data: { usuarioId, generadorId, tipo, entidadId, entidadTipo, mensaje },
      include: { users_notifications_generadorIdTousers: { select: AUTHOR_SELECT } },
    });

    const payload = {
      ...notif,
      generador: flattenAuthor(notif.users_notifications_generadorIdTousers),
    };
    delete payload.users_notifications_generadorIdTousers;

    io?.to(`user:${usuarioId}`).emit('notification:new', payload);
    return payload;
  } catch (err) {
    console.error('crearNotificacion error:', err.message);
    return null;
  }
}

module.exports = { crearNotificacion };

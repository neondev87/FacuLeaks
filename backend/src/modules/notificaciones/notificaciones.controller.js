// ════════════════════════════════════════════════════════════════════════
// MÓDULO: notificaciones/notificaciones.controller.js — la campanita
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE:
//   - getNotificaciones(): las últimas 30 notificaciones del usuario logueado,
//     más recientes primero, con el "generador" (quién la disparó) aplanado
//     igual que el autor de un post (ver lib/author.js).
//   - marcarLeidas(): marca TODAS las no leídas como leídas de una — el
//     icono no maneja "leer una por una", se vacía entero al abrir el panel
//     (mismo criterio que Instagram/Twitter: abrir = leído).
//
// QUIÉN LAS CREA: no hay POST acá — las notificaciones nacen dentro de otros
// controllers (amigos.controller.js, posts.controller.js) llamando a
// lib/notificaciones.js → crearNotificacion(). Este módulo solo las lista.
//
// CON QUÉ SE CONECTA:
//   - config/db.js (Prisma) → tabla notifications.
//   - Frontend: hooks/useNotifications.js (icono de campana en Navbar.js),
//     mismo patrón que RequestsIcon/solicitudes en el chat.
// ════════════════════════════════════════════════════════════════════════
const prisma = require('../../config/db');
const { AUTHOR_SELECT, flattenAuthor } = require('../../lib/author');

const mapNotif = (n) => {
  const { users_notifications_generadorIdTousers, ...rest } = n;
  return { ...rest, generador: flattenAuthor(users_notifications_generadorIdTousers) };
};

const getNotificaciones = async (req, res) => {
  try {
    const usuarioId = req.userId;
    const [notificaciones, noLeidas] = await Promise.all([
      prisma.notifications.findMany({
        where: { usuarioId },
        include: { users_notifications_generadorIdTousers: { select: AUTHOR_SELECT } },
        orderBy: { creadoEn: 'desc' },
        take: 30,
      }),
      prisma.notifications.count({ where: { usuarioId, leida: false } }),
    ]);
    res.json({ notificaciones: notificaciones.map(mapNotif), noLeidas });
  } catch (err) {
    console.error('getNotificaciones error:', err.message);
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
};

const marcarLeidas = async (req, res) => {
  try {
    const usuarioId = req.userId;
    await prisma.notifications.updateMany({
      where: { usuarioId, leida: false },
      data: { leida: true, leidaEn: new Date() },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('marcarLeidas error:', err.message);
    res.status(500).json({ error: 'Error al marcar como leídas' });
  }
};

module.exports = { getNotificaciones, marcarLeidas };

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
      where: {
        OR: [{ emisorId: userId }, { receptorId: userId }]
      },
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
          lastMsg:  msg.contenido,
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

module.exports = { getConversaciones, getMensajes };
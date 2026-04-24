const prisma = require('../../config/db');

// Lista de conversaciones del usuario
const getConversaciones = async (req, res) => {
  try {
    const userId = req.userId;

    // Obtener IDs de amigos con amistad ACEPTADA
    const amistades = await prisma.amistades.findMany({
      where: {
        estado: 'ACEPTADO',
        OR: [{ solicitanteId: userId }, { receptorId: userId }]
      },
      select: { solicitanteId: true, receptorId: true }
    });
    const amigoIds = amistades.map(a =>
      a.solicitanteId === userId ? a.receptorId : a.solicitanteId
    );

    // Último mensaje con cada persona
    const mensajes = await prisma.messages.findMany({
      where: {
        OR: [{ emisorId: userId }, { receptorId: userId }]
      },
      include: {
        emisor:   { select: { id: true, username: true } },
        receptor: { select: { id: true, username: true } },
      },
      orderBy: { creadoEn: 'desc' },
    });

    // Agrupar por conversación (una entrada por usuario)
    const convMap = new Map();
    for (const msg of mensajes) {
      const otherId = msg.emisorId === userId ? msg.receptorId : msg.emisorId;
      const other   = msg.emisorId === userId ? msg.receptor   : msg.emisor;
      if (!convMap.has(otherId)) {
        convMap.set(otherId, {
          userId:      otherId,
          username:    other.username,
          lastMsg:     msg.contenido,
          lastTime:    msg.creadoEn,
          unread:      msg.receptorId === userId && !msg.leido ? 1 : 0,
          esamigo:     amigoIds.includes(otherId),
        });
      } else if (msg.receptorId === userId && !msg.leido) {
        convMap.get(otherId).unread++;
      }
    }

    const conversaciones = Array.from(convMap.values());
    const amigos      = conversaciones.filter(c => c.esamigo);
    const solicitudes = conversaciones.filter(c => !c.esamigo);

    res.json({ amigos, solicitudes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener conversaciones' });
  }
};

// Mensajes de una conversación
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
        emisor: { select: { id: true, username: true } }
      },
      orderBy: { creadoEn: 'asc' },
    });

    // Info del otro usuario
    const otherUser = await prisma.users.findUnique({
      where:  { id: otherUserId },
      select: { id: true, username: true }
    });

    res.json({ mensajes, otherUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
};

module.exports = { getConversaciones, getMensajes };
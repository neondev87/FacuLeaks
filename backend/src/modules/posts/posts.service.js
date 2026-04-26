const prisma = require('../../config/db');

const createPost = async (autorId, { titulo, contenido = "", privacidad = 'PUBLICA', imagen = null }) => {
  const post = await prisma.posts.create({
    data: { autorId, titulo, contenido, privacidad, imagen },
    include: {
      users: { select: { id: true, username: true, nombre: true } }
    }
  });
  return { ...post, autor: post.users };
};

const getFeedRecientes = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const posts = await prisma.posts.findMany({
    where: { privacidad: 'PUBLICA' },
    include: {
      users: { select: { id: true, username: true, nombre: true } },
      _count: { select: { post_likes: true, comments: true } }
    },
    orderBy: { creadoEn: 'desc' },
    skip,
    take: limit,
  });
  return posts.map(p => ({ ...p, autor: p.users }));
};

const getFeedTrending = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const hace72h = new Date(Date.now() - 72 * 60 * 60 * 1000);
  const posts = await prisma.posts.findMany({
    where: { privacidad: 'PUBLICA', creadoEn: { gte: hace72h } },
    include: {
      users: { select: { id: true, username: true, nombre: true } },
      _count: { select: { post_likes: true, comments: true } }
    },
    orderBy: [
      { totalLikes: 'desc' },
      { totalComentarios: 'desc' },
      { totalVistas: 'desc' },
      { creadoEn: 'desc' },
    ],
    skip,
    take: limit,
  });
  return posts.map(p => ({ ...p, autor: p.users }));
};

const getFeedSiguiendo = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
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
  if (amigoIds.length === 0) return [];
  const posts = await prisma.posts.findMany({
    where: {
      autorId: { in: amigoIds },
      privacidad: { in: ['PUBLICA', 'AMIGOS'] }
    },
    include: {
      users: { select: { id: true, username: true, nombre: true } },
      _count: { select: { post_likes: true, comments: true } }
    },
    orderBy: { creadoEn: 'desc' },
    skip,
    take: limit,
  });
  return posts.map(p => ({ ...p, autor: p.users }));
};

module.exports = { getFeedRecientes, getFeedTrending, getFeedSiguiendo, createPost };
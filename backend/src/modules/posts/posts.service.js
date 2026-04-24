const prisma = require('../../config/db');

// ── RECIENTES: posts de usuarios que sigues ──
const getFeedRecientes = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  // Obtener IDs de usuarios que sigo
  const follows = await prisma.follows.findMany({
    where: { seguidorId: userId },
    select: { seguidoId: true }
  });
  const seguidoIds = follows.map(f => f.seguidoId);
  if (seguidoIds.length === 0) return [];

  const posts = await prisma.posts.findMany({
    where: {
      autorId: { in: seguidoIds },
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

// ── TRENDING ──
const getFeedTrending = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const hace72h = new Date(Date.now() - 72 * 60 * 60 * 1000);

  const posts = await prisma.posts.findMany({
    where: {
      privacidad: 'PUBLICA',
      creadoEn: { gte: hace72h }
    },
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

// ── SIGUIENDO: amigos mutuos ──
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

// ── CREAR POST ──
const createPost = async (autorId, { titulo, contenido, privacidad = 'AMIGOS' }) => {
  const post = await prisma.posts.create({
    data: { autorId, titulo, contenido, privacidad },
    include: {
      users: { select: { id: true, username: true, nombre: true } }
    }
  });
  return { ...post, autor: post.users };
};

module.exports = { getFeedRecientes, getFeedTrending, getFeedSiguiendo, createPost };
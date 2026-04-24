const prisma = require('../../config/db');

// ── RECIENTES: posts de usuarios que sigues ──
const getFeedRecientes = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const posts = await prisma.posts.findMany({
    where: {
      autor: {
        seguidores: {
          some: { seguidorId: userId }
        }
      },
      privacidad: { in: ['PUBLICA', 'AMIGOS'] }
    },
    include: {
      autor: {
        select: { id: true, username: true, nombre: true }
      },
      _count: { select: { likes: true, comentarios: true } }
    },
    orderBy: { creadoEn: 'desc' },
    skip,
    take: limit,
  });

  return posts;
};

// ── TRENDING: todos los posts, score por popularidad (últimas 72h) ──
const getFeedTrending = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const hace72h = new Date(Date.now() - 72 * 60 * 60 * 1000);

  const posts = await prisma.posts.findMany({
    where: {
      privacidad: 'PUBLICA',
      creadoEn: { gte: hace72h }
    },
    include: {
      autor: {
        select: { id: true, username: true, nombre: true }
      },
      _count: { select: { likes: true, comentarios: true } }
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

  return posts;
};

// ── SIGUIENDO: posts de amigos mutuos (amistad ACEPTADA) ──
const getFeedSiguiendo = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  // Obtener IDs de amigos mutuos
  const amistades = await prisma.amistades.findMany({
    where: {
      estado: 'ACEPTADO',
      OR: [
        { solicitanteId: userId },
        { receptorId: userId },
      ]
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
      autor: {
        select: { id: true, username: true, nombre: true }
      },
      _count: { select: { likes: true, comentarios: true } }
    },
    orderBy: { creadoEn: 'desc' },
    skip,
    take: limit,
  });

  return posts;
};

// ── CREAR POST ──
const createPost = async (autorId, { titulo, contenido, privacidad = 'AMIGOS' }) => {
  const post = await prisma.posts.create({
    data: { autorId, titulo, contenido, privacidad },
    include: {
      autor: { select: { id: true, username: true, nombre: true } }
    }
  });
  return post;
};

module.exports = { getFeedRecientes, getFeedTrending, getFeedSiguiendo, createPost };
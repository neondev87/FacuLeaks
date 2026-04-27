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

const feedRecientes = async (req, res) => {
  try {
    const posts = await getFeedRecientes(req.userId, parseInt(req.query.page) || 1);
    res.json({ posts, page: parseInt(req.query.page) || 1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener feed' });
  }
};

const feedTrending = async (req, res) => {
  try {
    const posts = await getFeedTrending(parseInt(req.query.page) || 1);
    res.json({ posts, page: parseInt(req.query.page) || 1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener trending' });
  }
};

const feedSiguiendo = async (req, res) => {
  try {
    const posts = await getFeedSiguiendo(req.userId, parseInt(req.query.page) || 1);
    res.json({ posts, page: parseInt(req.query.page) || 1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener siguiendo' });
  }
};

const nuevoPost = async (req, res) => {
  try {
    const { titulo, contenido, privacidad, imagen } = req.body;
    if (!contenido && !imagen) return res.status(400).json({ error: 'Se requiere contenido o imagen' });
    const post = await createPost(req.userId, { titulo, contenido, privacidad, imagen });
    req.io.emit('post:new', post);
    res.status(201).json({ post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear post' });
  }
};

// DELETE /api/posts/:id — solo el autor puede borrar
const deletePost = async (req, res) => {
  const postId = parseInt(req.params.id);
  const userId = req.userId;
  try {
    const post = await prisma.posts.findUnique({ where: { id: postId } });
    if (!post) return res.status(404).json({ error: 'Post no encontrado' });
    if (post.autorId !== userId) return res.status(403).json({ error: 'No autorizado' });

    await prisma.posts.delete({ where: { id: postId } });

    // Notificar a todos los clientes conectados
    req.io.emit('post:deleted', { id: postId });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar post' });
  }
};

module.exports = { feedRecientes, feedTrending, feedSiguiendo, nuevoPost, deletePost };
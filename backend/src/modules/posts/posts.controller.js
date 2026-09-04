const prisma = require('../../config/db');

// Normaliza un post del feed: expone `autor` y `myReaction` ("LIKE" | "DISLIKE" | null),
// y usa el conteo real de comentarios (_count) como fuente de verdad —
// `posts.totalComentarios` puede estar desfasado por comentarios previos a B3.
const mapPost = (p) => {
  const { post_likes, users, _count, ...rest } = p;
  return {
    ...rest,
    autor: users,
    myReaction: post_likes?.[0]?.tipo || null,
    totalComentarios: _count?.comments ?? rest.totalComentarios ?? 0,
  };
};

const feedInclude = (userId) => ({
  users: { select: { id: true, username: true, nombre: true } },
  _count: { select: { comments: true } },
  post_likes: userId
    ? { where: { userId }, select: { tipo: true } }
    : false,
});

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
    include: feedInclude(userId),
    orderBy: { creadoEn: 'desc' },
    skip,
    take: limit,
  });
  return posts.map(mapPost);
};

const getFeedTrending = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const hace72h = new Date(Date.now() - 72 * 60 * 60 * 1000);
  const posts = await prisma.posts.findMany({
    where: { privacidad: 'PUBLICA', creadoEn: { gte: hace72h } },
    include: feedInclude(userId),
    orderBy: [
      { totalLikes: 'desc' },
      { totalComentarios: 'desc' },
      { totalVistas: 'desc' },
      { creadoEn: 'desc' },
    ],
    skip,
    take: limit,
  });
  return posts.map(mapPost);
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
    include: feedInclude(userId),
    orderBy: { creadoEn: 'desc' },
    skip,
    take: limit,
  });
  return posts.map(mapPost);
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
    const posts = await getFeedTrending(req.userId, parseInt(req.query.page) || 1);
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

// ── B2 · Reacciones (LIKE / DISLIKE) ─────────────────────────────────────────
// POST /api/posts/:id/react  body: { tipo: "LIKE" | "DISLIKE" }
// Toggle: misma reacción => la quita; distinta => la cambia; ninguna => la crea.
// Mantiene posts.totalLikes / posts.totalDislikes y emite `post:react`.
const toggleReaction = async (req, res) => {
  const postId = parseInt(req.params.id);
  const userId = req.userId;
  const tipo   = req.body?.tipo === 'DISLIKE' ? 'DISLIKE' : 'LIKE';

  if (!Number.isInteger(postId)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const post = await prisma.posts.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) return res.status(404).json({ error: 'Post no encontrado' });

    const existing = await prisma.post_likes.findFirst({ where: { postId, userId } });

    let myReaction;

    await prisma.$transaction(async (tx) => {
      if (!existing) {
        await tx.post_likes.create({ data: { postId, userId, tipo } });
        myReaction = tipo;
      } else if (existing.tipo === tipo) {
        await tx.post_likes.delete({ where: { id: existing.id } });
        myReaction = null;
      } else {
        await tx.post_likes.update({ where: { id: existing.id }, data: { tipo } });
        myReaction = tipo;
      }

      const [likes, dislikes] = await Promise.all([
        tx.post_likes.count({ where: { postId, tipo: 'LIKE' } }),
        tx.post_likes.count({ where: { postId, tipo: 'DISLIKE' } }),
      ]);
      await tx.posts.update({
        where: { id: postId },
        data: { totalLikes: likes, totalDislikes: dislikes },
      });
    });

    const totals = await prisma.posts.findUnique({
      where: { id: postId },
      select: { totalLikes: true, totalDislikes: true },
    });

    req.io.emit('post:react', {
      postId,
      totalLikes: totals.totalLikes,
      totalDislikes: totals.totalDislikes,
    });

    res.json({ myReaction, ...totals });
  } catch (err) {
    console.error('toggleReaction error:', err.message);
    res.status(500).json({ error: 'Error al reaccionar' });
  }
};

// ── B3 · Comentarios ────────────────────────────────────────────────────────
// GET /api/posts/:id/comments
const listComments = async (req, res) => {
  const postId = parseInt(req.params.id);
  if (!Number.isInteger(postId)) return res.status(400).json({ error: 'ID inválido' });
  try {
    const comments = await prisma.comments.findMany({
      where: { postId },
      include: { users: { select: { id: true, username: true, nombre: true, imagen: true } } },
      orderBy: { creadoEn: 'asc' },
    });
    res.json({ comments: comments.map(c => ({ ...c, autor: c.users })) });
  } catch (err) {
    console.error('listComments error:', err.message);
    res.status(500).json({ error: 'Error al obtener comentarios' });
  }
};

// POST /api/posts/:id/comments  body: { contenido }
const createComment = async (req, res) => {
  const postId    = parseInt(req.params.id);
  const autorId   = req.userId;
  const contenido = String(req.body?.contenido || '').trim();

  if (!Number.isInteger(postId)) return res.status(400).json({ error: 'ID inválido' });
  if (!contenido) return res.status(400).json({ error: 'Comentario vacío' });
  if (contenido.length > 500) return res.status(400).json({ error: 'Máximo 500 caracteres' });

  try {
    const post = await prisma.posts.findUnique({ where: { id: postId }, select: { id: true } });
    if (!post) return res.status(404).json({ error: 'Post no encontrado' });

    let comment, total;
    await prisma.$transaction(async (tx) => {
      comment = await tx.comments.create({
        data: { postId, autorId, contenido },
        include: { users: { select: { id: true, username: true, nombre: true, imagen: true } } },
      });
      // Recuento exacto (no increment): evita drift y contadores negativos si
      // hay comentarios previos a B3 que nunca tocaron totalComentarios.
      total = await tx.comments.count({ where: { postId } });
      await tx.posts.update({ where: { id: postId }, data: { totalComentarios: total } });
    });

    const payload = { ...comment, autor: comment.users };
    req.io.emit('post:comment', { postId, totalComentarios: total, comment: payload });
    res.status(201).json({ comment: payload, totalComentarios: total });
  } catch (err) {
    console.error('createComment error:', err.message);
    res.status(500).json({ error: 'Error al comentar' });
  }
};

// DELETE /api/posts/:postId/comments/:commentId — autor del comentario o dueño del post
const deleteComment = async (req, res) => {
  const postId    = parseInt(req.params.postId);
  const commentId = parseInt(req.params.commentId);
  const userId    = req.userId;

  if (!Number.isInteger(postId) || !Number.isInteger(commentId))
    return res.status(400).json({ error: 'ID inválido' });

  try {
    const comment = await prisma.comments.findUnique({
      where: { id: commentId },
      include: { posts: { select: { autorId: true } } },
    });
    if (!comment || comment.postId !== postId) return res.status(404).json({ error: 'Comentario no encontrado' });
    if (comment.autorId !== userId && comment.posts.autorId !== userId)
      return res.status(403).json({ error: 'No autorizado' });

    let total;
    await prisma.$transaction(async (tx) => {
      await tx.comments.delete({ where: { id: commentId } });
      total = await tx.comments.count({ where: { postId } });
      await tx.posts.update({ where: { id: postId }, data: { totalComentarios: total } });
    });

    req.io.emit('post:comment:deleted', { postId, commentId, totalComentarios: total });
    res.json({ ok: true, totalComentarios: total });
  } catch (err) {
    console.error('deleteComment error:', err.message);
    res.status(500).json({ error: 'Error al eliminar comentario' });
  }
};

module.exports = {
  feedRecientes, feedTrending, feedSiguiendo, nuevoPost, deletePost,
  toggleReaction, listComments, createComment, deleteComment,
};

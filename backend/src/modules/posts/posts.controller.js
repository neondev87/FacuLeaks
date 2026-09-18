// ════════════════════════════════════════════════════════════════════════
// MÓDULO: posts/posts.controller.js — el muro (feed, likes/dislikes, comentarios)
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE:
//   - Los 3 feeds (recientes / trending / siguiendo) + getPost (un post
//     suelto por id, 2026-09-17 — lo usa la campana de notificaciones para
//     llevarte al post exacto aunque haya quedado afuera de la página
//     cargada): cada uno usa mapPost() para dejar la respuesta pareja
//     (mismo formato para el frontend, sin importar de dónde salga).
//   - Publicar y borrar posts (nuevoPost / deletePost).
//   - Reacciones LIKE/DISLIKE (toggleReaction): un usuario solo puede tener
//     UNA reacción por post — si clickea la misma, se la saca; si clickea la
//     otra, se la cambia. Después de cada cambio se RECUENTA (no se suma/
//     resta a ciegas) cuántos likes y dislikes tiene el post, para que el
//     número mostrado sea siempre exacto aunque algo falle a mitad de camino.
//   - Comentarios (listComments / createComment / deleteComment /
//     toggleCommentLike): mismo patrón de recuento exacto para
//     totalComentarios. Los comentarios admiten respuestas anidadas
//     (`parentId`, sin límite de profundidad) y su propio like (tabla
//     comment_likes, sin dislike).
//   - Compartir (toggleShare): toggle, solo posts públicos.
//   - Dispara notificaciones (lib/notificaciones.js → crearNotificacion)
//     cuando corresponde: like nuevo, comentario nuevo y post compartido
//     avisan al dueño del post (nunca a vos mismo).
//
// PARA QUÉ SIRVE:
//   Es el módulo más grande del backend porque el muro es el corazón de la
//   red social — publicar, reaccionar y comentar son las 3 acciones que más
//   se repiten.
//
// CON QUÉ SE CONECTA:
//   - config/db.js (Prisma) → tablas posts, post_likes, comments,
//     comment_likes, post_shares.
//   - req.io (Socket.io, inyectado por server.js en cada petición) → avisa
//     en vivo a todos los que tienen el feed abierto: post:new, post:deleted,
//     post:react, post:comment, post:comment:deleted, post:comment:like; y
//     en privado (room `user:<id>`) las notificaciones nuevas.
//   - Frontend: hooks/useFeedPosts.js y hooks/usePostComments.js son quienes
//     llaman a estos endpoints y escuchan esos eventos de socket.
// ════════════════════════════════════════════════════════════════════════
const prisma = require('../../config/db');
const { AUTHOR_SELECT, flattenAuthor } = require('../../lib/author');
const { crearNotificacion } = require('../../lib/notificaciones');

// Normaliza un post del feed: expone `autor` y `myReaction` ("LIKE" | "DISLIKE" | null),
// y usa el conteo real de comentarios (_count) como fuente de verdad —
// `posts.totalComentarios` puede estar desfasado por comentarios previos a B3.
// `previewComments`: los primeros 2 comentarios (los más viejos, mismo orden
// que el hilo completo) para mostrar una vista previa en el muro sin tener
// que desplegar el hilo entero — ver feedInclude() más abajo.
const mapPost = (p) => {
  const { post_likes, post_shares, comments, users, _count, ...rest } = p;
  return {
    ...rest,
    autor: flattenAuthor(users),
    myReaction: post_likes?.[0]?.tipo || null,
    myShared: !!post_shares?.length,
    totalComentarios: _count?.comments ?? rest.totalComentarios ?? 0,
    previewComments: (comments || []).map(c => ({ ...c, autor: flattenAuthor(c.users) })),
  };
};

const feedInclude = (userId) => ({
  users: { select: AUTHOR_SELECT },
  _count: { select: { comments: true } },
  post_likes: userId
    ? { where: { userId }, select: { tipo: true } }
    : false,
  post_shares: userId
    ? { where: { userId }, select: { id: true } }
    : false,
  // Primeros 2 comentarios del post, para la vista previa del muro (Fase 3).
  // Solo de primer nivel (parentId null) — una respuesta sin su comentario
  // padre a la vista no se entiende, así que las respuestas quedan afuera
  // de la preview y solo se ven al abrir el hilo completo.
  comments: {
    where: { parentId: null },
    take: 2,
    orderBy: { creadoEn: 'asc' },
    select: {
      id: true, contenido: true, creadoEn: true, parentId: true,
      users: { select: AUTHOR_SELECT },
    },
  },
});

const createPost = async (autorId, { titulo, contenido = "", privacidad = 'PUBLICA', imagen = null }) => {
  const post = await prisma.posts.create({
    data: { autorId, titulo, contenido, privacidad, imagen },
    include: {
      users: { select: AUTHOR_SELECT }
    }
  });
  return { ...post, autor: flattenAuthor(post.users) };
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

// GET /api/posts/:id — un post suelto, sin importar en qué feed/página
// esté. Lo usa la campana de notificaciones (Navbar.js → feed/page.js) para
// poder llevarte EXACTAMENTE al post que te dieron like/comentaron aunque
// ya haya quedado afuera de la primera página de RECIENTES, o sea un post
// AMIGOS/SOLO_YO que ni aparece en ningún feed — el dueño siempre puede
// verlo (puedeVerPost), así que igual se le puede mostrar en su Muro.
const getPost = async (req, res) => {
  const postId = parseInt(req.params.id);
  if (!Number.isInteger(postId)) return res.status(400).json({ error: 'ID inválido' });
  try {
    const post = await prisma.posts.findUnique({
      where: { id: postId },
      include: feedInclude(req.userId),
    });
    if (!(await puedeVerPost(req.userId, post))) return res.status(404).json({ error: 'Post no encontrado' });
    res.json({ post: mapPost(post) });
  } catch (err) {
    console.error('getPost error:', err.message);
    res.status(500).json({ error: 'Error al obtener el post' });
  }
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

// ¿`userId` puede VER este post? Público: cualquiera logueado. AMIGOS: el
// autor o alguien con amistad ACEPTADA. SOLO_YO: solo el autor.
// Los feeds (getFeed*) ya filtran esto en el WHERE de la consulta, pero los
// endpoints que operan por :id (reaccionar/comentar/listar comentarios)
// consultaban directo por postId sin repetir el chequeo — cualquier usuario
// logueado podía leer/reaccionar/comentar posts SOLO_YO o AMIGOS ajenos con
// solo adivinar el id (autoincremental, fácil de enumerar).
const puedeVerPost = async (userId, post) => {
  if (!post) return false;
  if (post.privacidad === 'PUBLICA' || post.autorId === userId) return true;
  if (post.privacidad !== 'AMIGOS') return false; // SOLO_YO y no sos el autor
  const amistad = await prisma.amistades.findFirst({
    where: {
      estado: 'ACEPTADO',
      OR: [
        { solicitanteId: userId, receptorId: post.autorId },
        { solicitanteId: post.autorId, receptorId: userId },
      ],
    },
    select: { id: true },
  });
  return !!amistad;
};

const PRIVACIDADES = new Set(['PUBLICA', 'AMIGOS', 'SOLO_YO']);
// `imagen` solo puede ser una ruta de subida propia — nunca una URL arbitraria
// (evita que se inyecten pixeles de tracking / contenido externo en el feed).
const IMAGEN_OK = /^\/uploads\/imagenes\/[A-Za-z0-9._-]+$/;

const nuevoPost = async (req, res) => {
  try {
    const titulo    = req.body?.titulo != null ? String(req.body.titulo).trim() : null;
    const contenido = String(req.body?.contenido || '').trim();
    const imagen    = req.body?.imagen ? String(req.body.imagen) : null;
    const privacidad = PRIVACIDADES.has(req.body?.privacidad) ? req.body.privacidad : 'PUBLICA';

    if (!contenido && !imagen) return res.status(400).json({ error: 'Se requiere contenido o imagen' });
    if (titulo && titulo.length > 200) return res.status(400).json({ error: 'Título demasiado largo (máx. 200)' });
    if (contenido.length > 5000) return res.status(400).json({ error: 'Contenido demasiado largo (máx. 5000)' });
    if (imagen && !IMAGEN_OK.test(imagen)) return res.status(400).json({ error: 'Imagen inválida' });

    const post = await createPost(req.userId, { titulo, contenido, privacidad, imagen });
    // Solo los posts públicos se difunden en vivo al muro de todos. Los de
    // AMIGOS / SOLO_YO aparecen en el perfil del autor por fetch normal — no
    // hay que mandarle su contenido a cada cliente conectado.
    if (post.privacidad === 'PUBLICA') req.io.emit('post:new', post);
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
      select: { id: true, autorId: true, privacidad: true },
    });
    if (!post) return res.status(404).json({ error: 'Post no encontrado' });
    if (!(await puedeVerPost(userId, post))) return res.status(404).json({ error: 'Post no encontrado' });

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

    // Solo avisa cuando la reacción QUEDÓ en LIKE (se creó o se cambió de
    // DISLIKE a LIKE) — sacar el like o dejarlo en DISLIKE no notifica.
    if (myReaction === 'LIKE') {
      crearNotificacion(req.io, {
        usuarioId: post.autorId, generadorId: userId,
        tipo: 'LIKE_POST', entidadId: postId, entidadTipo: 'post',
      });
    }

    // Solo se difunde en vivo si el post es público — para AMIGOS/SOLO_YO
    // esto llegaba a TODOS los clientes conectados (io.emit es broadcast
    // global), revelando que ese post existe y sus contadores a cualquiera.
    if (post.privacidad === 'PUBLICA') {
      req.io.emit('post:react', {
        postId,
        totalLikes: totals.totalLikes,
        totalDislikes: totals.totalDislikes,
      });
    }

    res.json({ myReaction, ...totals });
  } catch (err) {
    console.error('toggleReaction error:', err.message);
    res.status(500).json({ error: 'Error al reaccionar' });
  }
};

// ── Compartir ────────────────────────────────────────────────────────────────
// POST /api/posts/:id/share — toggle: compartir de nuevo = descompartir.
// Solo se pueden compartir posts PÚBLICOS: un post compartido se lista en el
// perfil del que comparte (getPerfil/getPerfilPublico, perfil.controller.js),
// incluso en el perfil público visto por cualquiera — si se permitiera
// compartir un post de AMIGOS, terminaría filtrándose a gente que no es
// amiga del autor original. Nunca aparece en el muro (feedRecientes/
// Trending/Siguiendo solo consultan `posts`, jamás `post_shares`).
const toggleShare = async (req, res) => {
  const postId = parseInt(req.params.id);
  const userId = req.userId;

  if (!Number.isInteger(postId)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const post = await prisma.posts.findUnique({
      where: { id: postId },
      select: { id: true, autorId: true, privacidad: true },
    });
    if (!post) return res.status(404).json({ error: 'Post no encontrado' });
    if (post.privacidad !== 'PUBLICA') return res.status(403).json({ error: 'Solo se pueden compartir posts públicos' });

    const existing = await prisma.post_shares.findFirst({ where: { postId, userId } });
    let shared;

    await prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.post_shares.delete({ where: { id: existing.id } });
        shared = false;
      } else {
        await tx.post_shares.create({ data: { postId, userId } });
        shared = true;
      }
      const total = await tx.post_shares.count({ where: { postId } });
      await tx.posts.update({ where: { id: postId }, data: { totalCompartidos: total } });
    });

    const totals = await prisma.posts.findUnique({ where: { id: postId }, select: { totalCompartidos: true } });

    // Solo avisa cuando QUEDÓ compartido — descompartir no notifica a nadie.
    if (shared) {
      crearNotificacion(req.io, {
        usuarioId: post.autorId, generadorId: userId,
        tipo: 'POST_COMPARTIDO', entidadId: postId, entidadTipo: 'post',
      });
    }

    res.json({ shared, ...totals });
  } catch (err) {
    console.error('toggleShare error:', err.message);
    res.status(500).json({ error: 'Error al compartir' });
  }
};

// ── B3 · Comentarios ────────────────────────────────────────────────────────
// Aplana un comentario con su autor + el estado de like del que pide
// (`totalLikes`/`myLiked`) — el hilo queda FLAT (con `parentId`), es el
// frontend el que arma el árbol para dibujar las respuestas anidadas bajo
// su comentario padre (mismo patrón que ya usa `comments` en el feed: la
// forma de la data no cambia, se enriquece).
const mapComment = (c) => {
  const { users, _count, comment_likes, ...rest } = c;
  return {
    ...rest,
    autor: flattenAuthor(users),
    totalLikes: _count?.comment_likes ?? 0,
    myLiked: (comment_likes?.length ?? 0) > 0,
  };
};

const commentInclude = (userId) => ({
  users: { select: AUTHOR_SELECT },
  _count: { select: { comment_likes: true } },
  comment_likes: userId ? { where: { userId }, select: { id: true } } : false,
});

// Junta recursivamente los ids de TODAS las respuestas (y respuestas de
// respuestas) de un comentario — se usa al borrar, para avisarle a los
// demás clientes conectados que todo ese sub-hilo desapareció (la fila
// padre se borra con `delete`, el resto cae solo por el ON DELETE CASCADE
// de `parentId` en la base, pero eso no le llega a nadie por socket si no
// se junta la lista antes).
const collectDescendantIds = async (commentId) => {
  const hijos = await prisma.comments.findMany({ where: { parentId: commentId }, select: { id: true } });
  let ids = hijos.map(h => h.id);
  for (const h of hijos) ids = ids.concat(await collectDescendantIds(h.id));
  return ids;
};

// GET /api/posts/:id/comments
const listComments = async (req, res) => {
  const postId = parseInt(req.params.id);
  if (!Number.isInteger(postId)) return res.status(400).json({ error: 'ID inválido' });
  try {
    const post = await prisma.posts.findUnique({
      where: { id: postId },
      select: { id: true, autorId: true, privacidad: true },
    });
    if (!(await puedeVerPost(req.userId, post))) return res.status(404).json({ error: 'Post no encontrado' });

    const comments = await prisma.comments.findMany({
      where: { postId },
      include: commentInclude(req.userId),
      orderBy: { creadoEn: 'asc' },
    });
    res.json({ comments: comments.map(mapComment) });
  } catch (err) {
    console.error('listComments error:', err.message);
    res.status(500).json({ error: 'Error al obtener comentarios' });
  }
};

// POST /api/posts/:id/comments  body: { contenido, parentId? }
// `parentId`: si viene, este comentario es una RESPUESTA a un comentario
// específico de ese mismo post (sub-comentario) — sin límite de profundidad,
// se puede responder tanto a un comentario de primer nivel como a una
// respuesta ya existente.
const createComment = async (req, res) => {
  const postId    = parseInt(req.params.id);
  const autorId   = req.userId;
  const contenido = String(req.body?.contenido || '').trim();
  const parentIdRaw = req.body?.parentId;
  const parentId  = parentIdRaw != null && parentIdRaw !== '' ? parseInt(parentIdRaw) : null;

  if (!Number.isInteger(postId)) return res.status(400).json({ error: 'ID inválido' });
  if (!contenido) return res.status(400).json({ error: 'Comentario vacío' });
  if (contenido.length > 500) return res.status(400).json({ error: 'Máximo 500 caracteres' });
  if (parentId != null && !Number.isInteger(parentId)) return res.status(400).json({ error: 'parentId inválido' });

  try {
    const post = await prisma.posts.findUnique({
      where: { id: postId },
      select: { id: true, autorId: true, privacidad: true },
    });
    if (!(await puedeVerPost(autorId, post))) return res.status(404).json({ error: 'Post no encontrado' });

    if (parentId != null) {
      const parent = await prisma.comments.findUnique({ where: { id: parentId }, select: { id: true, postId: true } });
      if (!parent || parent.postId !== postId) return res.status(404).json({ error: 'Comentario padre no encontrado' });
    }

    let comment, total;
    await prisma.$transaction(async (tx) => {
      comment = await tx.comments.create({
        data: { postId, autorId, contenido, parentId },
        include: { users: { select: AUTHOR_SELECT } },
      });
      // Recuento exacto (no increment): evita drift y contadores negativos si
      // hay comentarios previos a B3 que nunca tocaron totalComentarios.
      total = await tx.comments.count({ where: { postId } });
      await tx.posts.update({ where: { id: postId }, data: { totalComentarios: total } });
    });

    const payload = { ...comment, autor: flattenAuthor(comment.users), totalLikes: 0, myLiked: false };
    delete payload.users;

    crearNotificacion(req.io, {
      usuarioId: post.autorId, generadorId: autorId,
      tipo: 'COMENTARIO_POST', entidadId: postId, entidadTipo: 'post',
      mensaje: contenido.slice(0, 140),
    });
    // Igual que post:react: solo se difunde a TODOS si el post es público.
    // Antes esto mandaba el contenido del comentario (y quién lo escribió)
    // de posts AMIGOS/SOLO_YO a cada cliente conectado, sin importar si
    // tenía permiso para ver ese post.
    if (post.privacidad === 'PUBLICA') {
      req.io.emit('post:comment', { postId, totalComentarios: total, comment: payload });
    }
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
      include: { posts: { select: { autorId: true, privacidad: true } } },
    });
    if (!comment || comment.postId !== postId) return res.status(404).json({ error: 'Comentario no encontrado' });
    if (comment.autorId !== userId && comment.posts.autorId !== userId)
      return res.status(403).json({ error: 'No autorizado' });

    const descendantIds = await collectDescendantIds(commentId);
    const commentIds = [commentId, ...descendantIds];

    let total;
    await prisma.$transaction(async (tx) => {
      await tx.comments.delete({ where: { id: commentId } }); // cascada: se llevan también las respuestas
      total = await tx.comments.count({ where: { postId } });
      await tx.posts.update({ where: { id: postId }, data: { totalComentarios: total } });
    });

    if (comment.posts.privacidad === 'PUBLICA') {
      req.io.emit('post:comment:deleted', { postId, commentId, commentIds, totalComentarios: total });
    }
    res.json({ ok: true, totalComentarios: total });
  } catch (err) {
    console.error('deleteComment error:', err.message);
    res.status(500).json({ error: 'Error al eliminar comentario' });
  }
};

// POST /api/posts/:postId/comments/:commentId/like — toggle, igual patrón que toggleReaction
// pero sin dislike: acá alcanza con un solo estado (te gusta / no).
const toggleCommentLike = async (req, res) => {
  const postId    = parseInt(req.params.postId);
  const commentId = parseInt(req.params.commentId);
  const userId    = req.userId;

  if (!Number.isInteger(postId) || !Number.isInteger(commentId))
    return res.status(400).json({ error: 'ID inválido' });

  try {
    const comment = await prisma.comments.findUnique({
      where: { id: commentId },
      include: { posts: { select: { id: true, autorId: true, privacidad: true } } },
    });
    if (!comment || comment.postId !== postId) return res.status(404).json({ error: 'Comentario no encontrado' });
    if (!(await puedeVerPost(userId, comment.posts))) return res.status(404).json({ error: 'Comentario no encontrado' });

    const existing = await prisma.comment_likes.findFirst({ where: { commentId, userId } });
    let liked;
    await prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.comment_likes.delete({ where: { id: existing.id } });
        liked = false;
      } else {
        await tx.comment_likes.create({ data: { commentId, userId } });
        liked = true;
      }
    });
    const totalLikes = await prisma.comment_likes.count({ where: { commentId } });

    if (comment.posts.privacidad === 'PUBLICA') {
      req.io.emit('post:comment:like', { postId, commentId, totalLikes });
    }
    res.json({ liked, totalLikes });
  } catch (err) {
    console.error('toggleCommentLike error:', err.message);
    res.status(500).json({ error: 'Error al reaccionar al comentario' });
  }
};

module.exports = {
  feedRecientes, feedTrending, feedSiguiendo, getPost, nuevoPost, deletePost,
  toggleReaction, toggleShare, listComments, createComment, deleteComment, toggleCommentLike,
};

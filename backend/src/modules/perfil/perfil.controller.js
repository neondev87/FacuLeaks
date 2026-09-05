// ════════════════════════════════════════════════════════════════════════
// MÓDULO: perfil/perfil.controller.js — perfil propio y perfil público
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE:
//   - getPerfil(): tus propios datos completos (bio, stats, tus últimos
//     posts, tus fotos) para la página /perfil.
//   - getPerfilPublico(): el perfil de OTRO usuario (solo lo público) y,
//     de paso, registra la visita (tabla profile_visits) y le avisa por
//     socket en vivo al dueño ("alguien visitó tu perfil").
//   - updatePerfil(): editar bio, intereses, links, etc.
//   - getAvatar(): solo tu propio avatar (sin el resto del perfil) — para
//     pantallas que solo necesitan mostrar "tu ícono" (composer del muro,
//     chat), sin pedir stats/posts/fotos de más.
//   - updateAvatar() / deleteAvatar(): sube (valida + comprime con Sharp a
//     WebP, con fit:'contain' — reescala la foto ENTERA adentro del cuadrado
//     en vez de recortarla, como Facebook/Instagram) o borra la foto de
//     perfil. Ambas avisan en vivo por socket (`user:avatar`) a todo el
//     mundo — feed, perfiles públicos y chats abiertos actualizan el ícono
//     sin recargar la página.
//   - uploadPhotos() / deletePhoto(): la galería de fotos (hasta 10 por vez).
//
// PARA QUÉ SIRVE:
//   Es todo lo que necesitan las páginas app/perfil/page.js (propio) y
//   app/perfil/[id]/page.js (público) para dibujarse.
//
// CON QUÉ SE CONECTA:
//   - config/db.js (Prisma) → users, user_profiles, posts, profile_visits,
//     user_photos. Ojo: TODO pasa por el cliente de Prisma, no hay ni una
//     consulta SQL escrita a mano en este archivo (se sacó el 2026-09-04).
//   - upload/upload.security.js → verificarMagicBytes antes de aceptar
//     cualquier imagen (avatar o foto de galería).
//   - req.io + req.onlineUsers → el aviso en vivo de "visita a tu perfil" Y
//     el de "cambié mi avatar" (`user:avatar`, escuchado por
//     hooks/useFeedPosts.js, usePublicProfile.js y useChat.js).
//   - Frontend: hooks/useOwnProfile.js y hooks/usePublicProfile.js.
// ════════════════════════════════════════════════════════════════════════
const fs     = require('fs');
const path   = require('path');
const sharp  = require('sharp');
const crypto = require('crypto');
const prisma = require('../../config/db');
const { verificarMagicBytes } = require('../upload/upload.security');

// profile_visits y user_photos están modeladas en Prisma: se usan por el client,
// NO por SQL crudo. Helper para no repetir el mapeo photoUrl -> url.
const getFotos = (userId) =>
  prisma.user_photos.findMany({
    where:   { userId },
    orderBy: { uploadedAt: 'desc' },
    take:    6,
    select:  { id: true, photoUrl: true, uploadedAt: true },
  }).then(rows => rows.map(r => ({ id: r.id, url: r.photoUrl, uploadedAt: r.uploadedAt })));

// Normaliza los datos de reacciones de un post para el VIEWER (quien está
// mirando el perfil, no necesariamente su dueño) — mismo criterio que
// mapPost() en posts.controller.js, para que el perfil pueda usar el mismo
// botón de LIKE/DISLIKE que ya existe en el muro.
const conReacciones = (post, viewerId) => {
  const { post_likes, totalLikes, totalDislikes, ...rest } = post;
  return {
    ...rest,
    totalLikes:    totalLikes ?? 0,
    totalDislikes: totalDislikes ?? 0,
    myReaction:    viewerId ? (post_likes?.[0]?.tipo || null) : null,
  };
};

// Posts del perfil (propio o público): siempre con el autor incluido —
// como acá el autor es SIEMPRE el dueño del perfil, esto evita el bug de
// tarjetas de post sin avatar (PostCard.js pinta `post.autor?.imagen`, que
// sin este include quedaba undefined). `viewerId` es quien está mirando
// (para saber si YA reaccionó a cada post — puede ser distinto del dueño).
const getPostsConAutor = (userId, privacidadFiltro, viewerId) =>
  prisma.posts.findMany({
    where:   privacidadFiltro ? { autorId: userId, privacidad: privacidadFiltro } : { autorId: userId },
    orderBy: { creadoEn: 'desc' },
    take:    5,
    select: {
      id: true, titulo: true, contenido: true, imagen: true, creadoEn: true, totalVistas: true,
      totalLikes: true, totalDislikes: true,
      users: { select: { id: true, username: true, nombre: true, imagen: true } },
      post_likes: viewerId ? { where: { userId: viewerId }, select: { tipo: true } } : false,
    },
  }).then(rows => rows.map(({ users, ...p }) => conReacciones({ ...p, autor: users }, viewerId)));

// Posts que `userId` compartió (no los que escribió) — para que aparezcan
// SOLO en su perfil, nunca en el muro (feedRecientes/Trending/Siguiendo no
// tocan `post_shares`). `onlyPublicOriginal` se usa en el perfil PÚBLICO:
// si el post original dejó de ser público (o nunca lo fue), no se lista acá
// para no filtrar contenido de amigos a un visitante cualquiera.
const getSharedPosts = (userId, onlyPublicOriginal, viewerId) =>
  prisma.post_shares.findMany({
    where:   { userId },
    orderBy: { creadoEn: 'desc' },
    take:    5,
    include: {
      posts: {
        select: {
          id: true, titulo: true, contenido: true, imagen: true, creadoEn: true, totalVistas: true, privacidad: true,
          totalLikes: true, totalDislikes: true,
          users: { select: { id: true, username: true, nombre: true, imagen: true } },
          post_likes: viewerId ? { where: { userId: viewerId }, select: { tipo: true } } : false,
        },
      },
    },
  }).then(rows => rows
    .filter(s => s.posts && (!onlyPublicOriginal || s.posts.privacidad === 'PUBLICA'))
    .map(s => {
      const { users, privacidad, ...p } = s.posts;
      return conReacciones({ ...p, autor: users, isShared: true, shareId: s.id, sharedEn: s.creadoEn }, viewerId);
    }));

// Junta posts propios + compartidos, ordenados por fecha (creadoEn del post
// propio vs. sharedEn del compartido), recortado a 5 en total.
const getPostsYCompartidos = async (userId, privacidadFiltro, onlyPublicOriginal, viewerId) => {
  const [propios, compartidos] = await Promise.all([
    getPostsConAutor(userId, privacidadFiltro, viewerId),
    getSharedPosts(userId, onlyPublicOriginal, viewerId),
  ]);
  return [...propios, ...compartidos]
    .sort((a, b) => new Date(b.sharedEn || b.creadoEn) - new Date(a.sharedEn || a.creadoEn))
    .slice(0, 5);
};

// GET /api/perfil — perfil propio
const getPerfil = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await prisma.users.findUnique({
      where:  { id: userId },
      select: { id:true, username:true, nombre:true, email:true, imagen:true, creadoEn:true }
    });

    const profile = await prisma.user_profiles.findUnique({ where: { userId } });

    const amigos = await prisma.amistades.count({
      where: { estado:'ACEPTADO', OR:[{ solicitanteId:userId },{ receptorId:userId }] }
    });

    const vlogs = await prisma.posts.count({ where: { autorId: userId } });

    let visitas = 0;
    try {
      visitas = await prisma.profile_visits.count({ where: { perfilId: userId } });
    } catch (e) { console.error('[VISITAS] error:', e.message); }

    const posts = await getPostsYCompartidos(userId, undefined, false, userId);

    let photos = [];
    try {
      photos = await getFotos(userId);
    } catch (e) { console.error('[PHOTOS] error:', e.message); }

    res.json({ user, profile:profile||{}, stats:{ amigos, vlogs, visitas }, posts, photos });
  } catch (err) {
    console.error('getPerfil error:', err.message);
    res.status(500).json({ error:'Error al obtener perfil' });
  }
};

// GET /api/perfil/:userId — perfil público + registrar visita
const getPerfilPublico = async (req, res) => {
  try {
    const visitorId     = req.userId;
    const profileUserId = parseInt(req.params.userId);

    if (!Number.isInteger(profileUserId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const user = await prisma.users.findUnique({
      where:  { id: profileUserId },
      select: { id:true, username:true, nombre:true, imagen:true, creadoEn:true }
    });

    if (!user) return res.status(404).json({ error:'Usuario no encontrado' });

    const profile = await prisma.user_profiles.findUnique({ where:{ userId:profileUserId } });

    const amigos = await prisma.amistades.count({
      where:{ estado:'ACEPTADO', OR:[{ solicitanteId:profileUserId },{ receptorId:profileUserId }] }
    });
    const vlogs = await prisma.posts.count({ where:{ autorId:profileUserId } });

    const posts = await getPostsYCompartidos(profileUserId, 'PUBLICA', true, visitorId);

    let visitas = 0;
    try {
      if (visitorId !== profileUserId) {
        await prisma.profile_visits.create({
          data: { visitanteId: visitorId, perfilId: profileUserId },
        });
      }
      visitas = await prisma.profile_visits.count({ where: { perfilId: profileUserId } });
      const targetSocket = req.onlineUsers?.get(String(profileUserId));
      if (targetSocket) req.io.to(targetSocket).emit('profile:visit', { visitas });
    } catch (e) { console.error('[VISITAS] error:', e.message); }

    let photos = [];
    try {
      photos = await getFotos(profileUserId);
    } catch (e) { console.error('[PHOTOS] error:', e.message); }

    res.json({ user, profile:profile||{}, stats:{ amigos, vlogs, visitas }, posts, photos, isOwnProfile: visitorId===profileUserId });
  } catch (err) {
    console.error('getPerfilPublico error:', err.message);
    res.status(500).json({ error:'Error al obtener perfil' });
  }
};

// PUT /api/perfil — actualizar datos
const updatePerfil = async (req, res) => {
  const { bio, statusText, intereses, links, nombre } = req.body;
  try {
    const profile = await prisma.user_profiles.upsert({
      where:  { userId:req.userId },
      update: { bio, statusText, intereses, links },
      create: { userId:req.userId, bio, statusText, intereses, links }
    });
    if (nombre) await prisma.users.update({ where:{ id:req.userId }, data:{ nombre } });
    res.json({ ok:true, profile });
  } catch (err) {
    console.error('updatePerfil error:', err.message);
    res.status(500).json({ error:'Error al actualizar perfil' });
  }
};

// GET /api/perfil/avatar — solo tu propio avatar (liviano: sin stats/posts/
// fotos), para pantallas que necesitan mostrar "tu icono" sin cargar todo
// el perfil (composer del muro, chat).
const getAvatar = async (req, res) => {
  try {
    const user = await prisma.users.findUnique({ where:{ id:req.userId }, select:{ imagen:true } });
    res.json({ imagen: user?.imagen || null });
  } catch (err) {
    console.error('getAvatar error:', err.message);
    res.status(500).json({ error:'Error al obtener avatar' });
  }
};

// PUT /api/perfil/avatar
const updateAvatar = async (req, res) => {
  if (!req.file) return res.status(400).json({ error:'No se recibió archivo' });
  const tmpPath = req.file.path;
  try {
    if (!verificarMagicBytes(tmpPath, 'imagen')) {
      fs.unlinkSync(tmpPath);
      return res.status(400).json({ error:'Archivo inválido' });
    }

    // Eliminar avatar anterior si existe
    const user = await prisma.users.findUnique({ where:{ id:req.userId }, select:{ imagen:true } });
    if (user.imagen && user.imagen.startsWith('/uploads')) {
      const oldPath = path.join(__dirname, '../../..', user.imagen);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const hash    = crypto.randomBytes(16).toString('hex');
    const outName = `avatar_${req.userId}_${hash}.webp`;
    const outPath = path.join('uploads/imagenes', outName);
    // fit:'contain' (no 'cover'): reescala la foto entera adentro del cuadrado
    // en vez de recortarla — así el ícono siempre muestra la foto completa
    // (como Facebook/Instagram), sin cortar cabezas ni bordes por el crop
    // centrado a ciegas. El relleno usa el mismo gris casi-negro que el
    // placeholder de AvatarMenu.js, así no se nota como "barras".
    await sharp(tmpPath).rotate().resize(400,400,{ fit:'contain', background:{ r:10,g:10,b:10,alpha:1 } }).webp({ quality:85 }).toFile(outPath);
    fs.unlinkSync(tmpPath);
    const url = `/uploads/imagenes/${outName}`;
    await prisma.users.update({ where:{ id:req.userId }, data:{ imagen:url } });
    // Avisar en vivo a todo el mundo (feed abierto, tu perfil visto por
    // otros, chats) para que actualicen tu ícono sin recargar la página.
    req.io?.emit('user:avatar', { userId: req.userId, imagen: url });
    res.json({ ok:true, url });
  } catch (err) {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    console.error('updateAvatar error:', err.message);
    res.status(500).json({ error:'Error procesando avatar' });
  }
};

// DELETE /api/perfil/avatar
const deleteAvatar = async (req, res) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.userId },
      select: { imagen: true }
    });

    // Eliminar archivo físico si existe
    if (user.imagen && user.imagen.startsWith('/uploads')) {
      const filepath = path.join(__dirname, '../../..', user.imagen);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }

    // Resetear en BD
    await prisma.users.update({
      where: { id: req.userId },
      data: { imagen: null }
    });

    req.io?.emit('user:avatar', { userId: req.userId, imagen: null });
    res.json({ ok: true });
  } catch (err) {
    console.error('deleteAvatar error:', err.message);
    res.status(500).json({ error: 'Error al eliminar avatar' });
  }
};

// POST /api/perfil/fotos — batch upload de fotos
const uploadPhotos = async (req, res) => {
  const files = req.files;
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No se enviaron archivos' });
  }

  const uploadedPhotos = [];

  try {
    for (const file of files) {
      const tmpPath = file.path;

      if (!verificarMagicBytes(tmpPath, 'imagen')) {
        fs.unlinkSync(tmpPath);
        continue;
      }

      const hash    = crypto.randomBytes(8).toString('hex');
      const outName = `photo_${req.userId}_${Date.now()}_${hash}.webp`;
      const outPath = path.join('uploads/imagenes', outName);

      await sharp(tmpPath)
        .rotate()
        .resize(1200, 1200, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: 80 })
        .toFile(outPath);

      fs.unlinkSync(tmpPath);

      const photoUrl = `/uploads/imagenes/${outName}`;

      const created = await prisma.user_photos.create({
        data:   { userId: req.userId, photoUrl },
        select: { id: true },
      });

      uploadedPhotos.push({ id: created.id, url: photoUrl });
    }

    res.json({ ok: true, photos: uploadedPhotos });
  } catch (err) {
    // Limpiar archivos temporales en caso de error
    if (files) {
      files.forEach(file => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }
    console.error('uploadPhotos error:', err.message);
    res.status(500).json({ error: 'Error al subir fotos' });
  }
};

// DELETE /api/perfil/fotos/:id
const deletePhoto = async (req, res) => {
  try {
    const photoId = parseInt(req.params.id);
    if (!Number.isInteger(photoId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const photo = await prisma.user_photos.findUnique({ where: { id: photoId } });

    if (!photo) {
      return res.status(404).json({ error: 'Foto no encontrada' });
    }

    if (photo.userId !== req.userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    // Eliminar archivo físico
    if (photo.photoUrl && photo.photoUrl.startsWith('/uploads')) {
      const filepath = path.join(__dirname, '../../..', photo.photoUrl);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }

    await prisma.user_photos.delete({ where: { id: photoId } });

    res.json({ ok: true });
  } catch (err) {
    console.error('deletePhoto error:', err.message);
    res.status(500).json({ error: 'Error al eliminar foto' });
  }
};

module.exports = {
  getPerfil,
  getPerfilPublico,
  updatePerfil,
  getAvatar,
  updateAvatar,
  deleteAvatar,
  uploadPhotos,
  deletePhoto
};

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
//   - updateAvatar() / deleteAvatar(): sube (valida + comprime con Sharp a
//     WebP) o borra la foto de perfil.
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
//   - req.io + req.onlineUsers → el aviso en vivo de "visita a tu perfil".
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

    const posts = await prisma.posts.findMany({
      where:   { autorId: userId },
      orderBy: { creadoEn:'desc' },
      take:    5,
      select:  { id:true, titulo:true, contenido:true, imagen:true, creadoEn:true, totalVistas:true }
    });

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

    const posts = await prisma.posts.findMany({
      where:   { autorId:profileUserId, privacidad:'PUBLICA' },
      orderBy: { creadoEn:'desc' },
      take:    5,
      select:  { id:true, titulo:true, contenido:true, imagen:true, creadoEn:true, totalVistas:true }
    });

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
    await sharp(tmpPath).rotate().resize(400,400,{ fit:'cover' }).webp({ quality:85 }).toFile(outPath);
    fs.unlinkSync(tmpPath);
    const url = `/uploads/imagenes/${outName}`;
    await prisma.users.update({ where:{ id:req.userId }, data:{ imagen:url } });
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
  updateAvatar,
  deleteAvatar,
  uploadPhotos,
  deletePhoto
};

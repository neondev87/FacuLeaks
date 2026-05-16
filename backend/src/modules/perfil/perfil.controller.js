const fs     = require('fs');
const path   = require('path');
const sharp  = require('sharp');
const crypto = require('crypto');
const prisma = require('../../config/db');
const { verificarMagicBytes } = require('../upload/upload.security');

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
      const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM profile_visits WHERE perfilId = ${userId}`;
      visitas = Number(result[0]?.count || 0);
    } catch (e) { console.error('[VISITAS] error:', e.message); }

    const posts = await prisma.posts.findMany({
      where:   { autorId: userId },
      orderBy: { creadoEn:'desc' },
      take:    5,
      select:  { id:true, titulo:true, contenido:true, imagen:true, creadoEn:true, totalVistas:true }
    });

    // Obtener fotos del usuario
    let photos = [];
    try {
      photos = await prisma.$queryRaw`SELECT id, photoUrl as url, uploadedAt FROM user_photos WHERE userId = ${userId} ORDER BY uploadedAt DESC LIMIT 6`;
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
    
    console.log(`[PERFIL_PUBLICO] visitorId=${visitorId}, profileUserId=${profileUserId}`);

    const user = await prisma.users.findUnique({
      where:  { id: profileUserId },
      select: { id:true, username:true, nombre:true, imagen:true, creadoEn:true }
    });
    
    console.log(`[PERFIL_PUBLICO] user found:`, user ? 'YES' : 'NO');
    
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
        await prisma.$executeRaw`INSERT INTO profile_visits (visitanteId, perfilId) VALUES (${visitorId}, ${profileUserId})`;
      }
      const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM profile_visits WHERE perfilId = ${profileUserId}`;
      visitas = Number(result[0]?.count || 0);
      const targetSocket = req.onlineUsers?.get(String(profileUserId));
      if (targetSocket) req.io.to(targetSocket).emit('profile:visit', { visitas });
    } catch (e) { console.error('[VISITAS] error:', e.message); }

    // Obtener fotos (solo públicas si no es el dueño)
    let photos = [];
    try {
      photos = await prisma.$queryRaw`SELECT id, photoUrl as url, uploadedAt FROM user_photos WHERE userId = ${profileUserId} ORDER BY uploadedAt DESC LIMIT 6`;
    } catch (e) { console.error('[PHOTOS] error:', e.message); }

    res.json({ user, profile:profile||{}, stats:{ amigos, vlogs, visitas }, posts, photos, isOwnProfile: visitorId===profileUserId });
    console.log(`[PERFIL_PUBLICO] Response sent successfully for userId=${profileUserId}`);
  } catch (err) {
    console.error('getPerfilPublico error:', err.message);
    console.error('Stack:', err.stack);
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

      // Insertar en tabla user_photos
      const result = await prisma.$executeRaw`
        INSERT INTO user_photos (userId, photoUrl, uploadedAt)
        VALUES (${req.userId}, ${photoUrl}, NOW())
      `;

      // Obtener el ID insertado
      const inserted = await prisma.$queryRaw`SELECT LAST_INSERT_ID() as id`;
      const photoId = Number(inserted[0]?.id);

      uploadedPhotos.push({
        id: photoId,
        url: photoUrl
      });
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

    // Verificar que la foto pertenece al usuario
    const photo = await prisma.$queryRaw`
      SELECT id, userId, photoUrl FROM user_photos WHERE id = ${photoId}
    `;

    if (!photo || photo.length === 0) {
      return res.status(404).json({ error: 'Foto no encontrada' });
    }

    if (photo[0].userId !== req.userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    // Eliminar archivo físico
    const photoUrl = photo[0].photoUrl;
    if (photoUrl && photoUrl.startsWith('/uploads')) {
      const filepath = path.join(__dirname, '../../..', photoUrl);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }

    // Eliminar de BD
    await prisma.$executeRaw`DELETE FROM user_photos WHERE id = ${photoId}`;

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
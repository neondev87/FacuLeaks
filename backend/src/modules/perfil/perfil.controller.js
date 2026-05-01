const fs     = require('fs');
const path   = require('path');
const sharp  = require('sharp');
const crypto = require('crypto');
const prisma = require('../../config/db');
const { verificarMagicBytes } = require('../upload/upload.security');

// GET /api/perfil
const getPerfil = async (req, res) => {
  try {
    const user = await prisma.users.findUnique({
      where:  { id: req.userId },
      select: { id:true, username:true, nombre:true, email:true, imagen:true, creadoEn:true }
    });

    const profile = await prisma.user_profiles.findUnique({
      where: { userId: req.userId }
    });

    const amigos = await prisma.amistades.count({
      where: {
        estado: 'ACEPTADO',
        OR: [{ solicitanteId: req.userId }, { receptorId: req.userId }]
      }
    });

    const vlogs = await prisma.posts.count({ where: { autorId: req.userId } });

    const posts = await prisma.posts.findMany({
      where:   { autorId: req.userId },
      orderBy: { creadoEn: 'desc' },
      take:    5,
      select:  { id:true, titulo:true, contenido:true, imagen:true, creadoEn:true, totalVistas:true }
    });

    res.json({
      user,
      profile: profile || {},
      stats: { amigos, vlogs, visitas: 0 },
      posts
    });
  } catch (err) {
    console.error('getPerfil error:', err.message);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

// PUT /api/perfil
const updatePerfil = async (req, res) => {
  const { bio, statusText, intereses, links, nombre } = req.body;
  try {
    const profile = await prisma.user_profiles.upsert({
      where:  { userId: req.userId },
      update: { bio, statusText, intereses, links },
      create: { userId: req.userId, bio, statusText, intereses, links }
    });

    // Actualizar nombre si viene
    if (nombre) {
      await prisma.users.update({
        where: { id: req.userId },
        data:  { nombre }
      });
    }

    res.json({ ok: true, profile });
  } catch (err) {
    console.error('updatePerfil error:', err.message);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
};

// PUT /api/perfil/avatar
const updateAvatar = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' });
  const tmpPath = req.file.path;

  try {
    if (!verificarMagicBytes(tmpPath, 'imagen')) {
      fs.unlinkSync(tmpPath);
      return res.status(400).json({ error: 'Archivo inválido' });
    }

    const hash    = crypto.randomBytes(16).toString('hex');
    const outName = `avatar_${req.userId}_${hash}.webp`;
    const outPath = path.join('uploads/imagenes', outName);

    await sharp(tmpPath)
      .rotate()
      .resize(400, 400, { fit: 'cover' })
      .webp({ quality: 85 })
      .toFile(outPath);

    fs.unlinkSync(tmpPath);

    const url = `/uploads/imagenes/${outName}`;

    await prisma.users.update({
      where: { id: req.userId },
      data:  { imagen: url }
    });

    res.json({ ok: true, url });
  } catch (err) {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    console.error('updateAvatar error:', err.message);
    res.status(500).json({ error: 'Error procesando avatar' });
  }
};

module.exports = { getPerfil, updatePerfil, updateAvatar };
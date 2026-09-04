// ════════════════════════════════════════════════════════════════════════
// MÓDULO: perfil/perfil.routes.js — mapa de URLs del perfil
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: define las rutas de "mi perfil" y "perfil de otro usuario" (la
// misma URL /perfil/:userId sirve para las dos cosas — perfil.controller.js
// decide adentro si sos el dueño o no), editar datos, subir/borrar avatar y
// subir/borrar fotos de la galería. Todas piden sesión.
//
// SE CONECTA CON: perfil.controller.js. Tiene su propia config de multer acá
// mismo (guarda temporalmente en uploads/tmp antes de que el controller la
// procese con Sharp). Montado en server.js bajo /api/perfil.
// ════════════════════════════════════════════════════════════════════════
const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const {
  getPerfil,
  getPerfilPublico,
  updatePerfil,
  getAvatar,
  updateAvatar,
  deleteAvatar,
  uploadPhotos,
  deletePhoto
} = require('./perfil.controller');
const { authMiddleware } = require('../../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/tmp'),
  filename:    (req, file, cb) => cb(null, `tmp_${Date.now()}_${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB por archivo
});

// Rutas — /avatar va ANTES de /:userId, si no Express toma "avatar" como un userId
router.get('/',              authMiddleware, getPerfil);
router.get('/avatar',        authMiddleware, getAvatar);
router.get('/:userId',       authMiddleware, getPerfilPublico);
router.put('/',              authMiddleware, updatePerfil);
router.put('/avatar',        authMiddleware, upload.single('file'), updateAvatar);
router.delete('/avatar',     authMiddleware, deleteAvatar);
router.post('/fotos',        authMiddleware, upload.array('photos', 10), uploadPhotos);
router.delete('/fotos/:id',  authMiddleware, deletePhoto);

module.exports = router;
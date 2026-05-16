const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const {
  getPerfil,
  getPerfilPublico,
  updatePerfil,
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

// Rutas
router.get('/',              authMiddleware, getPerfil);
router.get('/:userId',       authMiddleware, getPerfilPublico);
router.put('/',              authMiddleware, updatePerfil);
router.put('/avatar',        authMiddleware, upload.single('file'), updateAvatar);
router.delete('/avatar',     authMiddleware, deleteAvatar);
router.post('/fotos',        authMiddleware, upload.array('photos', 10), uploadPhotos);
router.delete('/fotos/:id',  authMiddleware, deletePhoto);

module.exports = router;
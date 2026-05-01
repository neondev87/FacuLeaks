const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const { getPerfil, updatePerfil, updateAvatar } = require('./perfil.controller');
const { authMiddleware } = require('../../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/tmp'),
  filename:    (req, file, cb) => cb(null, `tmp_${Date.now()}_${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/',        authMiddleware, getPerfil);
router.put('/',        authMiddleware, updatePerfil);
router.put('/avatar',  authMiddleware, upload.single('file'), updateAvatar);

module.exports = router;
const express = require('express');
const router  = express.Router();
const { authMiddleware } = require('../../middleware/auth');
const { multerImagen }   = require('../upload/upload.middleware');
const {
  getPerfil, updatePerfil, updateAvatar
} = require('./perfil.controller');

router.get('/',        authMiddleware, getPerfil);
router.put('/',        authMiddleware, updatePerfil);
router.put('/avatar',  authMiddleware, multerImagen.single('file'), updateAvatar);

module.exports = router;
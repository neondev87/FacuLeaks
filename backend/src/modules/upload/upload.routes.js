const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middleware/auth');
const { uploadImagen, uploadDocumento, importarUrl } = require('./upload.controller');
const { multerImagen, multerDocumento } = require('./upload.middleware');

router.post('/imagen',    authMiddleware, multerImagen.single('file'),    uploadImagen);
router.post('/documento', authMiddleware, multerDocumento.single('file'), uploadDocumento);
router.post('/url',       authMiddleware, importarUrl);

module.exports = router;
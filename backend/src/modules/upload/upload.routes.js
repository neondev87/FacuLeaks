// ════════════════════════════════════════════════════════════════════════
// MÓDULO: upload/upload.routes.js — mapa de URLs de subida de archivos
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: 3 rutas — subir una imagen suelta (para un post del muro),
// subir un documento (PDF/Word), e "importar" una URL (trae el título y la
// imagen de vista previa de un link, sin descargar el sitio entero). Todas
// piden sesión.
//
// SE CONECTA CON: upload.controller.js (la lógica) y
// upload.middleware.js (la config de multer que recibe el archivo antes de
// que el controller lo procese). Montado en server.js bajo /api/upload.
// ════════════════════════════════════════════════════════════════════════
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middleware/auth');
const { uploadImagen, uploadDocumento, importarUrl } = require('./upload.controller');
const { multerImagen, multerDocumento } = require('./upload.middleware');

router.post('/imagen',    authMiddleware, multerImagen.single('file'),    uploadImagen);
router.post('/documento', authMiddleware, multerDocumento.single('file'), uploadDocumento);
router.post('/url',       authMiddleware, importarUrl);

module.exports = router;
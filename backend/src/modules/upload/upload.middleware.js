// ════════════════════════════════════════════════════════════════════════
// MÓDULO: upload/upload.middleware.js — configuración de multer
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: define CÓMO se reciben los archivos que sube un usuario, antes
// de que cualquier controller los toque:
//   - dónde se guardan temporalmente (uploads/imagenes o uploads/documentos)
//   - qué nombre les pone (un hash random, nunca el nombre original del
//     usuario — evita colisiones y "path traversal" con nombres raros)
//   - un primer filtro por mimetype declarado (rápido, pero NO confiable
//     del todo — por eso el controller vuelve a chequear con magic bytes).
//   - el límite de tamaño (10MB imágenes, 20MB documentos).
//
// PARA QUÉ SIRVE: es la "primera puerta" antes de que un archivo llegue al
// controller. multer es la librería estándar de Express para esto.
//
// CON QUÉ SE CONECTA:
//   - Se usa en upload.routes.js Y también en chat.routes.js (reutiliza
//     `multerImagen` para las imágenes del chat — mismo pipeline que el muro).
//   - upload.controller.js recibe el archivo ya guardado por acá y recién
//     ahí hace la validación fuerte (upload.security.js).
// ════════════════════════════════════════════════════════════════════════
const multer = require('multer');
const path   = require('path');
const crypto = require('crypto');
const fs     = require('fs');

// Crear carpetas si no existen
['uploads/imagenes', 'uploads/documentos'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storageImagen = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/imagenes'),
  filename:    (req, file, cb) => {
    const hash = crypto.randomBytes(16).toString('hex');
    cb(null, `${hash}.tmp`); // Sharp lo convierte a .webp después
  }
});

const storageDocumento = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/documentos'),
  filename:    (req, file, cb) => {
    const hash = crypto.randomBytes(16).toString('hex');
    const ext  = path.extname(file.originalname).toLowerCase();
    cb(null, `${hash}${ext}`);
  }
});

// Validar MIME en multer (primera capa — magic bytes se validan en controller)
const filterImagen = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('TIPO_INVALIDO'));
};

const filterDocumento = (req, file, cb) => {
  const allowed = ['application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('TIPO_INVALIDO'));
};

const multerImagen = multer({
  storage: storageImagen,
  limits:  { fileSize: 10 * 1024 * 1024 }, // 10MB máx antes de comprimir
  fileFilter: filterImagen
});

const multerDocumento = multer({
  storage: storageDocumento,
  limits:  { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: filterDocumento
});

module.exports = { multerImagen, multerDocumento };
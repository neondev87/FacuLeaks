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
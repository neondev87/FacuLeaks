const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const { getConversaciones, getMensajes, sendAudio, deletemensaje } = require('./chat.controller');
const { authMiddleware } = require('../../middleware/auth');

// Multer para audio — guarda temporalmente
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/audios'),
  filename:    (req, file, cb) => {
    const ext = file.originalname.endsWith('.ogg') ? '.ogg' : '.webm';
    cb(null, `audio_${req.userId}_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype.startsWith('audio/');
    cb(ok ? null : new Error('Solo archivos de audio'), ok);
  },
});

router.get('/conversaciones',        authMiddleware, getConversaciones);
router.post('/audio/:receptorId',    authMiddleware, upload.single('audio'), sendAudio);
router.delete('/mensaje/:id',        authMiddleware, deletemensaje);
router.get('/:userId',               authMiddleware, getMensajes);

module.exports = router;
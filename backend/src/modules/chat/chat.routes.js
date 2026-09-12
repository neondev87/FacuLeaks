// ════════════════════════════════════════════════════════════════════════
// MÓDULO: chat/chat.routes.js — mapa de URLs del chat (la parte HTTP)
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: define las rutas de chat que van por HTTP normal (no por
// socket): listar conversaciones, traer el historial de mensajes, mandar
// un audio o una imagen, y borrar un mensaje. Mandar un mensaje de TEXTO
// en cambio va por socket (ver chat.socket.js) — es instantáneo, no espera
// respuesta HTTP.
//
// SE CONECTA CON: chat.controller.js (la lógica), upload/upload.middleware.js
// (reutiliza multerImagen para las imágenes del chat, mismo pipeline que el
// muro). Montado en server.js bajo /api/chat.
// ════════════════════════════════════════════════════════════════════════
const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const { getConversaciones, getMensajes, sendAudio, sendImagen, deletemensaje, getSocketTicket } = require('./chat.controller');
const { multerImagen } = require('../upload/upload.middleware');
const { authMiddleware } = require('../../middleware/auth');

// Multer para audio — guarda temporalmente
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/audios'),
  filename:    (req, file, cb) => {
    // El frontend ahora manda la extensión real según lo que soportó el
    // navegador al grabar (webm/opus en Chrome-Firefox, m4a/mp4 en Safari-
    // iOS — Safari no puede ni grabar ni reproducir WebM). Si no reconocemos
    // la extensión, mejor no asumir webm a ciegas: se cae a lo que diga el
    // mimetype real que reportó el navegador.
    const extMatch = /\.(webm|ogg|m4a|mp4)$/i.exec(file.originalname || '');
    const ext = extMatch ? extMatch[0].toLowerCase()
      : file.mimetype === 'audio/mp4' ? '.m4a' : '.webm';
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
router.get('/socket-ticket',         authMiddleware, getSocketTicket);
router.post('/audio/:receptorId',    authMiddleware, upload.single('audio'), sendAudio);
router.post('/imagen/:receptorId',   authMiddleware, multerImagen.single('imagen'), sendImagen);
router.delete('/mensaje/:id',        authMiddleware, deletemensaje);
router.get('/:userId',               authMiddleware, getMensajes);

module.exports = router;

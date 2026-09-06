// ════════════════════════════════════════════════════════════════════════
// MÓDULO: foro/foro.routes.js — mapa de URLs del foro
// ════════════════════════════════════════════════════════════════════════
// TODAS piden sesión (authMiddleware). La restricción de "solo el admin crea
// temas" se chequea dentro del controller (esAdmin), no acá.
// Montado en server.js bajo /api/foro.
// ════════════════════════════════════════════════════════════════════════
const express = require('express');
const router = express.Router();
const {
  getPermisos, listTemas, crearTema, borrarTema,
  listComentarios, crearComentario, borrarComentario,
} = require('./foro.controller');
const { authMiddleware } = require('../../middleware/auth');

router.get('/permisos',                     authMiddleware, getPermisos);
router.get('/temas',                        authMiddleware, listTemas);
router.post('/temas',                       authMiddleware, crearTema);
router.delete('/temas/:id',                 authMiddleware, borrarTema);
router.get('/temas/:id/comentarios',        authMiddleware, listComentarios);
router.post('/temas/:id/comentarios',       authMiddleware, crearComentario);
router.delete('/comentarios/:id',           authMiddleware, borrarComentario);

module.exports = router;

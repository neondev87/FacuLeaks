// ════════════════════════════════════════════════════════════════════════
// MÓDULO: notificaciones/notificaciones.routes.js — mapa de URLs de la campanita
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: listar las notificaciones propias y marcarlas todas como
// leídas. Ambas piden sesión. Montado en server.js bajo /api/notificaciones.
// ════════════════════════════════════════════════════════════════════════
const express = require('express');
const router  = express.Router();
const { getNotificaciones, marcarLeidas } = require('./notificaciones.controller');
const { authMiddleware } = require('../../middleware/auth');

router.get('/',        authMiddleware, getNotificaciones);
router.patch('/leidas', authMiddleware, marcarLeidas);

module.exports = router;

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: amigos/amigos.routes.js — mapa de URLs del sistema de amistad
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: define las rutas de buscar gente, mandar/aceptar/rechazar
// solicitudes de amistad y eliminar un amigo. Todas piden sesión.
//
// SE CONECTA CON: amigos.controller.js. Montado en server.js bajo /api/amigos.
// ════════════════════════════════════════════════════════════════════════
const express = require('express');
const router  = express.Router();
const { getAmigos, buscarUsuarios, enviarSolicitud, aceptarSolicitud, rechazarSolicitud, eliminarAmistad } = require('./amigos.controller');
const { authMiddleware } = require('../../middleware/auth');

router.get('/',                    authMiddleware, getAmigos);
router.get('/buscar',              authMiddleware, buscarUsuarios);
router.post('/solicitud/:userId',  authMiddleware, enviarSolicitud);
router.put('/aceptar/:amistadId',  authMiddleware, aceptarSolicitud);
router.put('/rechazar/:amistadId', authMiddleware, rechazarSolicitud);
router.delete('/:amistadId',       authMiddleware, eliminarAmistad);

module.exports = router;
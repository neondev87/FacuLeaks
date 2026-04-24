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
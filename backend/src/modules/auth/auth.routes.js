// ════════════════════════════════════════════════════════════════════════
// MÓDULO: auth/auth.routes.js — mapa de URLs de autenticación
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: define las 3 rutas del login/registro y dice qué función de
// auth.controller.js atiende cada una. Ninguna lleva authMiddleware porque
// las 3 son de ANTES de tener sesión (o tienen su propia protección):
//   - POST /register     → crear cuenta nueva
//   - GET  /check/:googleId → ¿existe esta cuenta de Google en la BD?
//   - POST /login        → solo la llama el propio frontend (server-to-server,
//                           protegida con un secreto interno, no con cookie)
//
// SE CONECTA CON: auth.controller.js (la lógica de cada ruta) y, desde
// server.js, queda montado bajo el prefijo /api/auth.
// ════════════════════════════════════════════════════════════════════════
const express = require('express');
const router = express.Router();
const { register, checkUser, login } = require('./auth.controller');

router.post('/register', register);
router.get('/check/:googleId', checkUser);
router.post('/login', login);

module.exports = router;
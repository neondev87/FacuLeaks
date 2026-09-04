// ════════════════════════════════════════════════════════════════════════
// MÓDULO: spotify/spotify.routes.js — mapa de URLs de la integración Spotify
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: define las 5 rutas de conectar Spotify. `callback` y
// `now-playing`/`recently-played` NO piden sesión a propósito — el callback
// porque es Spotify quien redirige ahí (no puede mandar tu cookie), y las
// otras dos porque se muestran en el perfil PÚBLICO de cualquiera (se
// protegen de otra forma: el estado firmado y el flag de privacidad, ver
// spotify.controller.js).
//
// SE CONECTA CON: spotify.controller.js. Montado en server.js bajo /api/spotify.
// ════════════════════════════════════════════════════════════════════════
const express = require('express');
const router  = express.Router();
const { authMiddleware } = require('../../middleware/auth');
const { spotifyAuth, spotifyCallback, nowPlaying, recentlyPlayed, disconnect } = require('./spotify.controller');

router.get('/auth',           authMiddleware, spotifyAuth);
router.get('/callback',       spotifyCallback);
router.get('/now-playing/:userId', nowPlaying);
router.get('/recently-played/:userId', recentlyPlayed);
router.delete('/disconnect',  authMiddleware, disconnect);


module.exports = router;
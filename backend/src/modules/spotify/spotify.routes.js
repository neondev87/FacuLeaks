const express = require('express');
const router  = express.Router();
const { authMiddleware } = require('../../middleware/auth');
const { spotifyAuth, spotifyCallback, nowPlaying, disconnect } = require('./spotify.controller');

router.get('/auth',           authMiddleware, spotifyAuth);
router.get('/callback',       spotifyCallback);
router.get('/now-playing/:userId', nowPlaying);
router.delete('/disconnect',  authMiddleware, disconnect);

module.exports = router;
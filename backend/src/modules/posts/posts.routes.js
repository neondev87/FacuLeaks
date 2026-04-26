const express = require('express');
const router = express.Router();
const { feedRecientes, feedTrending, feedSiguiendo, nuevoPost } = require('./posts.controller');
const { authMiddleware } = require('../../middleware/auth');

router.get('/feed/recientes',  authMiddleware, feedRecientes);
router.get('/feed/trending',   feedTrending);
router.get('/feed/siguiendo',  authMiddleware, feedSiguiendo);
router.post('/',               authMiddleware, nuevoPost);

module.exports = router;
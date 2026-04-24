const express = require('express');
const router  = express.Router();
const { getConversaciones, getMensajes } = require('./chat.controller');
const { authMiddleware } = require('../../middleware/auth');

router.get('/conversaciones', authMiddleware, getConversaciones);
router.get('/:userId',        authMiddleware, getMensajes);

module.exports = router;
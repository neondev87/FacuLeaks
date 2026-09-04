const express = require('express');
const router = express.Router();
const {
  feedRecientes, feedTrending, feedSiguiendo, nuevoPost, deletePost,
  toggleReaction, listComments, createComment, deleteComment,
} = require('./posts.controller');
const { authMiddleware } = require('../../middleware/auth');

router.get('/feed/recientes',  authMiddleware, feedRecientes);
router.get('/feed/trending',   authMiddleware, feedTrending);
router.get('/feed/siguiendo',  authMiddleware, feedSiguiendo);
router.post('/',               authMiddleware, nuevoPost);
router.delete('/:id',          authMiddleware, deletePost);

// B2 · reacciones
router.post('/:id/react',      authMiddleware, toggleReaction);

// B3 · comentarios
router.get('/:id/comments',                 authMiddleware, listComments);
router.post('/:id/comments',                authMiddleware, createComment);
router.delete('/:postId/comments/:commentId', authMiddleware, deleteComment);

module.exports = router;

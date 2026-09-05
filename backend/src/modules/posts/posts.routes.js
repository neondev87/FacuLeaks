// ════════════════════════════════════════════════════════════════════════
// MÓDULO: posts/posts.routes.js — mapa de URLs del muro (feed)
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: define TODAS las rutas de posts, reacciones y comentarios.
// TODAS piden sesión (authMiddleware) — hasta /feed/trending, que antes era
// pública y se cerró porque ahora necesita saber quién sos para decirte
// "vos ya reaccionaste a este post con qué".
//
// SE CONECTA CON: posts.controller.js (toda la lógica). Montado en
// server.js bajo el prefijo /api/posts.
// ════════════════════════════════════════════════════════════════════════
const express = require('express');
const router = express.Router();
const {
  feedRecientes, feedTrending, feedSiguiendo, nuevoPost, deletePost,
  toggleReaction, toggleShare, listComments, createComment, deleteComment,
} = require('./posts.controller');
const { authMiddleware } = require('../../middleware/auth');

router.get('/feed/recientes',  authMiddleware, feedRecientes);
router.get('/feed/trending',   authMiddleware, feedTrending);
router.get('/feed/siguiendo',  authMiddleware, feedSiguiendo);
router.post('/',               authMiddleware, nuevoPost);
router.delete('/:id',          authMiddleware, deletePost);

// B2 · reacciones
router.post('/:id/react',      authMiddleware, toggleReaction);

// Compartir (toggle: solo posts públicos, solo visible en el perfil del que comparte)
router.post('/:id/share',      authMiddleware, toggleShare);

// B3 · comentarios
router.get('/:id/comments',                 authMiddleware, listComments);
router.post('/:id/comments',                authMiddleware, createComment);
router.delete('/:postId/comments/:commentId', authMiddleware, deleteComment);

module.exports = router;

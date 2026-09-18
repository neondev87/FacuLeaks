// ════════════════════════════════════════════════════════════════════════
// MÓDULO: lib/commentTree.js — arma el árbol de un hilo de comentarios
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: hooks/usePostComments.js guarda los comentarios de un post FLAT
// (cada uno con `parentId`, sea de primer nivel o respuesta a otro
// comentario específico). Esta función junta cada respuesta bajo su padre
// en `replies` — sin límite de profundidad (una respuesta puede tener sus
// propias respuestas). La comparten components/feed/PostComments.js y
// components/PostCard.js, que son quienes DIBUJAN el árbol resultante
// (cada uno con su propio diseño).
// ════════════════════════════════════════════════════════════════════════
export function buildCommentTree(comments) {
  const byId = new Map();
  (comments || []).forEach(c => byId.set(c.id, { ...c, replies: [] }));

  const roots = [];
  byId.forEach(c => {
    const parent = c.parentId != null ? byId.get(c.parentId) : null;
    if (parent) parent.replies.push(c);
    else roots.push(c);
  });
  return roots;
}

// Total de comentarios "planos" que cuelgan de un nodo (él mismo no se
// cuenta) — útil para un "N respuestas" en el botón de desplegar hilo.
export function countReplies(node) {
  return (node.replies || []).reduce((acc, r) => acc + 1 + countReplies(r), 0);
}

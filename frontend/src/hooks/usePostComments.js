"use client";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: hooks/usePostComments.js — comentarios de UN post
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: recibe un `postId` y un `enabled` (true cuando el usuario abrió
// ese hilo de comentarios). Mientras está abierto: carga los comentarios,
// permite agregar/borrar/likear, y abre un socket para enterarse en vivo si
// otro usuario comenta, borra o likea un comentario de ESE post. Al
// cerrarse, corta el socket (no tiene sentido escuchar algo que no se está
// mostrando).
//
// `comments` queda FLAT (cada uno con `parentId`, `totalLikes`, `myLiked`)
// — `add(contenido, parentId)` manda `parentId` cuando es una RESPUESTA a un
// comentario específico (sub-comentario), no cuando es de primer nivel. Es
// el componente que dibuja el hilo el que arma el árbol (ver
// lib/commentTree.js) — el hook no sabe de anidamiento, solo guarda la lista.
//
// PARA QUÉ SIRVE: es un hook COMPARTIDO — tanto la PostCard del feed
// (components/feed/PostCard.js) como la del perfil (components/PostCard.js)
// lo usan, así la lógica de comentarios está escrita una sola vez aunque
// haya dos diseños distintos de tarjeta.
//
// CON QUÉ SE CONECTA:
//   - backend: GET/POST/DELETE /api/posts/:id/comments +
//     POST /api/posts/:postId/comments/:commentId/like (posts.controller.js).
//   - Socket.io: post:comment / post:comment:deleted / post:comment:like.
//   - Lo consumen: components/feed/PostComments.js y components/PostCard.js.
// ════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from "react";
import { API } from "@/lib/api";
import { createAuthedSocket } from "@/lib/socket";
export default function usePostComments(postId, enabled) {
  const [comments, setComments] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [sending,  setSending]  = useState(false);

  const upsert = useCallback((comment) => {
    setComments(prev => prev.some(c => c.id === comment.id) ? prev : [...prev, comment]);
  }, []);

  const load = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/posts/${postId}/comments`, { credentials: "include" });
      const data = await res.json();
      setComments(data.comments || []);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  // Recarga cada vez que se abre el hilo (no solo la primera): así no queda
  // desincronizado si cambió mientras estaba colapsado sin socket.
  useEffect(() => {
    if (enabled) load();
  }, [enabled, load]);

  useEffect(() => {
    if (!enabled || !postId) return;
    const socket = createAuthedSocket();
    socket.on("post:comment", ({ postId: pid, comment }) => {
      if (pid === postId && comment) upsert(comment);
    });
    // El borrado de un comentario con respuestas cae en cascada en la base
    // (parentId → ON DELETE CASCADE) — el backend junta todos los ids
    // afectados en `commentIds` para que acá se saquen todos de una, no
    // solo el que se clickeó (si no, las respuestas quedaban huérfanas en
    // la UI hasta recargar).
    socket.on("post:comment:deleted", ({ postId: pid, commentId, commentIds }) => {
      if (pid !== postId) return;
      const ids = commentIds || [commentId];
      setComments(prev => prev.filter(c => !ids.includes(c.id)));
    });
    socket.on("post:comment:like", ({ postId: pid, commentId, totalLikes }) => {
      if (pid !== postId) return;
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, totalLikes } : c));
    });
    return () => { socket.disconnect(); };
  }, [enabled, postId, upsert]);

  // `parentId`: si viene, este comentario es una RESPUESTA a ese comentario
  // específico (sub-comentario) en vez de uno de primer nivel.
  const add = useCallback(async (contenido, parentId) => {
    const texto = String(contenido || "").trim();
    if (!texto || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${API}/api/posts/${postId}/comments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido: texto, parentId: parentId ?? null }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.comment) upsert(data.comment);
      return true;
    } catch {
      return false;
    } finally {
      setSending(false);
    }
  }, [postId, sending, upsert]);

  const remove = useCallback(async (commentId) => {
    // Optimista, y se lleva también cualquier respuesta que ya tuviera
    // cargada localmente — mismo criterio que la cascada del backend.
    const descendants = new Set();
    const collect = (id) => {
      comments.forEach(c => { if (c.parentId === id && !descendants.has(c.id)) { descendants.add(c.id); collect(c.id); } });
    };
    collect(commentId);
    const ids = [commentId, ...descendants];
    setComments(prev => prev.filter(c => !ids.includes(c.id)));
    try {
      const res = await fetch(`${API}/api/posts/${postId}/comments/${commentId}`, {
        method: "DELETE",
        credentials: "include",
      });
      // BUG encontrado: antes no se chequeaba res.ok — si el backend rechazaba
      // el borrado (403/404/500), la UI igual lo mostraba borrado hasta que
      // se recargaba el hilo, momento en el que volvía a aparecer (el
      // comentario nunca se había borrado de verdad). Ahora un status no-ok
      // revierte igual que un error de red.
      if (!res.ok) throw new Error();
    } catch {
      load(); // revertir con el estado real del servidor
    }
  }, [postId, load, comments]);

  // Like/unlike de un comentario o sub-comentario — optimista (revierte solo
  // si el backend lo rechaza), mismo patrón que toggleReaction de posts pero
  // sin dislike: acá alcanza con un booleano.
  const toggleLike = useCallback(async (commentId) => {
    let prevState = null;
    setComments(prev => prev.map(c => {
      if (c.id !== commentId) return c;
      prevState = { myLiked: c.myLiked, totalLikes: c.totalLikes };
      const myLiked = !c.myLiked;
      return { ...c, myLiked, totalLikes: Math.max(0, (c.totalLikes || 0) + (myLiked ? 1 : -1)) };
    }));
    try {
      const res = await fetch(`${API}/api/posts/${postId}/comments/${commentId}/like`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, myLiked: data.liked, totalLikes: data.totalLikes } : c));
    } catch {
      if (prevState) setComments(prev => prev.map(c => c.id === commentId ? { ...c, ...prevState } : c));
    }
  }, [postId]);

  return { comments, loading, sending, add, remove, toggleLike, reload: load };
}

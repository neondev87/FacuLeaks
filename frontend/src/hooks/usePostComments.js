"use client";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: hooks/usePostComments.js — comentarios de UN post
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: recibe un `postId` y un `enabled` (true cuando el usuario abrió
// ese hilo de comentarios). Mientras está abierto: carga los comentarios,
// permite agregar/borrar, y abre un socket para enterarse en vivo si otro
// usuario comenta o borra un comentario de ESE post. Al cerrarse, corta el
// socket (no tiene sentido escuchar algo que no se está mostrando).
//
// PARA QUÉ SIRVE: es un hook COMPARTIDO — tanto la PostCard del feed
// (components/feed/PostCard.js) como la del perfil (components/PostCard.js)
// lo usan, así la lógica de comentarios está escrita una sola vez aunque
// haya dos diseños distintos de tarjeta.
//
// CON QUÉ SE CONECTA:
//   - backend: GET/POST/DELETE /api/posts/:id/comments (posts.controller.js).
//   - Socket.io: post:comment / post:comment:deleted.
//   - Lo consumen: components/feed/PostComments.js y components/PostCard.js.
// ════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import { API, SOCKET_URL } from "@/lib/api";
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
    const socket = io(SOCKET_URL);
    socket.on("post:comment", ({ postId: pid, comment }) => {
      if (pid === postId && comment) upsert(comment);
    });
    socket.on("post:comment:deleted", ({ postId: pid, commentId }) => {
      if (pid === postId) setComments(prev => prev.filter(c => c.id !== commentId));
    });
    return () => { socket.disconnect(); };
  }, [enabled, postId, upsert]);

  const add = useCallback(async (contenido) => {
    const texto = String(contenido || "").trim();
    if (!texto || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${API}/api/posts/${postId}/comments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido: texto }),
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
    setComments(prev => prev.filter(c => c.id !== commentId)); // optimista
    try {
      await fetch(`${API}/api/posts/${postId}/comments/${commentId}`, {
        method: "DELETE",
        credentials: "include",
      });
    } catch {
      load(); // revertir
    }
  }, [postId, load]);

  return { comments, loading, sending, add, remove, reload: load };
}

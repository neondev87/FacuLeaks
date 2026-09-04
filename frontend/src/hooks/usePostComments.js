"use client";

import { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import { API } from "@/lib/api";

// B3 · Comentarios de un post. Compartido por la PostCard del feed y la de perfil.
// Carga bajo demanda (cuando `enabled` pasa a true), envía/borra contra el backend
// y se mantiene en vivo por socket (post:comment / post:comment:deleted) mientras
// el hilo está abierto.
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
    const socket = io(API);
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

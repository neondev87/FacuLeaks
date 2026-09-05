"use client";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: hooks/usePublicProfile.js — perfil de OTRO usuario
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: pide el perfil por id al backend. Si resulta que el perfil que
// estás mirando es el TUYO, te manda solo a /perfil (el perfil propio tiene
// su propia página con edición, este solo muestra). También escucha en vivo
// el evento de "alguien visitó este perfil" para actualizar el contador de
// visitas sin recargar la página.
//
// PARA QUÉ SIRVE: es el hook de app/perfil/[id]/page.js.
//
// CON QUÉ SE CONECTA:
//   - backend: GET /api/perfil/:userId (vía el rewrite /api/perfil/* de
//     next.config.js, no llamando directo al puerto 4000).
//   - Socket.io: profile:visit (lo emite perfil.controller.js del backend).
//   - Lo consume: app/perfil/[id]/page.js.
// ════════════════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { API, SOCKET_URL } from "@/lib/api";
export default function usePublicProfile({ userId, status, session, router }) {
  const [perfil,      setPerfil]      = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [notFound,    setNotFound]    = useState(false);
  const [photos,      setPhotos]      = useState([]);

  const fetchPerfil = async () => {
    if (!userId || !session?.user?.dbId) return;
    setLoading(true);
    try {
      // Vía rewrite de next.config.js → backend
      const res = await fetch(`/api/perfil/${userId}`, { credentials: "include" });

      if (res.status === 404) { setNotFound(true); setLoading(false); return; }
      if (!res.ok) throw new Error("Response not OK");

      const data = await res.json();

      // Si es tu propio perfil, redirigir a /perfil
      if (data.isOwnProfile) {
        router.push("/perfil");
        return;
      }

      setPerfil(data);
      if (data.photos) setPhotos(data.photos);
    } catch (err) {
      console.error("usePublicProfile error:", err.message);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && userId) fetchPerfil();
  }, [status, userId]);

  useEffect(() => {
    if (!session?.user?.dbId) return;
    const socket = io(SOCKET_URL);
    socket.emit("user:connect", session.user.dbId);
    socket.on("profile:visit", ({ visitas }) => {
      setPerfil(prev => prev ? { ...prev, stats: { ...prev.stats, visitas } } : prev);
    });
    // El dueño de este perfil (o el autor de alguno de sus posts, que acá
    // siempre es él mismo) cambió su foto — reflejarlo sin recargar.
    socket.on("user:avatar", ({ userId, imagen }) => {
      setPerfil(prev => {
        if (!prev || Number(prev.user?.id) !== Number(userId)) return prev;
        return {
          ...prev,
          user: { ...prev.user, imagen },
          posts: (prev.posts || []).map(p =>
            p.autor ? { ...p, autor: { ...p.autor, imagen } } : p
          ),
        };
      });
    });
    return () => socket.disconnect();
  }, [session?.user?.dbId]);

  // LIKE/DISLIKE en los posts de un perfil ajeno — mismo endpoint y misma
  // lógica optimista que hooks/useFeedPosts.js/useOwnProfile.js, acá contra
  // `perfil.posts` (el estado vive adentro de `perfil`, no aparte).
  const toggleReaction = async (postId, tipo) => {
    let previo = { myReaction: null, totalLikes: 0, totalDislikes: 0 };
    setPerfil(prev => {
      if (!prev) return prev;
      const posts = prev.posts.map(p => {
        if (p.id !== postId) return p;
        previo = { myReaction: p.myReaction ?? null, totalLikes: p.totalLikes ?? 0, totalDislikes: p.totalDislikes ?? 0 };
        let { totalLikes, totalDislikes } = previo;
        if (previo.myReaction === "LIKE")    totalLikes--;
        if (previo.myReaction === "DISLIKE") totalDislikes--;
        const myReaction = previo.myReaction === tipo ? null : tipo;
        if (myReaction === "LIKE")    totalLikes++;
        if (myReaction === "DISLIKE") totalDislikes++;
        return { ...p, myReaction, totalLikes: Math.max(0, totalLikes), totalDislikes: Math.max(0, totalDislikes) };
      });
      return { ...prev, posts };
    });
    try {
      const res = await fetch(`${API}/api/posts/${postId}/react`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPerfil(prev => prev ? { ...prev, posts: prev.posts.map(p =>
        p.id === postId ? { ...p, myReaction: data.myReaction, totalLikes: data.totalLikes, totalDislikes: data.totalDislikes } : p
      ) } : prev);
    } catch {
      setPerfil(prev => prev ? { ...prev, posts: prev.posts.map(p => p.id === postId ? { ...p, ...previo } : p) } : prev);
    }
  };

  return { perfil, loading, notFound, photos, lightboxSrc, setLightboxSrc, fetchPerfil, toggleReaction };
}

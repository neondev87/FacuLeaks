"use client";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: hooks/useFeedPosts.js — cerebro del feed (muro)
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE:
//   - Carga los posts según la pestaña activa (RECIENTES/TRENDING/SIGUIENDO).
//   - Abre UN socket compartido para todo el feed y escucha en vivo:
//     post:new, post:deleted, post:react (cuenta de likes/dislikes de
//     CUALQUIER usuario) y post:comment (contador de comentarios).
//   - toggleReaction(): cuando VOS reaccionás a un post, actualiza el
//     número al toque en pantalla ("optimista", sin esperar al servidor) y
//     después confirma con la respuesta real — si algo falla, recarga para
//     no quedar con un número mentiroso.
//
// PARA QUÉ SIRVE: es el hook que usa app/feed/page.js para no tener toda
// esta lógica mezclada con el JSX de la página.
//
// CON QUÉ SE CONECTA:
//   - backend: GET /api/posts/feed/{recientes,trending,siguiendo},
//     POST /api/posts/:id/react (posts.controller.js).
//   - Socket.io: eventos emitidos desde posts.controller.js en el backend.
//   - Lo consume: app/feed/page.js, que pasa `toggleReaction` a
//     components/feed/PostCard.js.
// ════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import { API, SOCKET_URL } from "@/lib/api";

let feedSocket = null;

// Carga de posts según la pestaña activa + realtime por socket
// (post:new / post:deleted / post:react / post:comment) + refresco periódico de
// TRENDING + contador de posts nuevos.
export default function useFeedPosts({ activeTab, status, session }) {
  const [posts,     setPosts]     = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [newCount,  setNewCount]  = useState(0);
  const [ownImagen, setOwnImagen] = useState(null);

  const activeTabRef  = useRef(activeTab);
  const trendingTimer = useRef(null);

  useEffect(() => {
    activeTabRef.current = activeTab;
    setNewCount(0);
  }, [activeTab]);

  const loadPosts = useCallback(async (tab) => {
    setLoading(true);
    setPosts([]);
    try {
      const endpoints = {
        RECIENTES: `${API}/api/posts/feed/recientes`,
        TRENDING:  `${API}/api/posts/feed/trending`,
        SIGUIENDO: `${API}/api/posts/feed/siguiendo`,
      };
      const res  = await fetch(endpoints[tab], { credentials:"include" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPosts(data.posts || []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") loadPosts(activeTab);
  }, [activeTab, status, loadPosts]);

  // Tu propio avatar (para el "◈" del composer) — endpoint liviano dedicado,
  // no el /api/perfil completo (que trae stats/posts/fotos de más).
  useEffect(() => {
    if (status !== "authenticated") return;
    (async () => {
      try {
        const res  = await fetch(`${API}/api/perfil/avatar`, { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        setOwnImagen(data.imagen || null);
      } catch {}
    })();
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.dbId) return;
    feedSocket = io(SOCKET_URL);
    feedSocket.emit("user:connect", session.user.dbId);
    // Alguien (vos u otro usuario cuyos posts están en el feed) cambió su
    // foto de perfil — actualizar en vivo sin recargar.
    feedSocket.on("user:avatar", ({ userId, imagen }) => {
      if (String(userId) === String(session.user.dbId)) setOwnImagen(imagen);
      setPosts(prev => prev.map(p =>
        Number(p.autor?.id) === Number(userId) ? { ...p, autor: { ...p.autor, imagen } } : p
      ));
    });
    feedSocket.on("post:new", (post) => {
      const tab = activeTabRef.current;
      if (tab === "RECIENTES" && post.privacidad === "PUBLICA") {
        setPosts(prev => [post, ...prev]);
        setNewCount(prev => prev + 1);
      }
      if (tab === "SIGUIENDO") loadPosts("SIGUIENDO");
    });
    feedSocket.on("post:deleted", ({ id }) => {
      setPosts(prev => prev.filter(p => p.id !== id));
    });
    // B2 · reacciones de cualquier usuario → refrescar totales (sin tocar myReaction)
    feedSocket.on("post:react", ({ postId, totalLikes, totalDislikes }) => {
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, totalLikes, totalDislikes } : p
      ));
    });
    // B3 · contador de comentarios en vivo
    const applyCommentCount = ({ postId, totalComentarios }) => {
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, totalComentarios, _count: { ...p._count, comments: totalComentarios } }
          : p
      ));
    };
    feedSocket.on("post:comment", applyCommentCount);
    feedSocket.on("post:comment:deleted", applyCommentCount);

    trendingTimer.current = setInterval(() => {
      if (activeTabRef.current === "TRENDING") loadPosts("TRENDING");
    }, 60000);
    return () => {
      feedSocket?.disconnect();
      feedSocket = null;
      clearInterval(trendingTimer.current);
    };
  }, [status, session, loadPosts]);

  const removePost = useCallback((id) => {
    setPosts(prev => prev.filter(p => p.id !== id));
  }, []);

  const resetNewCount = useCallback(() => setNewCount(0), []);

  // B2 · alterna LIKE / DISLIKE con update optimista + reconciliación con el backend
  const toggleReaction = useCallback(async (postId, tipo) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      let likes    = p.totalLikes ?? 0;
      let dislikes = p.totalDislikes ?? 0;
      if (p.myReaction === "LIKE")    likes--;
      if (p.myReaction === "DISLIKE") dislikes--;
      const myReaction = p.myReaction === tipo ? null : tipo;
      if (myReaction === "LIKE")    likes++;
      if (myReaction === "DISLIKE") dislikes++;
      return { ...p, myReaction, totalLikes: Math.max(0, likes), totalDislikes: Math.max(0, dislikes) };
    }));
    try {
      const res = await fetch(`${API}/api/posts/${postId}/react`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, myReaction: data.myReaction, totalLikes: data.totalLikes, totalDislikes: data.totalDislikes }
          : p
      ));
    } catch {
      loadPosts(activeTabRef.current); // revertir al estado real
    }
  }, [loadPosts]);

  // Compartir (toggle): solo posts públicos — el backend rechaza el resto.
  // No hay socket ni recuento local de "en qué feeds aparece": compartir no
  // cambia nada en el muro, solo en el perfil del que comparte. Si el
  // request falla, revierte SOLO ese post (no recarga todo el feed como
  // toggleReaction — recargar toda la lista se sentía como que "la página
  // se recarga" ante cualquier error, por ejemplo mientras el backend
  // todavía no tiene la migración de post_shares aplicada).
  const toggleShare = useCallback(async (postId) => {
    const previo = { myShared: false, totalCompartidos: 0 };
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      previo.myShared = !!p.myShared;
      previo.totalCompartidos = p.totalCompartidos ?? 0;
      const myShared = !p.myShared;
      const totalCompartidos = Math.max(0, previo.totalCompartidos + (myShared ? 1 : -1));
      return { ...p, myShared, totalCompartidos };
    }));
    try {
      const res = await fetch(`${API}/api/posts/${postId}/share`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, myShared: data.shared, totalCompartidos: data.totalCompartidos } : p
      ));
    } catch {
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, myShared: previo.myShared, totalCompartidos: previo.totalCompartidos } : p
      ));
    }
  }, []);

  return { posts, loading, newCount, resetNewCount, removePost, toggleReaction, toggleShare, ownImagen };
}

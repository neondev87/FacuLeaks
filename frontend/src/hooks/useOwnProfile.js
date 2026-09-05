"use client";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: hooks/useOwnProfile.js — TU perfil (edición incluida)
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: carga tu perfil completo, guarda cambios (bio, intereses,
// links...), borra tus posts, y muestra un "toast" (mensajito temporal) al
// guardar. Tiene una recuperación automática importante: si el backend
// responde 401 (cookie de sesión vencida o perdida, por ejemplo porque el
// backend se reinició), en vez de mostrar error redirige solo a
// /api/auth/sync-backend para conseguir una cookie nueva y vuelve a esta
// misma página — el usuario ni se entera.
//
// PARA QUÉ SIRVE: es el hook de app/perfil/page.js (el perfil PROPIO, no
// el público — ese usa usePublicProfile).
//
// CON QUÉ SE CONECTA:
//   - backend: GET/PUT /api/perfil, DELETE /api/posts/:id.
//   - app/api/auth/sync-backend/route.js → a donde redirige si hay 401.
//   - Lo consume: app/perfil/page.js.
// ════════════════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";
import { API } from "@/lib/api";
export default function useOwnProfile({ status, session }) {
  const [perfil,      setPerfil]      = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [showEdit,    setShowEdit]    = useState(false);
  const [saveMsg,     setSaveMsg]     = useState("");
  const [localPosts,  setLocalPosts]  = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [photos,      setPhotos]      = useState([]);

  const toast = msg => { setSaveMsg(msg); setTimeout(() => setSaveMsg(""), 2500); };

  const fetchPerfil = async () => {
    if (!session?.user?.dbId) return;
    try {
      let res = await fetch(`${API}/api/perfil`, { credentials: "include" });
      if (res.status === 401) {
        // Cookie del backend caída/expirada: re-sincronizar vía el route
        // server de Next y volver a esta misma página. El flag _sync_done
        // (que agrega sync-backend) evita un bucle si la re-sync no alcanza.
        if (!new URLSearchParams(window.location.search).has("_sync_done")) {
          const back = encodeURIComponent(window.location.pathname);
          window.location.href = `/api/auth/sync-backend?callbackUrl=${back}`;
          return;
        }
        throw new Error("sesión backend no disponible");
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPerfil(data);
      setLocalPosts(data.posts || []);
      if (data.photos) setPhotos(data.photos);
    } catch (err) {
      console.error("Error cargando perfil:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") fetchPerfil();
  }, [status, session]);

  const handleSave = async fields => {
    try {
      const res  = await fetch(`${API}/api/perfil`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await res.json();
      if (data.ok) { await fetchPerfil(); setShowEdit(false); toast("Perfil guardado"); }
    } catch {}
  };

  const handleDeletePost = async postId => {
    try {
      await fetch(`${API}/api/posts/${postId}`, { method: "DELETE", credentials: "include" });
      setLocalPosts(prev => prev.filter(p => p.id !== postId));
    } catch {}
  };

  // Descompartir: mismo endpoint toggle que compartir (POST /api/posts/:id/share)
  // — postId acá es el id del post ORIGINAL, no del registro de share.
  const handleUnshare = async postId => {
    try {
      await fetch(`${API}/api/posts/${postId}/share`, { method: "POST", credentials: "include" });
      setLocalPosts(prev => prev.filter(p => p.id !== postId || !p.isShared));
    } catch {}
  };

  // LIKE/DISLIKE en los posts del perfil — mismo endpoint y misma lógica
  // optimista que hooks/useFeedPosts.js (toggleReaction), solo que acá el
  // estado local es `localPosts` en vez de la lista del muro.
  const toggleReaction = async (postId, tipo) => {
    const posts = localPosts ?? perfil?.posts ?? [];
    let previo = { myReaction: null, totalLikes: 0, totalDislikes: 0 };
    const next = posts.map(p => {
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
    setLocalPosts(next);
    try {
      const res = await fetch(`${API}/api/posts/${postId}/react`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLocalPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, myReaction: data.myReaction, totalLikes: data.totalLikes, totalDislikes: data.totalDislikes } : p
      ));
    } catch {
      setLocalPosts(prev => prev.map(p => p.id === postId ? { ...p, ...previo } : p));
    }
  };

  const posts = localPosts ?? perfil?.posts ?? [];

  return {
    perfil, setPerfil,
    loading,
    showEdit, setShowEdit,
    saveMsg,
    posts,
    lightboxSrc, setLightboxSrc,
    photos,
    handleSave, handleDeletePost, handleUnshare, toggleReaction,
  };
}

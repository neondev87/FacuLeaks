"use client";

import { useState, useEffect } from "react";
import { API } from "@/lib/api";

// Estado y acciones del perfil propio (/perfil): carga, guardado del modal,
// borrado de posts y toast. Incluye la recuperación de sesión de Fase 1
// (401 -> /api/auth/sync-backend). Sin cambios de comportamiento.
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

  const posts = localPosts ?? perfil?.posts ?? [];

  return {
    perfil, setPerfil,
    loading,
    showEdit, setShowEdit,
    saveMsg,
    posts,
    lightboxSrc, setLightboxSrc,
    photos,
    handleSave, handleDeletePost,
  };
}

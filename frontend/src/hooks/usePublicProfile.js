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
import { API } from "@/lib/api";
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
    const socket = io(API);
    socket.emit("user:connect", session.user.dbId);
    socket.on("profile:visit", ({ visitas }) => {
      setPerfil(prev => prev ? { ...prev, stats: { ...prev.stats, visitas } } : prev);
    });
    return () => socket.disconnect();
  }, [session?.user?.dbId]);

  return { perfil, loading, notFound, photos, lightboxSrc, setLightboxSrc, fetchPerfil };
}

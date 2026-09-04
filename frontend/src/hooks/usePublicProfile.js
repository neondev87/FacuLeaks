"use client";

import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { API } from "@/lib/api";

// Estado y carga del perfil público (/perfil/[id]): fetch por id, redirect a
// /perfil si es el propio, y refresco de "visitas" por socket.
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

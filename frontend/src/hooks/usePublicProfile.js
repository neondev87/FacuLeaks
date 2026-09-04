"use client";

import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { API } from "@/lib/api";

// Estado y carga del perfil público (/perfil/[id]): fetch por id, redirect a
// /perfil si es el propio, y refresco de "visitas" por socket. Sin cambios
// de comportamiento respecto al inline.
export default function usePublicProfile({ userId, status, session, router }) {
  const [perfil,      setPerfil]      = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [notFound,    setNotFound]    = useState(false);
  const [photos,      setPhotos]      = useState([]);
  const [sonAmigos,   setSonAmigos]   = useState(false);

  const fetchPerfil = async () => {
    if (!userId || !session?.user?.dbId) return;
    setLoading(true);
    try {
      console.log('[FETCH_PERFIL] Fetching userId:', userId);
      // ← CAMBIO: Usar proxy de Next.js en lugar de URL directa
      const res  = await fetch(`/api/perfil/${userId}`, { credentials:"include" });
      console.log('[FETCH_PERFIL] Response status:', res.status);

      if (res.status === 404) { setNotFound(true); setLoading(false); return; }
      if (!res.ok) throw new Error('Response not OK');

      const data = await res.json();
      console.log('[FETCH_PERFIL] Data received:', data);

      // ← Si es tu propio perfil, redirigir a /perfil
      if (data.isOwnProfile) {
        console.log('[FETCH_PERFIL] isOwnProfile=true, redirecting to /perfil');
        router.push('/perfil');
        return;
      }

      setPerfil(data);
      if (data.photos) setPhotos(data.photos);

      // ← HARDCODE TEMPORAL: Activar "son amigos" para testing
      // TODO: Implementar endpoint /api/amistades/verificar/:userId en el backend
      setSonAmigos(true);

      /* COMENTADO HASTA CREAR EL ENDPOINT EN EL BACKEND
      // ← verificar si son amigos
      if (data.stats?.amigos > 0 && !data.isOwnProfile) {
        const amigosRes = await fetch(`/api/amistades/verificar/${userId}`, { credentials:"include" });
        const amigosData = await amigosRes.json();
        setSonAmigos(amigosData.sonAmigos || false);
      }
      */
    } catch (err) {
      console.error('[FETCH_PERFIL] Error:', err);
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
    socket.emit('user:connect', session.user.dbId);
    socket.on('profile:visit', ({ visitas }) => {
      setPerfil(prev => prev ? { ...prev, stats: { ...prev.stats, visitas } } : prev);
    });
    return () => socket.disconnect();
  }, [session?.user?.dbId]);

  return { perfil, loading, notFound, photos, sonAmigos, lightboxSrc, setLightboxSrc, fetchPerfil };
}

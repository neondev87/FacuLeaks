"use client";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: hooks/useForo.js — estado del foro (YA NO es mock)
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: maneja el canal activo, sus temas (los crea SOLO el admin), el
// tema en foco y sus comentarios (los hace cualquiera; sin título). Abre un
// socket para enterarse en vivo de temas/comentarios nuevos o borrados.
//
// CON QUÉ SE CONECTA:
//   - backend: /api/foro/* (foro.controller.js).
//   - Socket.io: foro:tema / foro:tema:deleted / foro:comentario /
//     foro:comentario:deleted.
//   - Lo consume: app/foro/page.js.
// ════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import { API, SOCKET_URL } from "@/lib/api";

export const CANALES = [
  { id: "general",    name: "# general" },
  { id: "aesthetics", name: "# aesthetics" },
  { id: "code",       name: "# code" },
  { id: "dark_music", name: "# dark-music" },
  { id: "void",       name: "# void" },
];

export default function useForo() {
  const [canal,        setCanal]        = useState("general");
  const [temas,        setTemas]        = useState([]);
  const [temaActivoId, setTemaActivoId] = useState(null);
  const [comentarios,  setComentarios]  = useState([]);
  const [loadingTemas, setLoadingTemas] = useState(true);
  const [loadingComs,  setLoadingComs]  = useState(false);
  const [puedeCrearTema, setPuedeCrearTema] = useState(false);
  const [sending, setSending] = useState(false);
  // Espejos de canal/tema para leer el valor actual desde los handlers del
  // socket sin re-suscribir el socket en cada cambio.
  const canalRef = useRef(canal);
  const temaRef  = useRef(null);
  useEffect(() => { canalRef.current = canal; }, [canal]);
  useEffect(() => { temaRef.current  = temaActivoId; }, [temaActivoId]);

  const temaActivo = temas.find(t => t.id === temaActivoId) || null;

  // ── permisos (¿puedo crear temas?) ──
  useEffect(() => {
    fetch(`${API}/api/foro/permisos`, { credentials: "include" })
      .then(r => r.json()).then(d => setPuedeCrearTema(!!d.puedeCrearTema)).catch(() => {});
  }, []);

  // ── temas del canal ── (sin setState sincrónico: la primera sentencia ya
  // es un await, así el efecto que lo llama no dispara renders en cascada)
  const loadTemas = useCallback(async (c) => {
    try {
      const res  = await fetch(`${API}/api/foro/temas?canal=${c}`, { credentials: "include" });
      const data = await res.json();
      const list = data.temas || [];
      setTemas(list);
      setTemaActivoId(list[0]?.id ?? null);
    } catch {
      setTemas([]); setTemaActivoId(null);
    } finally {
      setLoadingTemas(false);
    }
  }, []);

  useEffect(() => { loadTemas(canal); }, [canal, loadTemas]);

  // ── comentarios del tema en foco ──
  const loadComentarios = useCallback(async (id) => {
    try {
      const res  = await fetch(`${API}/api/foro/temas/${id}/comentarios`, { credentials: "include" });
      const data = await res.json();
      setComentarios(data.comentarios || []);
    } catch {
      setComentarios([]);
    } finally {
      setLoadingComs(false);
    }
  }, []);

  useEffect(() => {
    if (temaActivoId) loadComentarios(temaActivoId);
    else setComentarios([]);
  }, [temaActivoId, loadComentarios]);

  // ── socket (tiempo real) ──
  useEffect(() => {
    const socket = io(SOCKET_URL);
    socket.on("foro:tema", (tema) => {
      if (tema.canal === canalRef.current) {
        setTemas(prev => prev.some(t => t.id === tema.id) ? prev : [tema, ...prev]);
      }
    });
    socket.on("foro:tema:deleted", ({ id }) => {
      setTemas(prev => prev.filter(t => t.id !== id));
      setTemaActivoId(prev => prev === id ? null : prev);
    });
    socket.on("foro:comentario", ({ temaId, totalComentarios, comentario }) => {
      setTemas(prev => prev.map(t => t.id === temaId ? { ...t, totalComentarios } : t));
      if (temaId === temaRef.current) {
        setComentarios(prev => prev.some(c => c.id === comentario.id) ? prev : [...prev, comentario]);
      }
    });
    socket.on("foro:comentario:deleted", ({ temaId, comentarioId, totalComentarios }) => {
      setTemas(prev => prev.map(t => t.id === temaId ? { ...t, totalComentarios } : t));
      if (temaId === temaRef.current) setComentarios(prev => prev.filter(c => c.id !== comentarioId));
    });
    return () => { socket.disconnect(); };
  }, []);

  // ── acciones ──
  const enviarComentario = useCallback(async (contenido) => {
    const texto = String(contenido || "").trim();
    if (!texto || !temaRef.current || sending) return false;
    setSending(true);
    try {
      const res = await fetch(`${API}/api/foro/temas/${temaRef.current}/comentarios`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido: texto }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.comentario) {
        setComentarios(prev => prev.some(c => c.id === data.comentario.id) ? prev : [...prev, data.comentario]);
        setTemas(prev => prev.map(t => t.id === temaRef.current ? { ...t, totalComentarios: data.totalComentarios } : t));
      }
      return true;
    } catch {
      return false;
    } finally {
      setSending(false);
    }
  }, [sending]);

  const crearTema = useCallback(async (titulo) => {
    const t = String(titulo || "").trim();
    if (!t) return false;
    try {
      const res = await fetch(`${API}/api/foro/temas`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canal: canalRef.current, titulo: t }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.tema) {
        setTemas(prev => prev.some(x => x.id === data.tema.id) ? prev : [data.tema, ...prev]);
        setTemaActivoId(data.tema.id);
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  const borrarTema = useCallback(async (id) => {
    setTemas(prev => prev.filter(t => t.id !== id));
    setTemaActivoId(prev => prev === id ? null : prev);
    try {
      const res = await fetch(`${API}/api/foro/temas/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) loadTemas(canalRef.current);
    } catch { loadTemas(canalRef.current); }
  }, [loadTemas]);

  const borrarComentario = useCallback(async (id) => {
    setComentarios(prev => prev.filter(c => c.id !== id));
    try {
      const res = await fetch(`${API}/api/foro/comentarios/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) loadComentarios(temaRef.current);
    } catch { loadComentarios(temaRef.current); }
  }, [loadComentarios]);

  return {
    CANALES, canal, setCanal,
    temas, temaActivo, temaActivoId, setTemaActivoId,
    comentarios, loadingTemas, loadingComs,
    puedeCrearTema, sending,
    enviarComentario, crearTema, borrarTema, borrarComentario,
  };
}

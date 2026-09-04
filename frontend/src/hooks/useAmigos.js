"use client";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: hooks/useAmigos.js — cerebro de la página de amigos
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: carga tus amigos + solicitudes recibidas/enviadas, busca
// usuarios (con debounce de 400ms) y las 4 acciones sobre una amistad
// (enviar, aceptar, rechazar, eliminar) — cada una recarga la lista al
// terminar. Extraído de app/amigos/page.js (Fase 2 nunca lo tocó porque el
// prompt maestro solo pedía feed/perfil/chat; parejado el 2026-09-04).
//
// CON QUÉ SE CONECTA: backend /api/amigos/* completo (amigos.controller.js).
// Lo consume app/amigos/page.js.
// ════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from "react";
import { API } from "@/lib/api";

export default function useAmigos({ status }) {
  const [amigos,     setAmigos]     = useState([]);
  const [recibidas,  setRecibidas]  = useState([]);
  const [enviadas,   setEnviadas]   = useState([]);
  const [busqueda,   setBusqueda]   = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando,   setBuscando]   = useState(false);
  const [loading,    setLoading]    = useState(false);

  const loadAmigos = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/amigos`, { credentials: "include" });
      const data = await res.json();
      setAmigos(data.amigos       || []);
      setRecibidas(data.recibidas || []);
      setEnviadas(data.enviadas   || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "authenticated") loadAmigos();
  }, [status, loadAmigos]);

  // Buscar usuarios (debounce 400ms)
  useEffect(() => {
    if (busqueda.length < 2) { setResultados([]); return; }
    const t = setTimeout(async () => {
      setBuscando(true);
      try {
        const res  = await fetch(`${API}/api/amigos/buscar?q=${busqueda}`, { credentials: "include" });
        const data = await res.json();
        setResultados(data.usuarios || []);
      } catch {}
      setBuscando(false);
    }, 400);
    return () => clearTimeout(t);
  }, [busqueda]);

  const enviarSolicitud = async (userId) => {
    await fetch(`${API}/api/amigos/solicitud/${userId}`, { method: "POST", credentials: "include" });
    setBusqueda("");
    loadAmigos();
  };

  const aceptar = async (amistadId) => {
    await fetch(`${API}/api/amigos/aceptar/${amistadId}`, { method: "PUT", credentials: "include" });
    loadAmigos();
  };

  const rechazar = async (amistadId) => {
    await fetch(`${API}/api/amigos/rechazar/${amistadId}`, { method: "PUT", credentials: "include" });
    loadAmigos();
  };

  const eliminar = async (amistadId) => {
    await fetch(`${API}/api/amigos/${amistadId}`, { method: "DELETE", credentials: "include" });
    loadAmigos();
  };

  return {
    amigos, recibidas, enviadas,
    busqueda, setBusqueda, resultados, buscando, loading,
    enviarSolicitud, aceptar, rechazar, eliminar,
  };
}

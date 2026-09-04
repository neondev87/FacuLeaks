"use client";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: hooks/useChatSearch.js — buscador de usuarios del chat
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: el buscador que aparece al tocar "+ nueva conversación". Espera
// 400ms sin que sigas tipeando (debounce) antes de preguntarle al backend,
// para no mandar una petición por cada letra.
//
// CON QUÉ SE CONECTA:
//   - backend: GET /api/amigos/buscar?q=... (reutiliza el buscador de
//     amigos, no es un endpoint propio del chat).
//   - Lo consume: app/chat/page.js.
// ════════════════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";
import { API } from "@/lib/api";
export default function useChatSearch() {
  const [showBuscar, setShowBuscar] = useState(false);
  const [busqueda,   setBusqueda]   = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando,   setBuscando]   = useState(false);

  useEffect(() => {
    if (busqueda.length < 2) { setResultados([]); return; }
    const t = setTimeout(async () => {
      setBuscando(true);
      try {
        const res  = await fetch(`${API}/api/amigos/buscar?q=${busqueda}`, { credentials:"include" });
        const data = await res.json();
        setResultados(data.usuarios || []);
      } catch {}
      setBuscando(false);
    }, 400);
    return () => clearTimeout(t);
  }, [busqueda]);

  const closeSearch  = () => { setShowBuscar(false); setBusqueda(""); setResultados([]); };
  const toggleSearch = () => setShowBuscar(v => !v);
  const openSearch   = () => setShowBuscar(true);

  return { showBuscar, busqueda, setBusqueda, resultados, buscando, closeSearch, toggleSearch, openSearch };
}

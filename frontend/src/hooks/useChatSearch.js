"use client";

import { useState, useEffect } from "react";
import { API } from "@/lib/api";

// Búsqueda de usuarios para iniciar conversación (con debounce de 400ms).
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

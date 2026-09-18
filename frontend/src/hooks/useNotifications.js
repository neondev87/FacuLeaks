"use client";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: hooks/useNotifications.js — cerebro de la campanita de la navbar
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: carga las últimas notificaciones al loguearte (GET
// /api/notificaciones), y se conecta a UN socket propio para recibir
// `notification:new` en vivo (misma sala `user:<id>` que usa el chat, ver
// backend/src/lib/notificaciones.js) — así el número de la campana sube al
// instante sin esperar a refrescar la página. `marcarLeidas()` vacía el
// contador (optimista) y avisa al backend — se llama al ABRIR el panel, no
// notificación por notificación.
//
// PARA QUÉ SIRVE: components/Navbar.js es el único que lo usa — es el mismo
// concepto que `solicitudes` en hooks/useChat.js, pero para notificaciones
// generales (amistad, likes, comentarios) en vez de mensajes.
//
// CON QUÉ SE CONECTA:
//   - backend: GET /api/notificaciones, PATCH /api/notificaciones/leidas.
//   - lib/socket.js (createAuthedSocket) → evento notification:new.
// ════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useRef, useCallback } from "react";
import { API } from "@/lib/api";
import { createAuthedSocket } from "@/lib/socket";

export default function useNotifications({ session, status }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const socketRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/notificaciones`, { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setNotificaciones(data.notificaciones || []);
      setNoLeidas(data.noLeidas || 0);
    } catch {}
  }, []);

  useEffect(() => {
    if (status === "authenticated") load();
  }, [status, load]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.dbId) return;
    const socket = createAuthedSocket();
    socketRef.current = socket;
    socket.on("notification:new", (notif) => {
      setNotificaciones(prev => [notif, ...prev].slice(0, 30));
      setNoLeidas(n => n + 1);
    });
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [status, session]);

  const marcarLeidas = useCallback(() => {
    setNoLeidas(n => {
      if (n === 0) return n;
      fetch(`${API}/api/notificaciones/leidas`, { method: "PATCH", credentials: "include" }).catch(() => {});
      setNotificaciones(prev => prev.map(x => ({ ...x, leida: true })));
      return 0;
    });
  }, []);

  return { notificaciones, noLeidas, marcarLeidas };
}

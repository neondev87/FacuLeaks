"use client";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: hooks/useAuth.js — cerebro de la pantalla de login
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE:
//   - Controla la animación de entrada blanco→negro (`white`/`ready`,
//     puro timing, nada de red).
//   - Cuando NextAuth confirma que hay sesión de Google, dispara el flujo
//     real: pregunta al backend si el googleId ya tiene cuenta
//     (GET /api/auth/check/:googleId) — si no, manda a /register; si sí,
//     manda a /api/auth/sync-backend para conseguir la cookie del backend
//     y de ahí al feed.
//
// PARA QUÉ SIRVE: extraído de app/auth/page.js el 2026-09-04 para parejar
// con el patrón de Fase 2 — ES SOLO UN MOVIMIENTO DE CÓDIGO, cero cambio de
// comportamiento ni de estética (el login es la única pantalla que el
// prompt maestro protege explícitamente de cualquier cambio visual).
//
// CON QUÉ SE CONECTA: backend GET /api/auth/check/:googleId,
// GET /api/auth/sync-backend (route de Next). Lo consume app/auth/page.js.
// ════════════════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";
import { API } from "@/lib/api";

export default function useAuth({ status, session }) {
  const [white,    setWhite]    = useState(true);
  const [ready,    setReady]    = useState(false);
  const [checking, setChecking] = useState(false);

  const tcD = white ? "rgba(0,0,0,.35)"  : "rgba(232,228,217,.35)";
  const tcF = white ? "rgba(0,0,0,.18)"  : "rgba(232,228,217,.18)";

  // Animación blanco→negro
  useEffect(() => {
    const t1 = setTimeout(() => setWhite(false), 1440);
    const t2 = setTimeout(() => setReady(true),  1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Cuando NextAuth tiene sesión → verificar cuenta → registro o sync-backend
  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;

    const googleId = session.user.googleId || session.user.id;
    if (!googleId) return;

    setChecking(true);

    const doLogin = async () => {
      try {
        // 1. Verificar si existe en BD
        const checkRes  = await fetch(`${API}/api/auth/check/${googleId}`);
        const checkData = await checkRes.json();

        if (!checkData.exists) {
          // Usuario nuevo → registro
          window.location.href = "/register";
          return;
        }

        // 2. Setear la cookie JWT del backend vía el route server de Next.
        //    /api/auth/login ya no acepta llamadas del browser (requiere
        //    secreto interno); sync-backend la hace server-to-server.
        window.location.href = "/api/auth/sync-backend?callbackUrl=/feed";

      } catch (err) {
        console.error("Error en login:", err);
        setChecking(false);
      }
    };

    doLogin();
  }, [status, session]);

  return { white, ready, checking, tcD, tcF };
}

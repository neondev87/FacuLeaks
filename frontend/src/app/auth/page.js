"use client";

import { signIn, useSession } from "next-auth/react";
import useInjectedStyles from "@/hooks/useInjectedStyles";
import useAuth from "@/hooks/useAuth";
import GothicCross from "@/components/auth/GothicCross";
import NeonDevMark from "@/components/auth/NeonDevMark";
import { authStyles } from "./authStyles";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: app/auth/page.js — la pantalla de login
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: la página de login con el botón "Continuar con Google" — arranca
// el flujo de NextAuth con signIn("google"). Es la única página con
// estética "cyberpunk/glitch" del proyecto (arte gótico en blanco y negro,
// branding NEONDEV) y por regla del proyecto NO se toca en el rediseño de
// Fase 3 — todo el resto de la app va a un estilo distinto (minimalista
// underground/Y2K), pero esta pantalla se queda como está. Parejada con el
// patrón de Fase 2 el 2026-09-04 (hook + componentes + useInjectedStyles) —
// SOLO reorganización de código, cero cambio visual ni de comportamiento.
//
// CON QUÉ SE CONECTA: hooks/useAuth.js (toda la lógica), components/auth/*
// (arte visual), next-auth/react (signIn) → arranca el flujo que termina
// resolviéndose en lib/authOptions.js.
// ════════════════════════════════════════════════════════════════════════
export default function AuthPage() {
  const { data: session, status } = useSession();
  const { white, ready, checking, tcD, tcF } = useAuth({ status, session });

  useInjectedStyles("auth-styles", authStyles);

  return (
    <div style={{
      width: "100vw", height: "100vh",
      display: "grid", gridTemplateColumns: "1fr 1fr",
      overflow: "hidden",
      animation: "bgW2B 1.44s ease forwards",
    }}>

      {/* ══ LEFT ══ */}
      <div style={{
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "0 8% 0 10%", position: "relative",
      }}>

        {/* SYS meta */}
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 9, letterSpacing: ".12em",
          color: tcD, transition: "color .6s", marginBottom: 38,
        }}>
          SYS:OK — {new Date().toLocaleDateString("es-MX")}
          <span style={{ animation: "blink 1s infinite" }}>_</span>
        </div>

        {/* Logo */}
        <div style={{ marginBottom: 48 }}>
          <div className="logo-title">FacuLeaks</div>
          <div style={{ display: "flex", alignItems: "center", gap: 0, marginTop: 14 }}>
            <div style={{ flex: 1, height: 1, background: tcD, transition: "background .6s" }} />
            <span style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 8, letterSpacing: ".3em",
              padding: "0 14px", color: tcD, transition: "color .6s",
            }}>
              filtraciones de la realidad
            </span>
            <div style={{ flex: 1, height: 1, background: tcD, transition: "background .6s" }} />
          </div>
        </div>

        {/* Botón o spinner */}
        {ready && (
          <div className="form-wrap">
            {checking || status === "loading" ? (
              <div className="checking-indicator">
                <div className="spinner" />
                {checking ? "iniciando sesión..." : "verificando..."}
              </div>
            ) : status === "authenticated" ? (
              <div className="checking-indicator">
                <div className="spinner" />
                redirigiendo...
              </div>
            ) : (
              <button
                className="btn-google"
                onClick={() => signIn("google")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" opacity=".8"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" opacity=".8"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" opacity=".8"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" opacity=".8"/>
                </svg>
                $ continuar con google
              </button>
            )}
          </div>
        )}

        {/* Version */}
        <div style={{
          position: "absolute", bottom: 28,
          fontFamily: "'Space Mono', monospace",
          fontSize: 8, letterSpacing: ".15em",
          color: tcF, transition: "color .6s",
        }}>
          FACULEAKS · ALPHA · NEONDEV
        </div>
      </div>

      {/* ══ RIGHT ══ */}
      <div style={{ position: "relative", overflow: "hidden" }}>

        <div style={{
          position: "absolute", top: "10%", bottom: "10%", left: 0, width: 1,
          background: "linear-gradient(180deg,transparent,rgba(255,255,255,.05) 30%,rgba(255,255,255,.05) 70%,transparent)",
          zIndex: 3,
        }} />

        <div style={{ position: "absolute", top: 160, right: 14, zIndex: 3 }}>
          <GothicCross size={54} opacity={0.38} />
        </div>

        <div style={{ position: "absolute", top: 68, right: 20, zIndex: 5 }}>
          <NeonDevMark />
        </div>

        <div style={{
          position: "absolute", top: 24, left: 18, zIndex: 4,
          fontFamily: "'Space Mono', monospace",
          fontSize: 8, color: "rgba(255,255,255,.2)",
          letterSpacing: ".2em", lineHeight: 2.2,
        }}>
          STATUS: ONLINE<br />SYS: OK<br />
          <span style={{ color: "rgba(255,255,255,.1)" }}>
            {new Date().toLocaleDateString("es-MX")}
          </span>
        </div>

        <img src="/art/girl.png" alt="" className="girl-img" />

        <div style={{
          position: "absolute", inset: 0,
          background:
            "linear-gradient(90deg,#000 0%,transparent 22%,transparent 78%,#000 100%)," +
            "linear-gradient(180deg,transparent 30%,#000 100%)",
          zIndex: 2, pointerEvents: "none",
        }} />
      </div>
    </div>
  );
}

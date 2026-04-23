"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";

// ── GOTHIC CROSS ──────────────────────────────────────────────
function GothicCross({ size = 54, opacity = 0.38, style = {} }) {
  return (
    <svg width={size} height={size * 1.78} viewBox="0 0 80 140" fill="none" style={{ opacity, ...style }}>
      <g stroke="white" strokeWidth="0.5" fill="none" strokeLinecap="round">
        <line x1="40" y1="5" x2="40" y2="135" />
        <line x1="10" y1="38" x2="70" y2="38" />
        <line x1="18" y1="52" x2="62" y2="52" />
        <path d="M40 5 C37 2 34 3 35 6 C36 8 38 8 40 7 C42 8 44 8 45 6 C46 3 43 2 40 5" />
        <path d="M10 38 C6 34 4 30 7 28 C9 27 11 29 10 32" />
        <path d="M7 28 C4 24 5 20 8 20 C10 20 11 23 9 25" />
        <path d="M10 38 C8 42 6 44 8 47 C10 48 12 46 11 43" />
        <path d="M70 38 C74 34 76 30 73 28 C71 27 69 29 70 32" />
        <path d="M73 28 C76 24 75 20 72 20 C70 20 69 23 71 25" />
        <path d="M70 38 C72 42 74 44 72 47 C70 48 68 46 69 43" />
        <circle cx="40" cy="38" r="2.5" strokeWidth="0.4" />
        <circle cx="40" cy="38" r="1" fill="white" stroke="none" />
        <path d="M40 15L37 10" /><path d="M40 15L43 10" />
        <path d="M40 22L36 18" /><path d="M40 22L44 18" />
        <path d="M40 60L37 55" /><path d="M40 60L43 55" />
        <path d="M40 75L36 70" /><path d="M40 75L44 70" />
        <path d="M40 90L37 85" /><path d="M40 90L43 85" />
        <path d="M32 30 C28 26 26 22 28 18" />
        <path d="M48 30 C52 26 54 22 52 18" />
        <path d="M32 46 C28 50 26 54 28 58" />
        <path d="M48 46 C52 50 54 54 52 58" />
        <path d="M40 135 C37 138 34 137 35 134 C36 132 38 132 40 133 C42 132 44 132 45 134 C46 137 43 138 40 135" />
      </g>
    </svg>
  );
}

// ── NEONDEV MARK ──────────────────────────────────────────────
function NeonDevMark() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, pointerEvents: "none", userSelect: "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="2" width="20" height="20" rx="2" stroke="rgba(255,255,255,.75)" strokeWidth="1"/>
          <path d="M7 12 L10 8 L13 12 L16 8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7 16 L17 16" stroke="rgba(255,255,255,.35)" strokeWidth="1" strokeLinecap="round"/>
          <circle cx="19" cy="5" r="2.2" fill="#fff"/>
        </svg>
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 18, fontWeight: 700,
          letterSpacing: ".3em", color: "#fff",
          textTransform: "uppercase",
          textShadow: "0 0 30px rgba(255,255,255,.4)",
        }}>NeonDev</span>
      </div>
      <span style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 8, letterSpacing: ".25em",
        color: "rgba(255,255,255,.3)",
      }}>neondev studio</span>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────
export default function AuthPage() {
  const [white, setWhite] = useState(true);
  const [ready, setReady] = useState(false);

  const tcD = white ? "rgba(0,0,0,.35)"  : "rgba(232,228,217,.35)";
  const tcF = white ? "rgba(0,0,0,.18)"  : "rgba(232,228,217,.18)";
  const bDim = white ? "rgba(0,0,0,.22)" : "rgba(232,228,217,.22)";

  useEffect(() => {
    const t1 = setTimeout(() => setWhite(false), 1440);
    const t2 = setTimeout(() => setReady(true),  1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    const s = document.createElement("style");
    s.id = "auth-styles";
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Space+Mono:wght@400;700&display=swap');

      @keyframes bgW2B {
        0%,35% { background:#fff; }
        100%   { background:#000; }
      }
      @keyframes textW2B {
        0%,35% { color:#000; }
        80%,100% { color:#e8e4d9; }
      }
      @keyframes textW2Bd {
        0%,35% { color:rgba(0,0,0,.35); }
        80%,100% { color:rgba(232,228,217,.35); }
      }
      @keyframes fadeUp {
        from { opacity:0; transform:translateY(12px); }
        to   { opacity:1; transform:translateY(0); }
      }
      @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      @keyframes girlIn {
        from { opacity:0; transform:translateY(14px); }
        to   { opacity:1; transform:translateY(0); }
      }
      @keyframes flicker {
        0%,100%{opacity:1} 92%{opacity:1} 93%{opacity:.6} 94%{opacity:1}
      }

      body::before {
        content:''; position:fixed; inset:0;
        background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
        opacity:.05; pointer-events:none; z-index:9998;
      }
      body::after {
        content:''; position:fixed; inset:0;
        background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.15) 2px,rgba(0,0,0,.15) 4px);
        pointer-events:none; z-index:9999;
      }

      ::-webkit-scrollbar{width:4px}
      ::-webkit-scrollbar-track{background:#000}
      ::-webkit-scrollbar-thumb{background:#222}

      .logo-title {
        font-family:'DM Serif Display',serif;
        font-weight:400;
        font-size:clamp(56px,7vw,82px);
        line-height:.9;
        letter-spacing:.01em;
        animation: textW2B 2.4s ease forwards, flicker 9s infinite 3s;
      }

      .btn-google {
        background:transparent;
        color:rgba(232,228,217,.5);
        font-family:'Space Mono',monospace;
        font-size:11px; letter-spacing:.2em;
        padding:14px 32px; cursor:pointer; width:100%;
        border:1px solid rgba(232,228,217,.2);
        transition:all .25s;
        display:flex; align-items:center; justify-content:center; gap:12px;
        margin-top: 8px;
      }
      .btn-google:hover {
        border-color:rgba(232,228,217,.6);
        color:#e8e4d9;
        background: rgba(232,228,217,.04);
        box-shadow: 0 0 20px rgba(232,228,217,.05);
      }

      .form-wrap { animation: fadeUp .5s ease .4s both; }

      .girl-img {
        position:absolute; bottom:0; right:5%;
        width:80%; max-height:100vh;
        object-fit:contain; object-position:bottom;
        filter:contrast(1.1) brightness(.9);
        mix-blend-mode:lighten; z-index:1;
        animation: girlIn 1.2s ease 1.6s both;
        pointer-events:none; user-select:none;
      }
    `;
    document.head.appendChild(s);
    return () => document.getElementById("auth-styles")?.remove();
  }, []);

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

        {/* Botón Google */}
        {ready && (
          <div className="form-wrap">
            <button
              className="btn-google"
              onClick={() => signIn("google", { callbackUrl: "/register" })}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" opacity=".8"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" opacity=".8"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" opacity=".8"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" opacity=".8"/>
              </svg>
              $ continuar con google
            </button>
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

        {/* Divisor izquierdo */}
        <div style={{
          position: "absolute", top: "10%", bottom: "10%", left: 0, width: 1,
          background: "linear-gradient(180deg,transparent,rgba(255,255,255,.05) 30%,rgba(255,255,255,.05) 70%,transparent)",
          zIndex: 3,
        }} />

        {/* Cruz gótica */}
        <div style={{ position: "absolute", top: 160, right: 14, zIndex: 3 }}>
          <GothicCross size={54} opacity={0.38} />
        </div>

        {/* NeonDev */}
        <div style={{ position: "absolute", top: 68, right: 20, zIndex: 5 }}>
          <NeonDevMark />
        </div>

        {/* Status */}
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

        {/* Anime girl */}
        <img src="/art/girl.png" alt="" className="girl-img" />

        {/* Overlay */}
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
"use client";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: components/SpotifyWidget.js — chip de Spotify del perfil
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: muestra la cancion actual (o la ultima escuchada), chiquito,
// pensado para vivir al lado de la foto de perfil (ver app/perfil/page.js) —
// no abajo, a un costado, en un espacio angosto. Actualiza cada 5 segundos
// preguntandole al backend. Sin conexion o sin actividad, se recorta a un
// boton/label minimo (nunca ocupa mas que un renglon o dos).
//
// OJO (2026-09-10): antes era una tarjeta completa a lo ancho del panel,
// con barra de progreso grande y boton de desconectar de fila propia. Se
// recorto entero a pedido explicito para que entre al lado del avatar —
// esta version reemplaza esa, no conviven las dos.
//
// IMPORTANTE — regla del proyecto: este archivo debe quedar SIEMPRE sin
// caracteres UTF-8 raros (emojis, tildes en identificadores, simbolos
// especiales fuera de comentarios) — es una convencion vieja del proyecto
// para evitar problemas de encoding en Windows. Los estilos van como
// objetos JS al final del archivo, no como string de CSS.
//
// PARA QUÉ SIRVE: es el widget de perfil — para el mini-widget de la
// navbar ver components/Navbar.js (SpotifyNavWidget, adentro del archivo).
//
// CON QUÉ SE CONECTA:
//   - backend: GET /api/spotify/now-playing/:userId,
//     DELETE /api/spotify/disconnect.
//   - `onConnect` normalmente dispara `window.location.href` hacia
//     GET /api/spotify/auth (arranca el OAuth) — lo decide quien lo usa.
//   - Lo consume: app/perfil/page.js (tu propio perfil).
// ════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from "react";
import { API } from "@/lib/api";

export default function SpotifyWidget({ userId, onConnect, onDisconnect }) {
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [progress,   setProgress]   = useState(0);
  const [disconnecting, setDisconnecting] = useState(false);
  const tickRef = useRef(null);

  // ── Cargar datos de Spotify ──
  const load = async () => {
    if (!userId) return;
    try {
      const res  = await fetch(`${API}/api/spotify/now-playing/${userId}`);
      if (!res.ok) { setData({ connected: false }); setLoading(false); return; }
      const json = await res.json();
      setData(json);
      if (json?.progress && json?.duration) {
        setProgress(json.progress);
      }
    } catch {
      setData({ connected: false });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [userId]);

  // ── Tick de progreso local (avanza cada segundo) ──
  useEffect(() => {
    clearInterval(tickRef.current);
    if (data?.isPlaying && data?.duration) {
      tickRef.current = setInterval(() => {
        setProgress(p => Math.min(p + 1000, data.duration));
      }, 1000);
    }
    return () => clearInterval(tickRef.current);
  }, [data?.isPlaying, data?.duration, data?.track]);

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await fetch(`${API}/api/spotify/disconnect`, {
        method: "DELETE",
        credentials: "include",
      });
      setData({ connected: false });
      onDisconnect?.();
    } catch {}
    setDisconnecting(false);
  };

  // Boton chiquito de desconectar (una X dibujada, no un caracter suelto)
  // que se repite en los tres estados "conectado".
  const disconnectBtn = (
    <button onClick={handleDisconnect} disabled={disconnecting} title="desconectar spotify" style={xBtnStyle}
      onMouseEnter={e => { e.currentTarget.style.color = "#ff4444"; }}
      onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,.2)"; }}>
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
  );

  // ── Estados ──
  // Nada visible mientras carga: en un espacio tan chico, un texto
  // "cargando..." solo parpadea y molesta mas de lo que informa.
  if (loading) return null;

  if (!data?.connected) return (
    <button onClick={onConnect} style={connectStyle}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "#1db954"; e.currentTarget.style.color = "#1db954"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.12)"; e.currentTarget.style.color = "rgba(255,255,255,.35)"; }}>
      + spotify
    </button>
  );

  if (!data.track) return (
    <div style={wrapStyle}>
      <span style={metaStyle}>sin actividad</span>
      {disconnectBtn}
    </div>
  );

  const pct = data.duration ? (progress / data.duration) * 100 : null;

  return (
    <div style={{ ...wrapStyle, alignItems: "flex-start" }}>
      {data.albumArt && (
        <img src={data.albumArt} alt="album"
          style={{ width: 30, height: 30, objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,.08)" }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 7, fontFamily: MONO, color: data.isPlaying ? "#1db954" : "rgba(255,255,255,.3)", letterSpacing: ".1em", marginBottom: 2 }}>
          {data.isPlaying ? "sonando" : "ultimo"}
        </div>
        <div style={{ fontSize: 10, color: "#e8e4d9", fontFamily: SANS, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {data.track}
        </div>
        <div style={{ fontSize: 8, color: "rgba(255,255,255,.4)", fontFamily: MONO, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>
          {data.artist}
        </div>

        {pct !== null && (
          <div style={{ height: 2, background: "rgba(255,255,255,.08)", borderRadius: 1, marginTop: 5, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: data.isPlaying ? "#1db954" : "rgba(255,255,255,.2)", borderRadius: 1, transition: "width 1s linear" }} />
          </div>
        )}
      </div>
      {disconnectBtn}
    </div>
  );
}

// ── Estilos compartidos ──
const MONO = "'IBM Plex Mono',monospace";
const SANS = "'IBM Plex Sans',sans-serif";

const wrapStyle = {
  width: "100%",
  minWidth: 0,
  padding: "8px",
  border: "1px solid rgba(255,255,255,.06)",
  background: "rgba(255,255,255,.02)",
  display: "flex",
  alignItems: "center",
  gap: 6,
  boxSizing: "border-box",
};

const metaStyle = {
  flex: 1,
  minWidth: 0,
  fontSize: 9,
  fontFamily: MONO,
  color: "rgba(255,255,255,.2)",
  letterSpacing: ".08em",
};

const connectStyle = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  border: "1px solid rgba(255,255,255,.12)",
  color: "rgba(255,255,255,.35)",
  fontFamily: MONO,
  fontSize: 9,
  letterSpacing: ".08em",
  padding: "10px 6px",
  cursor: "pointer",
  transition: "all .2s",
  boxSizing: "border-box",
};

const xBtnStyle = {
  flexShrink: 0,
  width: 16,
  height: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  border: "none",
  color: "rgba(255,255,255,.2)",
  cursor: "pointer",
  padding: 0,
  transition: "color .15s",
};

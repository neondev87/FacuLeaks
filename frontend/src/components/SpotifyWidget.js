"use client";

import { useState, useEffect, useRef } from "react";

const API = "http://localhost:4000";

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

  // ── Estados ──
  if (loading) return (
    <div style={wrapStyle}>
      <span style={metaStyle}>cargando spotify...</span>
    </div>
  );

  if (!data?.connected) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={wrapStyle}>
        <span style={{ ...metaStyle, color: "rgba(255,255,255,.18)", fontSize: 8 }}>
          cuenta no conectada a spotify
        </span>
      </div>
      <button onClick={onConnect} style={connectBtnStyle}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.4)"; e.currentTarget.style.color = "#fff"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.15)"; e.currentTarget.style.color = "rgba(255,255,255,.4)"; }}>
        conectar spotify
      </button>
    </div>
  );

  if (!data.track) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={wrapStyle}>
        <span style={metaStyle}>sin actividad reciente</span>
      </div>
      <button onClick={handleDisconnect} disabled={disconnecting} style={disconnectBtnStyle}
        onMouseEnter={e => { e.currentTarget.style.color = "#ff4444"; e.currentTarget.style.borderColor = "rgba(255,68,68,.3)"; }}
        onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,.2)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.08)"; }}>
        {disconnecting ? "desconectando..." : "desconectar spotify"}
      </button>
    </div>
  );

  const pct = data.duration ? (progress / data.duration) * 100 : null;
  const fmtTime = (ms) => {
    if (!ms) return "0:00";
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {/* Track info */}
      <div style={{ ...wrapStyle, padding: "10px 12px", display: "flex", gap: 10, alignItems: "center" }}>
        {data.albumArt && (
          <img src={data.albumArt} alt="album"
            style={{ width: 40, height: 40, objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,.08)" }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: 3 }}>
            <span style={{ fontSize: 7, fontFamily: "'IBM Plex Mono',monospace", color: data.isPlaying ? "#1db954" : "rgba(255,255,255,.3)", letterSpacing: ".12em" }}>
              {data.isPlaying ? "AHORA" : "ULTIMO"}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#e8e4d9", fontFamily: "'IBM Plex Sans',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {data.track}
          </div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,.4)", fontFamily: "'IBM Plex Mono',monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>
            {data.artist}
          </div>

          {/* Barra de progreso */}
          {pct !== null && (
            <>
              <div style={{ height: 2, background: "rgba(255,255,255,.08)", borderRadius: 1, marginTop: 6, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: data.isPlaying ? "#1db954" : "rgba(255,255,255,.2)", borderRadius: 1, transition: "width 1s linear" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                <span style={{ fontSize: 7, fontFamily: "'IBM Plex Mono',monospace", color: "rgba(255,255,255,.2)" }}>{fmtTime(progress)}</span>
                <span style={{ fontSize: 7, fontFamily: "'IBM Plex Mono',monospace", color: "rgba(255,255,255,.2)" }}>{fmtTime(data.duration)}</span>
              </div>
            </>
          )}
        </div>

        {data.spotifyUrl && (
          <a href={data.spotifyUrl} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 14, color: "rgba(255,255,255,.2)", textDecoration: "none", flexShrink: 0, transition: "color .2s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#1db954"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.2)"}>
            +
          </a>
        )}
      </div>

      {/* Botón desconectar */}
      <button onClick={handleDisconnect} disabled={disconnecting} style={disconnectBtnStyle}
        onMouseEnter={e => { e.currentTarget.style.color = "#ff4444"; e.currentTarget.style.borderColor = "rgba(255,68,68,.3)"; }}
        onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,.2)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.08)"; }}>
        {disconnecting ? "desconectando..." : "desconectar spotify"}
      </button>
    </div>
  );
}

// ── Estilos compartidos ──
const wrapStyle = {
  padding: "8px 12px",
  border: "1px solid rgba(255,255,255,.06)",
  background: "rgba(255,255,255,.02)",
  display: "flex",
  alignItems: "center",
};

const metaStyle = {
  fontSize: 9,
  fontFamily: "'IBM Plex Mono',monospace",
  color: "rgba(255,255,255,.2)",
  letterSpacing: ".1em",
};

const connectBtnStyle = {
  background: "transparent",
  border: "1px solid rgba(255,255,255,.15)",
  color: "rgba(255,255,255,.4)",
  fontFamily: "'IBM Plex Mono',monospace",
  fontSize: 9,
  letterSpacing: ".15em",
  padding: "8px 16px",
  cursor: "pointer",
  transition: "all .2s",
  width: "100%",
};

const disconnectBtnStyle = {
  background: "transparent",
  border: "1px solid rgba(255,255,255,.08)",
  color: "rgba(255,255,255,.2)",
  fontFamily: "'IBM Plex Mono',monospace",
  fontSize: 8,
  letterSpacing: ".12em",
  padding: "5px 10px",
  cursor: "pointer",
  transition: "all .2s",
  width: "100%",
};
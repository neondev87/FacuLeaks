"use client";

import { useState, useEffect } from "react";

export default function SpotifyWidget({ userId, onConnect }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        const res  = await fetch(`http://localhost:4000/api/spotify/now-playing/${userId}`);
        const json = await res.json();
        setData(json);
      } catch {}
      setLoading(false);
    };
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [userId]);

  if (loading) return (
    <div style={{ padding:"10px 14px", border:"1px solid rgba(255,255,255,.06)", fontSize:9, fontFamily:"'IBM Plex Mono',monospace", color:"rgba(255,255,255,.2)", letterSpacing:".1em" }}>
      cargando spotify...
    </div>
  );

  if (!data?.connected) return (
    <button onClick={onConnect}
      style={{ background:"transparent", border:"1px solid rgba(255,255,255,.15)", color:"rgba(255,255,255,.4)", fontFamily:"'IBM Plex Mono',monospace", fontSize:9, letterSpacing:".15em", padding:"8px 16px", cursor:"pointer", transition:"all .2s", width:"100%" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(255,255,255,.4)"; e.currentTarget.style.color="#fff"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(255,255,255,.15)"; e.currentTarget.style.color="rgba(255,255,255,.4)"; }}
    >
      conectar spotify
    </button>
  );

  if (!data.track) return (
    <div style={{ padding:"10px 14px", border:"1px solid rgba(255,255,255,.06)", fontSize:9, fontFamily:"'IBM Plex Mono',monospace", color:"rgba(255,255,255,.2)", letterSpacing:".1em" }}>
      sin actividad reciente
    </div>
  );

  const pct = data.progress && data.duration ? (data.progress / data.duration) * 100 : null;

  return (
    <div style={{ border:"1px solid rgba(255,255,255,.08)", padding:"10px 12px", display:"flex", gap:10, alignItems:"center", background:"rgba(255,255,255,.02)" }}>
      {data.albumArt && (
        <img src={data.albumArt} alt="album"
          style={{ width:40, height:40, objectFit:"cover", flexShrink:0, border:"1px solid rgba(255,255,255,.08)" }} />
      )}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ marginBottom:3 }}>
          <span style={{ fontSize:7, fontFamily:"'IBM Plex Mono',monospace", color: data.isPlaying ? "#1db954" : "rgba(255,255,255,.3)", letterSpacing:".12em" }}>
            {data.isPlaying ? "AHORA" : "ULTIMO"}
          </span>
        </div>
        <div style={{ fontSize:11, color:"#e8e4d9", fontFamily:"'IBM Plex Sans',sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {data.track}
        </div>
        <div style={{ fontSize:9, color:"rgba(255,255,255,.4)", fontFamily:"'IBM Plex Mono',monospace", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginTop:1 }}>
          {data.artist}
        </div>
        {pct !== null && (
          <div style={{ height:1.5, background:"rgba(255,255,255,.1)", borderRadius:1, marginTop:5, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${pct}%`, background:"#1db954", borderRadius:1 }} />
          </div>
        )}
      </div>
      <a href={data.spotifyUrl} target="_blank" rel="noopener noreferrer"
        style={{ fontSize:14, color:"rgba(255,255,255,.2)", textDecoration:"none", flexShrink:0, transition:"color .2s" }}
        onMouseEnter={e => e.currentTarget.style.color = "#1db954"}
        onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.2)"}
      >+</a>
    </div>
  );
}
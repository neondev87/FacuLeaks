"use client";

import { useState, useRef } from "react";

// MÓDULO: components/chat/AudioPlayer.js
// Reproductor de un mensaje de voz: play/pausa, barra de progreso
// clickeable, tiempo transcurrido/total. `crossOrigin="use-credentials"` es
// importante — el audio está gateado en el backend (solo emisor/receptor
// pueden pedirlo, ver backend/src/modules/chat/chat.controller.js
// serveAudio), así que el navegador tiene que mandar la cookie de sesión al
// pedir el archivo, no solo al cargar la página. Lo usa components/chat/Bubble.js.
export default function AudioPlayer({ src, esPropio }) {
  const [playing,  setPlaying]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  const fmt = s => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`;
  const textCol = esPropio ? "rgba(0,0,0,.7)"  : "rgba(255,255,255,.7)";
  const barBg   = esPropio ? "rgba(0,0,0,.15)" : "rgba(255,255,255,.15)";
  const barFill = esPropio ? "rgba(0,0,0,.8)"  : "rgba(255,255,255,.8)";

  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, width:"100%" }}>
      <audio ref={audioRef} src={src} crossOrigin="use-credentials" style={{ display:"none" }}
        onTimeUpdate={e => setProgress(e.target.currentTime)}
        onLoadedMetadata={e => setDuration(e.target.duration)}
        onEnded={() => { setPlaying(false); setProgress(0); }} />
      <button onClick={toggle} style={{ background:"none", border:"none", cursor:"pointer", padding:0, color:textCol, fontSize:14, flexShrink:0, lineHeight:1 }}>
        {playing ? "⏸" : "▶"}
      </button>
      <div style={{ flex:1, height:2, background:barBg, borderRadius:1, cursor:"pointer", position:"relative" }}
        onClick={e => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct  = (e.clientX - rect.left) / rect.width;
          if (audioRef.current) { audioRef.current.currentTime = pct * duration; setProgress(pct * duration); }
        }}>
        <div style={{ height:"100%", width: duration ? `${(progress/duration)*100}%` : "0%", background:barFill, borderRadius:1, transition:"width .1s linear" }} />
      </div>
      <span style={{ fontSize:9, fontFamily:"'IBM Plex Mono',monospace", color:textCol, flexShrink:0 }}>
        {fmt(progress)} / {fmt(duration)}
      </span>
    </div>
  );
}

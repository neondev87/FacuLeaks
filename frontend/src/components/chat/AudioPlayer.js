"use client";

import { useEffect, useRef, useState } from "react";

// MÓDULO: components/chat/AudioPlayer.js
// Reproductor de un mensaje de voz: play/pausa, barra de progreso con perilla
// arrastrable (estilo WhatsApp) y tiempo restante.
//
// FLUIDEZ: el progreso NO se mueve con los eventos `timeupdate` del navegador
// (llegan salteados, ~4/s, y la perilla "salta"). Mientras suena corremos un
// bucle de requestAnimationFrame que lee audio.currentTime en cada frame, así
// la perilla y la barra van suaves a 60fps.
//
// DURACIÓN: los audios grabados con MediaRecorder (webm) suelen reportar
// `duration === Infinity` en loadedmetadata. Sin una duración válida la barra
// y el cronómetro se vuelven locos (progreso/Infinity = 0, o NaN). Por eso, si
// llega Infinity, se hace el truco de saltar al final para forzar al navegador
// a calcular la real y volver a 0.
//
// `crossOrigin="use-credentials"` — el audio está gateado en el backend (ver
// chat.controller.js serveAudio): el navegador tiene que mandar la cookie de
// sesión al pedir el archivo. Lo usa components/chat/Bubble.js.
export default function AudioPlayer({ src, esPropio }) {
  const [playing,  setPlaying]  = useState(false);
  const [cur,      setCur]      = useState(0);
  const [dur,      setDur]      = useState(0);
  const [dragging, setDragging] = useState(false);
  const audioRef  = useRef(null);
  const barRef    = useRef(null);
  const rafRef    = useRef(0);
  const fixingDur = useRef(false);

  // Bucle de animación: mientras suena (y no se está arrastrando), seguimos
  // currentTime frame a frame para que la perilla se mueva fluida.
  useEffect(() => {
    if (!playing || dragging) return undefined;
    const tick = () => {
      const a = audioRef.current;
      if (a) setCur(a.currentTime);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, dragging]);

  const setDurSafe = d => {
    if (d && d !== Infinity && !Number.isNaN(d)) setDur(d);
  };

  const onLoadedMetadata = e => {
    const d = e.target.duration;
    if (d === Infinity || Number.isNaN(d)) {
      // truco webm/MediaRecorder: forzar el cálculo de la duración real
      fixingDur.current = true;
      try { e.target.currentTime = 1e101; } catch { /* ignora */ }
    } else {
      setDur(d);
    }
  };

  const onDurationChange = e => {
    if (fixingDur.current) return;      // lo resuelve onTimeUpdate más abajo
    setDurSafe(e.target.duration);
  };

  const onTimeUpdate = e => {
    const a = e.target;
    if (fixingDur.current) {
      fixingDur.current = false;
      setDurSafe(a.duration);
      try { a.currentTime = 0; } catch { /* ignora */ }
      setCur(0);
      return;
    }
    if (!playing) setCur(a.currentTime);
  };

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play(); setPlaying(true); }
  };

  const pct = dur ? Math.min(1, Math.max(0, cur / dur)) : 0;

  const seekRatio = clientX => {
    const el = barRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  };
  const onPointerDown = e => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDragging(true);
    if (dur) setCur(seekRatio(e.clientX) * dur);
  };
  const onPointerMove = e => { if (dragging && dur) setCur(seekRatio(e.clientX) * dur); };
  const onPointerUp = e => {
    if (!dragging) return;
    setDragging(false);
    const a = audioRef.current;
    if (a && dur) { const t = seekRatio(e.clientX) * dur; a.currentTime = t; setCur(t); }
  };

  const fmt = s => {
    if (!s || Number.isNaN(s) || s === Infinity) return "0:00";
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  };

  const textCol = esPropio ? "rgba(0,0,0,.7)"  : "rgba(255,255,255,.7)";
  const barBg   = esPropio ? "rgba(0,0,0,.15)" : "rgba(255,255,255,.15)";
  const barFill = esPropio ? "rgba(0,0,0,.82)" : "rgba(255,255,255,.85)";
  // En reposo: duración total. Sonando o pausado a mitad: lo que falta.
  const shown = (playing || cur > 0.05) ? Math.max(0, dur - cur) : dur;
  const knob = dragging ? 13 : 10;

  return (
    <div style={{ display:"flex", alignItems:"center", gap:11, width:"100%" }}>
      <audio ref={audioRef} src={src} crossOrigin="use-credentials" preload="metadata" style={{ display:"none" }}
        onLoadedMetadata={onLoadedMetadata}
        onDurationChange={onDurationChange}
        onTimeUpdate={onTimeUpdate}
        onEnded={() => { setPlaying(false); setCur(0); }} />

      <button onClick={toggle} aria-label={playing ? "Pausar" : "Reproducir"}
        style={{ background:"none", border:"none", cursor:"pointer", padding:0, color:textCol, flexShrink:0, lineHeight:0, display:"flex" }}>
        {playing
          ? <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
          : <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14z" /></svg>}
      </button>

      <div ref={barRef}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
        style={{ flex:1, height:18, display:"flex", alignItems:"center", cursor:"pointer", position:"relative", touchAction:"none" }}>
        <div style={{ position:"absolute", left:0, right:0, top:"50%", height:3, marginTop:-1.5, background:barBg, borderRadius:2 }} />
        <div style={{ position:"absolute", left:0, top:"50%", height:3, marginTop:-1.5, width:`${pct*100}%`, background:barFill, borderRadius:2 }} />
        <div style={{
          position:"absolute", left:`${pct*100}%`, top:"50%", width:knob, height:knob,
          marginTop:-(knob/2), marginLeft:-(knob/2), borderRadius:"50%", background:barFill,
          boxShadow: esPropio ? "0 0 0 3px rgba(0,0,0,.08)" : "0 0 0 3px rgba(255,255,255,.12)",
          transition:"width .12s ease, height .12s ease, margin .12s ease",
        }} />
      </div>

      <span style={{ fontSize:12, fontFamily:"'Space Mono',monospace", color:textCol, flexShrink:0, fontVariantNumeric:"tabular-nums", minWidth:34, textAlign:"right" }}>
        {fmt(shown)}
      </span>
    </div>
  );
}

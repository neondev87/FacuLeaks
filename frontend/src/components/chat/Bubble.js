"use client";

import { useState } from "react";
import { API } from "@/lib/api";
import Lightbox from "@/components/Lightbox";
import MicIcon from "./MicIcon";
import AudioPlayer from "./AudioPlayer";
import AudioReplyPreview from "./AudioReplyPreview";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: components/chat/Bubble.js — UNA burbuja de mensaje de chat
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: dibuja un mensaje según su tipo — texto normal, audio (con
// AudioPlayer.js) o imagen (con Lightbox al hacer click) — y, si es
// respuesta a otro mensaje, la cita arriba. Al pasar el mouse aparecen los
// botones de "responder" y (si es tuyo) "borrar", con su animación.
//
// PARA QUÉ SIRVE: es la pieza que se repite una vez por cada mensaje en
// app/chat/page.js. Convención del proyecto: este componente vive SIEMPRE
// fuera/afuera de la página de chat (no inline adentro de ChatPage) — regla
// vieja del prompt maestro que se mantiene.
//
// CON QUÉ SE CONECTA:
//   - components/chat/AudioPlayer.js, MicIcon.js, AudioReplyPreview.js,
//     components/Lightbox.js.
//   - No llama al backend directo: recibe `onReply` y `onDelete` de
//     app/chat/page.js, que a su vez usan hooks/useChat.js.
// ════════════════════════════════════════════════════════════════════════
export default function Bubble({ msg, esPropio, replyMsg, onReply, onDelete }) {
  const [hov,      setHov]      = useState(false);
  const [delPhase, setDelPhase] = useState("idle");
  const [lightbox, setLightbox] = useState(false);
  const formatTime = d => d ? new Date(d).toLocaleTimeString("es-MX", { hour:"2-digit", minute:"2-digit" }) : "";
  const isAudioMsg = msg.tipo === "audio" && msg.audioUrl;
  const isImageMsg = msg.tipo === "imagen" && msg.imageUrl;

  const handleDelete = () => {
    setDelPhase("open");
    setTimeout(() => {
      setDelPhase("shrink");
      setTimeout(() => { setDelPhase("gone"); onDelete(msg.id); }, 280);
    }, 320);
  };

  const trashCol = delPhase === "idle" ? "rgba(255,255,255,.4)" : "rgba(255,80,80,.85)";

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display:"flex", flexDirection:"column", alignItems: esPropio ? "flex-end" : "flex-start", gap:3 }}>

      {hov && (
        <div style={{ display:"flex", gap:4, alignItems:"center", marginBottom:2 }}>
          <div className="reply-btn" onClick={() => onReply(msg)}>↩ responder</div>
          {esPropio && (
            <button onClick={handleDelete} title="Eliminar"
              style={{ background:"none", border:"none", cursor:"pointer", padding:"2px 4px", display:"flex", alignItems:"center" }}>
              <div style={{
                transition: delPhase==="shrink" ? "all .28s cubic-bezier(.4,0,.6,1)" : "none",
                transform: delPhase==="shrink" ? "scale(.05) perspective(200px) translateZ(-80px)" : delPhase==="open" ? "scale(1.15)" : "scale(1)",
                opacity: delPhase==="gone" ? 0 : 1,
              }}>
                <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
                  <rect x="1" y="3" width="10" height="10" rx="1" stroke={trashCol} strokeWidth="1"/>
                  <path d="M4 3V2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1" stroke={trashCol} strokeWidth="1"/>
                  <line x1="0" y1="3" x2="12" y2="3" stroke={trashCol} strokeWidth="1"/>
                  <line x1="4.5" y1="6" x2="4.5" y2="10" stroke={trashCol} strokeWidth="1"/>
                  <line x1="7.5" y1="6" x2="7.5" y2="10" stroke={trashCol} strokeWidth="1"/>
                </svg>
              </div>
            </button>
          )}
        </div>
      )}

      {lightbox && isImageMsg && <Lightbox src={msg.imageUrl} onClose={() => setLightbox(false)} />}

      <div className={esPropio ? "bubble-me" : "bubble-other"} style={ isAudioMsg ? { background: esPropio ? "#fff" : "#141414" } : isImageMsg ? { background: "transparent", padding: 0 } : {} }>
        {replyMsg && (
          <div className={esPropio ? "reply-bar-me" : "reply-bar-other"}>
            <div style={{ width:2.5, borderRadius:2, background: esPropio ? "rgba(0,0,0,.22)" : "rgba(255,255,255,.28)", alignSelf:"stretch", flexShrink:0 }} />
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:8, fontFamily:"'IBM Plex Mono',monospace", color: esPropio ? "rgba(0,0,0,.6)" : "rgba(255,255,255,.58)", marginBottom:1, letterSpacing:".04em" }}>
                {replyMsg.emisor?.username || "Tú"}
              </div>
              <div style={{ fontSize:10, fontFamily:"'IBM Plex Sans',sans-serif", color: esPropio ? "rgba(0,0,0,.42)" : "rgba(255,255,255,.36)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:240 }}>
                {replyMsg.tipo === "audio" && replyMsg.audioUrl
                  ? <AudioReplyPreview src={replyMsg.audioUrl} />
                  : replyMsg.contenido}
              </div>
            </div>
          </div>
        )}

        {isAudioMsg ? (
          <div style={{ padding:"10px 14px", display:"flex", flexDirection:"column", gap:6, width:600 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
              <MicIcon size={12} recording={false} />
              <span style={{ fontFamily:"'IBM Plex Sans',sans-serif", fontSize:10, color: esPropio ? "rgba(0,0,0,.5)" : "rgba(255,255,255,.4)", letterSpacing:".04em" }}>
                mensaje de voz
              </span>
            </div>
            <AudioPlayer src={`${API}${msg.audioUrl}`} esPropio={esPropio} />
            <div className={esPropio ? "bubble-time-me" : "bubble-time-other"} style={{ alignSelf:"flex-end", marginTop:2 }}>
              {formatTime(msg.creadoEn)}
            </div>
          </div>
        ) : isImageMsg ? (
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            <img
              src={`${API}${msg.imageUrl}`}
              alt="imagen"
              onClick={() => setLightbox(true)}
              style={{ display:"block", maxWidth:280, maxHeight:320, width:"auto", objectFit:"cover", border:"1px solid rgba(255,255,255,.1)", cursor:"pointer" }}
            />
            <div className={esPropio ? "bubble-time-me" : "bubble-time-other"} style={{ alignSelf:"flex-end" }}>
              {formatTime(msg.creadoEn)}
            </div>
          </div>
        ) : (
          <div style={{ padding:"9px 14px", display:"flex", alignItems:"flex-end", gap:10 }}>
            <div className={esPropio ? "bubble-text-me" : "bubble-text-other"}>{msg.contenido}</div>
            <div className={esPropio ? "bubble-time-me" : "bubble-time-other"}>{formatTime(msg.creadoEn)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

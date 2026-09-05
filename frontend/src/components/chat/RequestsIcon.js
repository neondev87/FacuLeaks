"use client";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: components/chat/RequestsIcon.js — avioncito de "solicitudes de mensaje"
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: botón cuadrado con un ícono de avión de papel — gris cuando no
// hay solicitudes pendientes (`count === 0`), rojo con una badge numérica
// cuando sí hay. Es un componente "tonto": no sabe qué son las solicitudes,
// solo pinta el número que le pasan y avisa el click.
//
// PARA QUÉ SIRVE: mismo concepto que "solicitudes de mensaje" de Instagram
// (gente que no te sigue) — acá es "gente que no es tu amigo todavía".
// La lógica real de qué cuenta como solicitud vive en el backend
// (chat.controller.js → getConversaciones) y se resume en useChat.js
// (`solicitudes`).
//
// CON QUÉ SE CONECTA: lo dibuja app/chat/page.js en la cabecera del sidebar,
// al lado del título "Mensajes". El click abre/cierra el panel desplegable
// con la lista de solicitudes (JSX en la propia page.js).
// ════════════════════════════════════════════════════════════════════════
export default function RequestsIcon({ count = 0, active = false, onClick }) {
  const hayPendientes = count > 0;
  const col = hayPendientes ? "#cc3344" : "rgba(255,255,255,.25)";
  return (
    <button onClick={onClick} title="Solicitudes de mensaje"
      style={{
        position:"relative", background: active ? "rgba(255,255,255,.06)" : "none",
        border:"none", cursor:"pointer", padding:6, borderRadius:8,
        display:"flex", alignItems:"center", justifyContent:"center", transition:"background .15s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.06)"}
      onMouseLeave={e => e.currentTarget.style.background = active ? "rgba(255,255,255,.06)" : "none"}
    >
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="21" y1="3" x2="10" y2="14" />
        <polygon points="21 3 14 21 10 14 3 10 21 3" />
      </svg>
      {hayPendientes && (
        <span style={{
          position:"absolute", top:-2, right:-2, background:"#cc3344", color:"#fff",
          fontSize:9, fontFamily:"'Space Mono',monospace", fontWeight:600,
          minWidth:16, height:16, borderRadius:999, padding:"0 4px",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>{count}</span>
      )}
    </button>
  );
}

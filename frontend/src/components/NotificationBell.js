"use client";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: components/NotificationBell.js — icono de campana de la navbar
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: botón cuadrado con una campana — gris cuando no hay
// notificaciones sin leer (`count === 0`), roja con una badge numérica
// cuando sí hay. Mismo patrón exacto que components/chat/RequestsIcon.js
// (avioncito de solicitudes de mensaje): componente "tonto", solo pinta el
// número que le pasan y avisa el click.
//
// CON QUÉ SE CONECTA: lo dibuja components/Navbar.js (dos veces — una para
// el layout de escritorio, a la derecha de AMIGOS, y otra para el de
// celular — ver comentario en Navbar.js). El estado real vive en
// hooks/useNotifications.js.
// ════════════════════════════════════════════════════════════════════════
export default function NotificationBell({ count = 0, active = false, onClick }) {
  const hayPendientes = count > 0;
  const col = hayPendientes ? "#cc3344" : "rgba(255,255,255,.25)";
  return (
    <button onClick={onClick} title="Notificaciones"
      style={{
        position:"relative", background: active ? "rgba(255,255,255,.06)" : "none",
        border:"none", cursor:"pointer", padding:6, borderRadius:8,
        display:"flex", alignItems:"center", justifyContent:"center", transition:"background .15s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.06)"}
      onMouseLeave={e => e.currentTarget.style.background = active ? "rgba(255,255,255,.06)" : "none"}
    >
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
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

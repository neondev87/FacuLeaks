import { HOLO_THEME } from "@/lib/theme";

// MÓDULO: components/chat/TypingIndicator.js
// Burbuja "Fulano está escribiendo" con tres puntos que RESPIRAN (opacidad,
// escalonados) — nada de saltos. Puramente visual: hooks/useChat.js decide
// cuándo mostrarla (typing:start/stop por socket), este componente solo la
// dibuja. Lo usa app/chat/page.js. Los puntos (.typing-dots) y su animación
// (typingBreathe) están en app/chat/chatStyles.js.
export default function TypingIndicator({ username }) {
  return (
    <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:10, animation:"fadeUp .18s ease" }}>
      <div className="avatar-sm">◈</div>
      <div style={{ display:"flex", alignItems:"center", gap:9, background:HOLO_THEME.panel, borderRadius:14, padding:"9px 14px", border:`1px solid ${HOLO_THEME.hairlineSoft}` }}>
        <span className="typing-dots"><i /><i /><i /></span>
        <span style={{ fontFamily:"'EB Garamond',serif", fontStyle:"italic", fontSize:13, color:HOLO_THEME.textDim }}>
          {username} está escribiendo
        </span>
      </div>
    </div>
  );
}

import { BARS } from "./constants";
import { HOLO_THEME } from "@/lib/theme";

// MÓDULO: components/chat/AudioIndicator.js
// Burbuja "Fulano está mandando un audio..." con las barritas de un
// visualizador de audio animadas. Puramente visual — hooks/useChat.js
// decide CUÁNDO mostrarla (evento de socket audio:start/stop), este
// componente solo la dibuja.
export default function AudioIndicator({ username, label="mandando audio" }) {
  return (
    <div style={{ display:"flex", gap:10, alignItems:"flex-end", marginBottom:10, animation:"fadeUp .18s ease" }}>
      <div className="avatar-sm">◈</div>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-start" }}>
        <div style={{ fontSize:12, fontFamily:"'Space Mono',monospace", color:"rgba(255,255,255,.28)", marginBottom:4, letterSpacing:".08em" }}>{username}</div>
        <div style={{ background:HOLO_THEME.panel, borderRadius:12, padding:"11px 16px", border:`1px solid ${HOLO_THEME.hairlineSoft}`, display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontFamily:"'Space Mono',monospace", fontSize:12, color:"rgba(255,255,255,.35)", letterSpacing:".08em", marginRight:4 }}>{label}</span>
          {BARS.map((h, i) => (
            <div key={i} style={{ width:2.5, borderRadius:2, background:"rgba(61,220,132,.7)", height:`${h*16}px`, animation:`wave 0.9s ease ${i*0.06}s infinite`, transformOrigin:"center" }}/>
          ))}
        </div>
      </div>
    </div>
  );
}

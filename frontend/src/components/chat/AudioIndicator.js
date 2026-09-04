import { BARS } from "./constants";

// ── Indicador "mandando audio" del otro usuario ──
export default function AudioIndicator({ username, label="mandando audio" }) {
  return (
    <div style={{ display:"flex", gap:10, alignItems:"flex-end", marginBottom:10, animation:"fadeUp .18s ease" }}>
      <div className="avatar-sm">◈</div>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-start" }}>
        <div style={{ fontSize:9, fontFamily:"'IBM Plex Mono',monospace", color:"rgba(255,255,255,.28)", marginBottom:3, letterSpacing:".08em" }}>{username}</div>
        <div style={{ background:"#0d0d0d", borderRadius:3, padding:"10px 14px", border:"1px solid rgba(255,255,255,.08)", display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:"rgba(255,255,255,.35)", letterSpacing:".08em", marginRight:4 }}>{label}</span>
          {BARS.map((h, i) => (
            <div key={i} style={{ width:2.5, borderRadius:2, background:"rgba(61,220,132,.7)", height:`${h*16}px`, animation:`wave 0.9s ease ${i*0.06}s infinite`, transformOrigin:"center" }}/>
          ))}
        </div>
      </div>
    </div>
  );
}

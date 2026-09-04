import PixelFlame from "./pixel/PixelFlame";

// ── Racha de conversación (contador + barra 24h) ──
export default function StreakC({ dying=false, count=1, progress=1.0 }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5, padding:"7px 10px", background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.06)", borderRadius:3, width:90, flexShrink:0 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <PixelFlame s={3} dying={dying} />
        <span style={{ fontSize:18, fontWeight:500, fontFamily:"'IBM Plex Mono',monospace", color: dying ? "#404040" : "#ffaa00", letterSpacing:"-.04em", transition:"color .4s" }}>{count}</span>
      </div>
      <div style={{ height:2, background: dying ? "rgba(255,255,255,.05)" : "rgba(255,140,0,.12)", borderRadius:1, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${progress*100}%`, background: dying ? "#333" : "#ff6600", borderRadius:1, transition:"width .4s, background .4s", animation: dying ? "pulse 2s ease-in-out infinite" : "none" }}/>
      </div>
      <div style={{ fontSize:7, letterSpacing:".1em", fontFamily:"'IBM Plex Mono',monospace", color: dying ? "#333" : "rgba(255,140,0,.4)", transition:"color .4s" }}>
        {dying ? "12H · EXPIRA" : "24H · ACTIVO"}
      </div>
    </div>
  );
}

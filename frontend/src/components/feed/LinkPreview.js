"use client";

// ── LINK PREVIEW ──
// Tarjeta de vista previa de un enlace pegado en el composer.
export default function LinkPreview({ data, onRemove }) {
  if (!data) return null;
  return (
    <div style={{ border:"1px solid rgba(255,255,255,.1)", marginBottom:10, background:"rgba(255,255,255,.03)", position:"relative" }}>
      {data.imagen && <img src={data.imagen} alt="preview" style={{ width:"100%", maxHeight:180, objectFit:"cover", display:"block" }} onError={e => e.target.style.display="none"} />}
      <div style={{ padding:"8px 12px" }}>
        <div style={{ fontSize:11, color:"rgba(255,255,255,.6)", fontFamily:"'Inter',sans-serif", marginBottom:3 }}>{data.titulo || data.url}</div>
        {data.descripcion && <div style={{ fontSize:10, color:"rgba(255,255,255,.3)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{data.descripcion}</div>}
        <div style={{ fontSize:9, color:"rgba(255,255,255,.2)", marginTop:3 }}>{data.url}</div>
      </div>
      <div onClick={onRemove} style={{ position:"absolute", top:6, right:6, background:"#000", border:"1px solid rgba(255,255,255,.2)", color:"rgba(255,255,255,.5)", width:20, height:20, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:11 }}>✕</div>
    </div>
  );
}

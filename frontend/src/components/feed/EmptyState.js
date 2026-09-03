// ── EMPTY STATE ──
// Mensaje cuando la pestaña del feed no tiene posts.
export default function EmptyState({ tab }) {
  const msgs = {
    RECIENTES: { title:"tu feed está vacío",  sub:"sé el primero en publicar algo" },
    TRENDING:  { title:"nada trending aún",   sub:"sé el primero en publicar algo" },
    SIGUIENDO: { title:"sin conexiones",       sub:"agrega amigos para ver su contenido" },
  };
  const m = msgs[tab] || msgs.RECIENTES;
  return (
    <div style={{ textAlign:"center", padding:"60px 0", color:"#333" }}>
      <div style={{ fontSize:28, marginBottom:12 }}>◈</div>
      <div style={{ fontSize:14, color:"#555", marginBottom:6, fontFamily:"'Inter',sans-serif" }}>{m.title}</div>
      <div style={{ fontSize:11, color:"#333", fontFamily:"'Inter',sans-serif" }}>{m.sub}</div>
    </div>
  );
}

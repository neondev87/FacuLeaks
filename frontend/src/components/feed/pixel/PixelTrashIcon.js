// ── PIXEL TRASH ──
// Bote de basura pixel 9x11
const TRASH_BODY = [
  [0,1,1,1,1,1,1,1,0],
  [0,1,0,1,0,1,0,1,0],
  [0,1,0,1,0,1,0,1,0],
  [0,1,0,1,0,1,0,1,0],
  [0,1,0,1,0,1,0,1,0],
  [0,1,1,1,1,1,1,1,0],
];
const TRASH_LID_CLOSED  = [[0,0,1,1,1,1,1,0,0],[0,1,1,1,1,1,1,1,0],[0,0,0,1,1,1,0,0,0]];
const TRASH_LID_OPEN    = [[0,0,0,1,1,1,0,0,0],[0,1,1,1,1,1,1,1,0],[0,0,1,1,1,1,1,0,0]]; // tapa abierta rotada

export default function PixelTrashIcon({ s=3, phase="idle" }) {
  const lidRows = phase === "open" || phase === "shrink" ? TRASH_LID_OPEN : TRASH_LID_CLOSED;
  const col = phase === "idle" ? "rgba(255,255,255,.35)"
            : phase === "open" ? "rgba(255,80,80,.8)"
            : "rgba(255,80,80,.5)";
  return (
    <svg width={9*s} height={11*s} viewBox={`0 0 ${9*s} ${11*s}`} style={{ display:"block" }}>
      {/* Tapa */}
      {lidRows.map((row,r) => row.map((cell,c) =>
        cell ? <rect key={`lid-${r}-${c}`} x={c*s} y={r*s} width={s} height={s} fill={col}/> : null
      ))}
      {/* Cuerpo */}
      {TRASH_BODY.map((row,r) => row.map((cell,c) =>
        cell ? <rect key={`body-${r}-${c}`} x={c*s} y={(r+3)*s} width={s} height={s} fill={col}/> : null
      ))}
    </svg>
  );
}

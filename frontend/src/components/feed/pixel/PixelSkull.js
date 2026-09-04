// MÓDULO: components/feed/pixel/PixelSkull.js
// Dibuja la calavera pixel-art del botón de DISLIKE, misma técnica que
// PixelHeart.js (grilla → <rect> SVG). Puramente visual — lo usa
// components/feed/SkullIcon.js.
const SKL = [
  [0,0,1,1,1,1,0,0],
  [0,1,1,1,1,1,1,0],
  [1,1,0,1,1,0,1,1],
  [1,1,0,1,1,0,1,1],
  [1,1,1,1,1,1,1,1],
  [0,1,1,1,1,1,1,0],
  [0,1,0,1,1,0,1,0],
  [0,0,0,0,0,0,0,0],
];

export default function PixelSkull({ s=3, color="rgba(255,255,255,.35)" }) {
  return (
    <svg width={8*s} height={8*s} viewBox={`0 0 ${8*s} ${8*s}`} style={{ display:"block" }}>
      {SKL.map((row,r) => row.map((cell,c) =>
        cell ? <rect key={`${r}-${c}`} x={c*s} y={r*s} width={s} height={s} fill={color}/> : null
      ))}
    </svg>
  );
}

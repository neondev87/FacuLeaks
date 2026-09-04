// MÓDULO: components/chat/pixel/PixelFlame.js
// Dibuja la llamita pixel-art de la racha (StreakC.js) como grilla de
// colores → <rect> SVG. Puramente visual.
const FLAME_MAP = [
  [0,0,0,0,1,1,0,0,0,0],[0,0,0,1,2,2,1,0,0,0],[0,0,0,1,3,2,1,1,0,0],
  [0,0,1,2,4,3,2,1,0,0],[0,1,2,3,5,4,3,1,0,0],[0,1,3,4,5,5,4,2,1,0],
  [1,2,4,5,5,5,4,3,1,0],[1,3,4,5,5,5,5,4,2,1],[1,2,3,4,5,5,4,3,1,0],
  [0,1,2,3,4,4,3,2,1,0],[0,0,1,2,3,3,2,1,0,0],[0,0,0,1,2,2,1,0,0,0],
  [0,0,0,0,1,1,0,0,0,0],
];
const FC_HOT  = { 1:"#7a0000", 2:"#c41800", 3:"#ff5500", 4:"#ffaa00", 5:"#ffe566" };
const FC_COLD = { 1:"#2a2a2a", 2:"#3a3a3a", 3:"#4a4a4a", 4:"#5a5a5a", 5:"#6a6a6a" };

export default function PixelFlame({ s=3, dying=false }) {
  const C = dying ? FC_COLD : FC_HOT;
  return (
    <svg width={10*s} height={13*s} viewBox={`0 0 ${10*s} ${13*s}`}
      style={{ display:"block", animation: !dying ? "flicker 1.6s ease-in-out infinite" : "none" }}>
      {FLAME_MAP.map((row, r) => row.map((cell, c) =>
        cell ? <rect key={`${r}-${c}`} x={c*s} y={r*s} width={s} height={s} fill={C[cell]} /> : null
      ))}
    </svg>
  );
}

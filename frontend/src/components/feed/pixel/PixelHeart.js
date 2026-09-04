// MÓDULO: components/feed/pixel/PixelHeart.js
// Dibuja el corazón pixel-art del botón de LIKE como una grilla de <rect>
// SVG (cada número de la matriz es un color distinto). Puramente visual,
// sin lógica ni conexión — lo usa components/feed/HeartIcon.js.
const HRT = [
  [0,0,1,1,0,0,1,1,0,0],
  [0,1,3,3,1,1,3,3,1,0],
  [1,3,4,3,3,3,2,3,3,1],
  [1,3,4,3,3,3,3,3,3,1],
  [1,3,3,3,3,3,3,3,3,1],
  [0,1,3,3,3,3,3,3,1,0],
  [0,0,1,3,3,3,3,1,0,0],
  [0,0,0,1,3,3,1,0,0,0],
  [0,0,0,0,1,1,0,0,0,0],
];
const HC = { 1:"#000", 2:"#7a0000", 3:"#c00000", 4:"#ff5555" };

export default function PixelHeart({ s=3, white=false }) {
  return (
    <svg width={10*s} height={9*s} viewBox={`0 0 ${10*s} ${9*s}`} style={{ display:"block" }}>
      {HRT.map((row,r) => row.map((cell,c) =>
        cell ? <rect key={`${r}-${c}`} x={c*s} y={r*s} width={s} height={s} fill={white ? "#fff" : HC[cell]}/> : null
      ))}
    </svg>
  );
}

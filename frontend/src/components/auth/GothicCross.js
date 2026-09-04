"use client";

// MÓDULO: components/auth/GothicCross.js
// La cruz gótica dibujada a mano (SVG) del panel derecho del login.
// Puramente visual, sin conexión a backend. Parte de la estética
// cyberpunk/glitch que el proyecto protege — no tocar el dibujo.
export default function GothicCross({ size = 54, opacity = 0.38, style = {} }) {
  return (
    <svg width={size} height={size * 1.78} viewBox="0 0 80 140" fill="none" style={{ opacity, ...style }}>
      <g stroke="white" strokeWidth="0.5" fill="none" strokeLinecap="round">
        <line x1="40" y1="5" x2="40" y2="135" />
        <line x1="10" y1="38" x2="70" y2="38" />
        <line x1="18" y1="52" x2="62" y2="52" />
        <path d="M40 5 C37 2 34 3 35 6 C36 8 38 8 40 7 C42 8 44 8 45 6 C46 3 43 2 40 5" />
        <path d="M10 38 C6 34 4 30 7 28 C9 27 11 29 10 32" />
        <path d="M7 28 C4 24 5 20 8 20 C10 20 11 23 9 25" />
        <path d="M10 38 C8 42 6 44 8 47 C10 48 12 46 11 43" />
        <path d="M70 38 C74 34 76 30 73 28 C71 27 69 29 70 32" />
        <path d="M73 28 C76 24 75 20 72 20 C70 20 69 23 71 25" />
        <path d="M70 38 C72 42 74 44 72 47 C70 48 68 46 69 43" />
        <circle cx="40" cy="38" r="2.5" strokeWidth="0.4" />
        <circle cx="40" cy="38" r="1" fill="white" stroke="none" />
        <path d="M40 15L37 10" /><path d="M40 15L43 10" />
        <path d="M40 22L36 18" /><path d="M40 22L44 18" />
        <path d="M40 60L37 55" /><path d="M40 60L43 55" />
        <path d="M40 75L36 70" /><path d="M40 75L44 70" />
        <path d="M40 90L37 85" /><path d="M40 90L43 85" />
        <path d="M32 30 C28 26 26 22 28 18" />
        <path d="M48 30 C52 26 54 22 52 18" />
        <path d="M32 46 C28 50 26 54 28 58" />
        <path d="M48 46 C52 50 54 54 52 58" />
        <path d="M40 135 C37 138 34 137 35 134 C36 132 38 132 40 133 C42 132 44 132 45 134 C46 137 43 138 40 135" />
      </g>
    </svg>
  );
}

"use client";

// MÓDULO: components/auth/NeonDevMark.js
// El branding "NeonDev" del panel derecho del login. Puramente visual, sin
// conexión a backend.
export default function NeonDevMark() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, pointerEvents: "none", userSelect: "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="2" width="20" height="20" rx="2" stroke="rgba(255,255,255,.75)" strokeWidth="1"/>
          <path d="M7 12 L10 8 L13 12 L16 8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7 16 L17 16" stroke="rgba(255,255,255,.35)" strokeWidth="1" strokeLinecap="round"/>
          <circle cx="19" cy="5" r="2.2" fill="#fff"/>
        </svg>
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 18, fontWeight: 700,
          letterSpacing: ".3em", color: "#fff",
          textTransform: "uppercase",
          textShadow: "0 0 30px rgba(255,255,255,.4)",
        }}>NeonDev</span>
      </div>
      <span style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 8, letterSpacing: ".25em",
        color: "rgba(255,255,255,.3)",
      }}>neondev studio</span>
    </div>
  );
}

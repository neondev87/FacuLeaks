"use client";

// MÓDULO: components/register/ProgressBar.js
// Barra de progreso estilo terminal ([████░░░░░░] 40%) del paso "creando
// cuenta" del registro. Componente "tonto", sin conexión a backend.
export default function ProgressBar({ percent }) {
  const filled = Math.round(percent / 10);
  const empty  = 10 - filled;
  return (
    <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: "#fff" }}>
      [{"█".repeat(filled)}{"░".repeat(empty)}] {percent}%
    </span>
  );
}

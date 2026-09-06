"use client";

import { useState, useEffect, useRef } from "react";
import TrashGlyph from "@/components/TrashGlyph";

// MÓDULO: components/feed/TrashIcon.js
// Botón de "borrar post" del muro, con animación de tres fases (marcar →
// encoger → desaparecer) antes de llamar a `onDelete` (que le pasa
// PostCard.js — el borrado real contra el backend lo hace el padre). El
// dibujo es el ícono único de papelera de la app (components/TrashGlyph.js).
export default function TrashIcon({ onDelete }) {
  const [phase, setPhase] = useState("idle");
  const [deleting, setDeleting] = useState(false);
  const timerRef = useRef();

  const handleClick = async () => {
    if (deleting) return;
    setPhase("open");
    timerRef.current = setTimeout(() => {
      setPhase("shrink");
      setTimeout(async () => {
        setPhase("gone");
        setDeleting(true);
        await onDelete();
      }, 300);
    }, 320);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const color = phase === "idle" ? "rgba(242,240,248,.35)" : "rgba(255,90,90,.95)";

  return (
    <button onClick={handleClick} disabled={deleting} title="Eliminar"
      style={{
        background: "none", border: "none", cursor: deleting ? "not-allowed" : "pointer",
        padding: 5, display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: 7, transition: "background .15s", outline: "none",
        color, opacity: deleting ? .4 : 1,
      }}
      onMouseEnter={e => { if (!deleting) { e.currentTarget.style.background = "rgba(255,90,90,.08)"; e.currentTarget.style.color = "rgba(255,90,90,.9)"; } }}
      onMouseLeave={e => { e.currentTarget.style.background = "none"; if (phase === "idle") e.currentTarget.style.color = "rgba(242,240,248,.35)"; }}
    >
      <div style={{
        display: "inline-block",
        transition: phase === "shrink" ? "transform .3s cubic-bezier(.4,0,.6,1), opacity .3s ease" : "transform .18s ease",
        transform: phase === "shrink" ? "scale(.05) perspective(200px) translateZ(-80px)" : phase === "open" ? "scale(1.18) rotate(-8deg)" : "scale(1)",
        opacity: phase === "gone" ? 0 : 1,
      }}>
        <TrashGlyph size={15} />
      </div>
    </button>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import PixelTrashIcon from "./pixel/PixelTrashIcon";

// ── TRASH ICON BUTTON ──
export default function TrashIcon({ onDelete }) {
  const [phase, setPhase] = useState("idle");
  const [deleting, setDeleting] = useState(false);
  const timerRef = useRef();

  const handleClick = async () => {
    if (deleting) return;
    // Fase 1: abrir tapa
    setPhase("open");
    timerRef.current = setTimeout(() => {
      // Fase 2: encoger
      setPhase("shrink");
      setTimeout(async () => {
        // Fase 3: desaparecer y borrar
        setPhase("gone");
        setDeleting(true);
        await onDelete();
      }, 300);
    }, 350);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <button onClick={handleClick} disabled={deleting}
      style={{
        background: "none", border: "none", cursor: deleting ? "not-allowed" : "pointer",
        padding: "4px 6px", display: "flex", alignItems: "center", gap: 5,
        borderRadius: 2, transition: "background .15s", outline: "none",
        opacity: deleting ? .4 : 1,
      }}
      onMouseEnter={e => { if (!deleting) e.currentTarget.style.background = "rgba(255,60,60,.06)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
    >
      <div style={{
        display: "inline-block",
        transition: phase === "shrink" ? "all .3s cubic-bezier(.4,0,.6,1)" : "none",
        transform: phase === "shrink" ? "scale(.05) perspective(200px) translateZ(-80px)" : phase === "open" ? "scale(1.1)" : "scale(1)",
        opacity: phase === "gone" ? 0 : 1,
        filter: phase === "open" || phase === "shrink" ? "brightness(1.5)" : "none",
      }}>
        <PixelTrashIcon s={3} phase={phase} />
      </div>
    </button>
  );
}

"use client";

import { INTER } from "./constants";

// MÓDULO: components/perfil/edit/PPills.js
// Selector de una sola opción, mostrado como una fila de "pills" en vez de
// un <select> nativo — lo usa EditModal.js para "Situación sentimental".
// Genérico: le pasás `options` (array de strings) y `value`/`onChange`.
export default function PPills({ options, value, onChange }) {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
      {options.map(opt => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            style={{
              background: active ? "rgba(255,255,255,.9)" : "rgba(255,255,255,.05)",
              border: `1px solid ${active ? "rgba(255,255,255,.9)" : "rgba(255,255,255,.1)"}`,
              borderRadius: 999,
              color: active ? "#111" : "rgba(255,255,255,.55)",
              fontFamily: INTER,
              fontSize: 12,
              fontWeight: active ? 500 : 400,
              padding: "8px 16px",
              cursor: "pointer",
              transition: "all .15s",
            }}
            onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = "rgba(255,255,255,.25)"; e.currentTarget.style.color = "rgba(255,255,255,.85)"; } }}
            onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = "rgba(255,255,255,.1)"; e.currentTarget.style.color = "rgba(255,255,255,.55)"; } }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

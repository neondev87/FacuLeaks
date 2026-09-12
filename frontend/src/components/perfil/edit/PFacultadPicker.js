"use client";

import { useEffect, useRef, useState } from "react";
import { INTER } from "./constants";
import { FACULTADES } from "@/lib/facultades";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: components/perfil/edit/PFacultadPicker.js — selector de facultad
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: reemplaza la vieja grilla de 17 pills siempre visible en
// EditModal.js por una caja cerrada ("Elegir", o la facultad ya elegida)
// que al tocarla despliega las 17 opciones con su escudo — mismo patrón
// que el panel de solicitudes de chat/page.js (cierra con click afuera o
// Escape). Pedido explícito de Erick (2026-09-11): la grilla siempre
// abierta ocupaba demasiado lugar arriba de todo en el modal.
//
// CON QUÉ SE CONECTA: lib/facultades.js (lista + escudos). Lo usa
// EditModal.js, que guarda `facultad` (value del enum) en su propio estado.
// ════════════════════════════════════════════════════════════════════════
export default function PFacultadPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = FACULTADES.find(f => f.value === value);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = e => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onEsc  = e => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onEsc); };
  }, [open]);

  return (
    <div ref={ref} style={{ position:"relative" }}>
      <button type="button" onClick={() => setOpen(v => !v)} style={{
        width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", gap:8,
        background: open ? "rgba(255,255,255,.07)" : "rgba(255,255,255,.05)",
        border:`1px solid ${open ? "rgba(255,255,255,.25)" : "rgba(255,255,255,.08)"}`,
        borderRadius:6, padding:"10px 12px", cursor:"pointer", transition:"all .15s", boxSizing:"border-box",
      }}>
        <span style={{ display:"flex", alignItems:"center", gap:8, minWidth:0 }}>
          {selected ? (
            <>
              <img src={`/facultades/${selected.archivo}`} alt="" width={20} height={20} style={{ objectFit:"contain", borderRadius:"50%", flexShrink:0 }} />
              <span style={{ fontFamily:INTER, fontSize:14, color:"rgba(255,255,255,.85)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{selected.nombre}</span>
            </>
          ) : (
            <span style={{ fontFamily:INTER, fontSize:14, color:"rgba(255,255,255,.35)" }}>Elegir</span>
          )}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink:0, transform: open ? "rotate(180deg)" : "none", transition:"transform .15s" }}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div style={{
          position:"absolute", top:"calc(100% + 6px)", left:0, right:0, zIndex:20,
          background:"#1e1e1e", border:"1px solid rgba(255,255,255,.12)", borderRadius:8,
          maxHeight:240, overflowY:"auto", boxShadow:"0 12px 32px rgba(0,0,0,.5)", padding:4,
        }}>
          {FACULTADES.map(f => {
            const active = f.value === value;
            return (
              <button key={f.value} type="button" onClick={() => { onChange(f.value); setOpen(false); }}
                style={{
                  width:"100%", display:"flex", alignItems:"center", gap:10, textAlign:"left",
                  background: active ? "rgba(255,255,255,.09)" : "transparent", border:"none", borderRadius:6,
                  padding:"8px 10px", cursor:"pointer", transition:"background .12s",
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,.05)"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                <img src={`/facultades/${f.archivo}`} alt="" width={22} height={22} style={{ objectFit:"contain", borderRadius:"50%", flexShrink:0 }} />
                <span style={{ display:"flex", flexDirection:"column", minWidth:0 }}>
                  <span style={{ fontFamily:INTER, fontSize:13, color: active ? "#fff" : "rgba(255,255,255,.8)" }}>{f.siglas}</span>
                  <span style={{ fontFamily:INTER, fontSize:11, color:"rgba(255,255,255,.35)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.nombre}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

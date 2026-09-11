"use client";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: components/perfil/FriendsModal.js — "recopilación" de amigos
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: modal chiquito que lista tus amigos (avatar + nombre), para
// abrirlo al clickear el contador "amigos" de la tarjeta Información en TU
// perfil (app/perfil/page.js). Clickear un amigo te lleva a su perfil
// público. Pide GET /api/amigos (el mismo endpoint que usa app/amigos/page.js)
// y se queda solo con la lista `amigos` (ignora solicitudes recibidas/
// enviadas, que no aplican acá).
//
// PARA QUÉ SIRVE: antes el número de "amigos" en Información era de solo
// lectura — para VER quiénes son había que ir a /amigos (que además mezcla
// solicitudes y buscador). Esto es una vista rápida, de un click, sin salir
// del perfil.
//
// CON QUÉ SE CONECTA: backend GET /api/amigos (amigos.controller.js). Lo abre
// app/perfil/page.js.
// ════════════════════════════════════════════════════════════════════════
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API, avatarSrc } from "@/lib/api";
import { HOLO_THEME } from "@/lib/theme";

export default function FriendsModal({ onClose }) {
  const router = useRouter();
  const [amigos,  setAmigos]  = useState(null);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res  = await fetch(`${API}/api/amigos`, { credentials: "include" });
        const data = await res.json();
        if (!cancelled) setAmigos(data.amigos || []);
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const goTo = (userId) => {
    onClose();
    router.push(`/perfil/${userId}`);
  };

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.65)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:24, animation:"fadeIn .15s ease" }}>
      <div onClick={e => e.stopPropagation()} style={{ background:HOLO_THEME.panel, border:`1px solid ${HOLO_THEME.hairline}`, borderRadius:12, width:"100%", maxWidth:360, maxHeight:"72vh", display:"flex", flexDirection:"column", boxShadow:"0 24px 64px rgba(0,0,0,.7)", animation:"slideUp .2s ease", overflow:"hidden" }}>

        {/* Header */}
        <div style={{ padding:"18px 20px", borderBottom:`1px solid ${HOLO_THEME.hairlineSoft}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
          <div style={{ fontFamily:"'Cinzel',serif", fontSize:14, letterSpacing:".08em", color:HOLO_THEME.text }}>
            Amigos{amigos ? ` (${amigos.length})` : ""}
          </div>
          <button onClick={onClose} style={{ width:26, height:26, background:"rgba(255,255,255,.06)", border:`1px solid ${HOLO_THEME.hairline}`, borderRadius:6, color:HOLO_THEME.textDim, cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", transition:"all .15s" }}
            onMouseEnter={e => { e.currentTarget.style.color = HOLO_THEME.text; }}
            onMouseLeave={e => { e.currentTarget.style.color = HOLO_THEME.textDim; }}>
            ✕
          </button>
        </div>

        {/* Lista */}
        <div style={{ overflowY:"auto", padding:8 }}>
          {amigos === null && !error && (
            <div style={{ padding:"24px 12px", textAlign:"center", fontSize:12, color:HOLO_THEME.textDim, fontFamily:"'Inter',sans-serif" }}>cargando...</div>
          )}
          {error && (
            <div style={{ padding:"24px 12px", textAlign:"center", fontSize:12, color:HOLO_THEME.textDim, fontFamily:"'Inter',sans-serif" }}>no se pudo cargar</div>
          )}
          {amigos?.length === 0 && (
            <div style={{ padding:"24px 12px", textAlign:"center", fontSize:12, color:HOLO_THEME.textDim, fontFamily:"'Inter',sans-serif" }}>todavía no tenés amigos agregados</div>
          )}
          {amigos?.map(({ amistadId, user }) => (
            <div key={amistadId} onClick={() => goTo(user.id)}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 8px", borderRadius:8, cursor:"pointer", transition:"background .15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
              <div style={{ width:36, height:36, borderRadius:8, overflow:"hidden", flexShrink:0, background:"#1c1c24", border:`1px solid ${HOLO_THEME.hairline}` }}>
                {user.imagen && (
                  <img src={avatarSrc(user.imagen)} alt={user.username} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                )}
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:13, color:HOLO_THEME.text, fontFamily:"'Inter',sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {user.nombre || user.username}
                </div>
                <div style={{ fontSize:11, color:HOLO_THEME.textDim, fontFamily:"'Inter',sans-serif" }}>@{user.username}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

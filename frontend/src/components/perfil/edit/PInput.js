"use client";

import { useState } from "react";
import { INTER } from "./constants";

// MÓDULO: components/perfil/edit/PInput.js
// Input de texto con el estilo del modal de editar perfil (cambia de color
// al enfocarse). Componente "tonto" — no valida ni guarda nada, solo se ve bien.
//
// fontSize:16 fijo (no 14): en celular, Safari/iOS hace zoom automático de
// TODA la página al enfocar un input con font-size menor a 16px — el modal
// de Editar perfil se abre igual en celular y no tenía ninguna protección
// contra esto (2026-09-17, mismo bug reportado en el muro/chat/foro/amigos).
// Como este componente es un estilo inline sin @media, más simple dejarlo
// siempre en 16px que duplicar la lógica de breakpoint acá adentro.
export default function PInput({ value, onChange, placeholder, style={} }) {
  const [focus, setFocus] = useState(false);
  const base = { width:"100%", background:focus?"rgba(255,255,255,.07)":"rgba(255,255,255,.05)", border:`1px solid ${focus?"rgba(255,255,255,.25)":"rgba(255,255,255,.08)"}`, borderRadius:6, color:"rgba(255,255,255,.85)", fontFamily:INTER, fontSize:16, padding:"10px 12px", outline:"none", transition:"border-color .15s, background .15s", boxSizing:"border-box" };
  return <input value={value} onChange={onChange} placeholder={placeholder} onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)} style={{...base,...style}}/>;
}

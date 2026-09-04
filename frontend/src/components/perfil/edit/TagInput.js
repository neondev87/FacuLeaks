"use client";

import { useState } from "react";
import { INTER } from "./constants";

// ── Input de tags (intereses). Enter o coma agrega; Backspace en vacío quita ──
export default function TagInput({ tags, setTags }) {
  const [val, setVal] = useState("");
  const [focus, setFocus] = useState(false);
  const add = e => {
    if ((e.key === "Enter" || e.key === ",") && val.trim()) {
      e.preventDefault();
      if (!tags.includes(val.trim()) && tags.length < 10) setTags([...tags, val.trim()]);
      setVal("");
    }
    if (e.key === "Backspace" && !val && tags.length) setTags(tags.slice(0,-1));
  };
  return (
    <div style={{ background:focus?"rgba(255,255,255,.07)":"rgba(255,255,255,.05)", border:`1px solid ${focus?"rgba(255,255,255,.25)":"rgba(255,255,255,.08)"}`, borderRadius:6, padding:"8px 10px", display:"flex", flexWrap:"wrap", gap:5, cursor:"text", transition:"all .15s", minHeight:44 }}
      onClick={e=>e.currentTarget.querySelector("input").focus()}>
      {tags.map(t => (
        <div key={t} style={{ display:"flex", alignItems:"center", gap:5, background:"rgba(255,255,255,.1)", borderRadius:4, padding:"2px 8px" }}>
          <span style={{ fontSize:12, color:"rgba(255,255,255,.75)", fontFamily:INTER }}>{t}</span>
          <span onClick={e=>{e.stopPropagation();setTags(tags.filter(x=>x!==t));}} style={{ fontSize:10, color:"rgba(255,255,255,.35)", cursor:"pointer", lineHeight:1, transition:"color .12s" }}
            onMouseEnter={e=>e.currentTarget.style.color="rgba(255,255,255,.8)"}
            onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,.35)"}>✕</span>
        </div>
      ))}
      <input value={val} onChange={e=>setVal(e.target.value)} onKeyDown={add}
        onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}
        placeholder={tags.length===0?"añade intereses...":""}
        style={{ background:"transparent", border:"none", outline:"none", fontSize:12, color:"rgba(255,255,255,.65)", fontFamily:INTER, minWidth:100, flex:1 }}/>
    </div>
  );
}

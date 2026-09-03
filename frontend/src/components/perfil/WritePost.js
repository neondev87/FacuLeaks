"use client";

import { useState } from "react";
import { API } from "@/lib/api";

// ── Caja para escribir en el muro de un amigo (perfil público) ──
export default function WritePost({ profileUserId, onPostCreated }) {
  const [contenido, setContenido] = useState("");
  const [posting, setPosting] = useState(false);

  const handlePost = async () => {
    if (!contenido.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`${API}/api/posts`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contenido: contenido.trim(),
          privacidad: "PUBLICA",
          // Opcional: podrías agregar un campo "muroId" para indicar en qué muro se escribe
        })
      });
      const data = await res.json();
      if (data.ok) {
        setContenido("");
        if (onPostCreated) onPostCreated();
      }
    } catch (error) {
      console.error("Error creando post:", error);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div style={{ border:"1px solid rgba(255,255,255,.07)", padding:16, background:"#050505", marginBottom:10 }}>
      <div style={{ fontFamily:"'Cinzel',serif", fontSize:12, letterSpacing:".18em", marginBottom:12, color:"rgba(255,255,255,.7)" }}>
        † Escribe algo
      </div>
      <textarea
        value={contenido}
        onChange={e => setContenido(e.target.value)}
        placeholder="¿Qué quieres compartir?"
        disabled={posting}
        style={{
          width:"100%",
          background:"rgba(255,255,255,.05)",
          border:"1px solid rgba(255,255,255,.08)",
          borderRadius:6,
          color:"rgba(255,255,255,.85)",
          fontFamily:"'Inter',sans-serif",
          fontSize:14,
          padding:"10px 12px",
          outline:"none",
          resize:"vertical",
          lineHeight:1.6,
          boxSizing:"border-box",
          minHeight:80
        }}
      />
      <button
        onClick={handlePost}
        disabled={posting || !contenido.trim()}
        style={{
          marginTop:8,
          background: posting ? "rgba(255,255,255,.1)" : "rgba(255,255,255,.92)",
          border:"1px solid rgba(255,255,255,.4)",
          borderRadius:7,
          color:"#111",
          fontFamily:"'Inter',sans-serif",
          fontSize:13,
          fontWeight:500,
          padding:"9px 22px",
          cursor: posting || !contenido.trim() ? "not-allowed" : "pointer",
          transition:"all .2s"
        }}
      >
        {posting ? "Publicando..." : "Publicar"}
      </button>
    </div>
  );
}

"use client";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: hooks/usePostComposer.js — la cajita de "¿qué estás pensando?"
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: maneja el formulario para crear un post nuevo — título, cuerpo,
// imagen adjunta, y una vista previa automática cuando pegás un link
// (espera 800ms sin que sigas escribiendo — "debounce" — antes de pedirle
// al backend el título/imagen de esa URL, para no spamear la petición en
// cada letra que tipeás). Al publicar, resetea todo el formulario.
//
// PARA QUÉ SIRVE: es el hook del composer de app/feed/page.js.
//
// CON QUÉ SE CONECTA:
//   - backend: POST /api/posts (publicar), POST /api/upload/url (vista
//     previa de link).
//   - components/Uploader.js → le entrega la URL de la imagen ya subida.
//   - Lo consume: app/feed/page.js.
// ════════════════════════════════════════════════════════════════════════
import { useState, useRef } from "react";
import { API } from "@/lib/api";
export default function usePostComposer() {
  const [postContent, setPostContent] = useState("");
  const [postTitle,   setPostTitle]   = useState("");
  const [postImagen,  setPostImagen]  = useState(null);
  const [linkPreview, setLinkPreview] = useState(null);
  const [publishing,  setPublishing]  = useState(false);
  const [uploaderKey, setUploaderKey] = useState(0);
  const linkTimer = useRef(null);

  const handleContentChange = (e) => {
    const val = e.target.value;
    setPostContent(val);
    clearTimeout(linkTimer.current);
    const urlMatch = val.match(/(https?:\/\/[^\s]{10,})/);
    if (urlMatch && !linkPreview) {
      linkTimer.current = setTimeout(async () => {
        try {
          const res  = await fetch(`${API}/api/upload/url`, {
            method:"POST", headers:{"Content-Type":"application/json"},
            credentials:"include", body: JSON.stringify({ url: urlMatch[1] }),
          });
          const data = await res.json();
          if (res.ok) setLinkPreview(data);
        } catch {}
      }, 800);
    }
    if (!urlMatch) setLinkPreview(null);
  };

  const handlePublish = async () => {
    if (!postContent.trim() && !postImagen) return;
    setPublishing(true);
    try {
      const res = await fetch(`${API}/api/posts`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        credentials:"include",
        body: JSON.stringify({ titulo:postTitle, contenido:postContent||"", privacidad:"PUBLICA", imagen:postImagen }),
      });
      if (res.ok) { setPostContent(""); setPostTitle(""); setPostImagen(null); setLinkPreview(null); setUploaderKey(k => k+1); }
    } catch {}
    setPublishing(false);
  };

  const clearImagen = () => { setPostImagen(null); setUploaderKey(k => k + 1); };

  return {
    postContent, setPostContent,
    postTitle,   setPostTitle,
    postImagen,  setPostImagen, clearImagen,
    linkPreview, setLinkPreview,
    publishing,
    uploaderKey,
    handleContentChange,
    handlePublish,
  };
}

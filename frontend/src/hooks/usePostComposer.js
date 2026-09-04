"use client";

import { useState, useRef } from "react";
import { API } from "@/lib/api";

// Estado y lógica del cuadro de "publicar" del feed: título, cuerpo, imagen
// adjunta, vista previa de enlace (con debounce) y el POST de publicación.
// Sin cambios de comportamiento respecto al inline de feed/page.js.
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

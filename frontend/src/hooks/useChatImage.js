"use client";

import { useState } from "react";
import { API } from "@/lib/api";

// B4 · Envío de imágenes por chat. Sube a POST /api/chat/imagen/:id (multer +
// magic bytes + Sharp→webp en el backend) y notifica el mensaje creado por
// onImageSent, igual que useAudioRecorder con el audio.
export default function useChatImage({ activeChat, onImageSent }) {
  const [sending, setSending] = useState(false);
  const [error,   setError]   = useState("");

  const sendImage = async (file) => {
    if (!file || !activeChat || sending) return;
    if (!file.type?.startsWith("image/")) { setError("Solo imágenes"); return; }
    if (file.size > 10 * 1024 * 1024)     { setError("Máximo 10MB");   return; }

    setSending(true);
    setError("");
    const fd = new FormData();
    fd.append("imagen", file);
    try {
      const res  = await fetch(`${API}/api/chat/imagen/${activeChat.userId}`, {
        method: "POST", credentials: "include", body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Error");
      onImageSent(data.msg);
    } catch (err) {
      setError(err.message || "Error al enviar imagen");
    } finally {
      setSending(false);
    }
  };

  return { sending, error, sendImage };
}

"use client";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: hooks/useChatImage.js — mandar una imagen por chat
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: recibe el archivo elegido por el usuario, lo valida en el
// cliente (que sea imagen, que pese menos de 10MB — un primer filtro rápido,
// la validación de verdad la hace el backend con magic bytes), lo manda por
// HTTP normal (no por socket, porque es un archivo) y, cuando el backend
// contesta con el mensaje ya creado, lo agrega a la conversación.
//
// PARA QUÉ SIRVE: es el mismo patrón que useAudioRecorder pero para
// imágenes — se separó en su propio hook chico en vez de meterlo dentro de
// useChat.js para mantener cada cosa en su lugar.
//
// CON QUÉ SE CONECTA:
//   - backend: POST /api/chat/imagen/:receptorId (chat.controller.js —
//     ahí sí se valida en serio con magic bytes + se comprime con Sharp).
//   - Lo consume: app/chat/page.js, pasándole `onImageSent: chat.addMensaje`
//     (la función de useChat.js) para que la imagen aparezca al toque.
// ════════════════════════════════════════════════════════════════════════
import { useState } from "react";
import { API } from "@/lib/api";
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

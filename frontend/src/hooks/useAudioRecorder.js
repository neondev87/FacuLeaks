"use client";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: hooks/useAudioRecorder.js — grabar y mandar un audio de chat
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: usa la API del navegador `MediaRecorder` para grabar el
// micrófono. Mientras graba, avisa por socket a la otra persona
// (audio:start/stop) para que vea el indicador de "grabando audio...". Al
// terminar y confirmar el envío, manda el archivo por HTTP y notifica el
// mensaje ya creado. Tiene un límite de 60 segundos por las dudas.
//
// PARA QUÉ SIRVE: separa toda la parte "hablarle al hardware del
// micrófono" de la lógica general del chat (useChat.js).
//
// CON QUÉ SE CONECTA:
//   - navigator.mediaDevices (API del navegador, no del proyecto).
//   - backend: POST /api/chat/audio/:receptorId (chat.controller.js).
//   - Socket.io: audio:start/stop.
//   - Lo consume: app/chat/page.js, pasándole el socket de useChat.js.
// ════════════════════════════════════════════════════════════════════════
import { useState, useRef, useEffect } from "react";
import { API } from "@/lib/api";

// Safari/iOS no sabe grabar ni reproducir WebM: su MediaRecorder solo soporta
// MP4/AAC. Si asumimos "audio/webm" a ciegas (como antes), en iPhone el
// archivo queda con bytes MP4 pero extensión/Content-Type "webm" — el
// `<audio>` lo rechaza con NotSupportedError al querer reproducirlo. Por eso
// preguntamos primero qué formato soporta este navegador para grabar.
const pickMimeType = () => {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) return "";
  const candidatos = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return candidatos.find(t => MediaRecorder.isTypeSupported(t)) || "";
};
const extFromMimeType = (type) => {
  if (type.includes("mp4")) return "m4a";
  if (type.includes("ogg")) return "ogg";
  return "webm";
};

export default function useAudioRecorder({ activeChat, socketRef, onAudioSent }) {
  const [recording, setRecording] = useState(false);
  const audioTimer       = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef   = useRef([]);
  const mimeTypeRef      = useRef("");

  // Si el componente se desmonta (se navega a otra página) mientras se está
  // grabando, nadie más va a llamar stopRecording() — sin esto el stream del
  // micrófono queda vivo y Chrome deja la bolita roja de "grabando" prendida
  // en la pestaña indefinidamente.
  useEffect(() => {
    return () => {
      clearTimeout(audioTimer.current);
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") recorder.stop();
      recorder?.stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const handleMicClick = async () => {
    if (!activeChat || !socketRef.current) return;
    if (!recording) {
      try {
        const stream    = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mimeType  = pickMimeType();
        const recorder  = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        // El navegador puede terminar usando otro mimeType que el pedido —
        // nos quedamos con el que realmente reporta el recorder.
        mimeTypeRef.current = recorder.mimeType || mimeType || "audio/webm";
        audioChunksRef.current = [];
        recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
        recorder.start();
        mediaRecorderRef.current = recorder;
        setRecording(true);
        socketRef.current.emit("audio:start", { receptorId: activeChat.userId });
        audioTimer.current = setTimeout(() => stopRecording(false), 60000);
      } catch (err) {
        console.error("Permiso de micrófono denegado:", err.message);
      }
    } else {
      stopRecording(false);
    }
  };

  const stopRecording = (send = false) => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") { setRecording(false); return; }
    recorder.onstop = async () => {
      recorder.stream?.getTracks().forEach(t => t.stop());
      if (send && audioChunksRef.current.length > 0) {
        const type = mimeTypeRef.current || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type });
        const fd   = new FormData();
        fd.append("audio", blob, `audio.${extFromMimeType(type)}`);
        try {
          const res  = await fetch(`${API}/api/chat/audio/${activeChat.userId}`, { method:"POST", credentials:"include", body:fd });
          const text = await res.text();
          const data = JSON.parse(text);
          if (data.ok) onAudioSent(data.msg);
        } catch (err) { console.error("Error enviando audio:", err.message); }
      }
      audioChunksRef.current = [];
      mediaRecorderRef.current = null;
    };
    recorder.stop();
    setRecording(false);
    clearTimeout(audioTimer.current);
    if (socketRef.current && activeChat) socketRef.current.emit("audio:stop", { receptorId: activeChat.userId });
  };

  return { recording, handleMicClick, stopRecording };
}

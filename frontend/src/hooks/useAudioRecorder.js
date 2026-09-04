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
import { useState, useRef } from "react";
import { API } from "@/lib/api";
export default function useAudioRecorder({ activeChat, socketRef, onAudioSent }) {
  const [recording, setRecording] = useState(false);
  const audioTimer       = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef   = useRef([]);

  const handleMicClick = async () => {
    if (!activeChat || !socketRef.current) return;
    if (!recording) {
      try {
        const stream   = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
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
        const blob = new Blob(audioChunksRef.current, { type:"audio/webm" });
        const fd   = new FormData();
        fd.append("audio", blob, "audio.webm");
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

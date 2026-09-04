"use client";

import { useState, useRef } from "react";
import { API } from "@/lib/api";

// Grabación de mensajes de voz con MediaRecorder. Emite audio:start/stop por
// socket y, al enviar, hace POST a /api/chat/audio/:id y notifica el mensaje
// creado vía onAudioSent. Sin cambios de comportamiento.
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

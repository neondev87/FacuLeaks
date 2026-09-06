"use client";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: components/Uploader.js — botón genérico de "subir archivo"
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: botón que abre el selector de archivos del sistema operativo,
// sube lo elegido al backend, y muestra el resultado (preview si es imagen,
// nombre si es documento, o el error). Sirve para dos tipos: `imagen` y
// `documento` — el prop `tipo` decide cuál endpoint usar y qué validar.
//
// PARA QUÉ SIRVE: es el componente reusable de "subir algo" — el composer
// del feed lo usa para adjuntar imágenes a un post.
//
// CON QUÉ SE CONECTA:
//   - backend: POST /api/upload/imagen o POST /api/upload/documento
//     (upload.controller.js — ahí se valida en serio con magic bytes).
//   - `onSuccess` → le devuelve al que lo usa la URL final del archivo ya
//     subido y comprimido.
//   - Lo consume: app/feed/page.js (el composer, vía usePostComposer.js).
// ════════════════════════════════════════════════════════════════════════
import { useState, useRef, useEffect } from "react";
import { API } from "@/lib/api";

// Íconos de línea (limpios) según el tipo de subida.
const ImgIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
    <circle cx="8.5" cy="10" r="1.6" />
    <path d="M4 17l4.5-4.5a2 2 0 0 1 2.8 0L16 17M14 15l2-2a2 2 0 0 1 2.8 0L21 15.5" />
  </svg>
);
const DocIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" />
  </svg>
);

const TIPOS = {
  imagen:    { accept: "image/jpeg,image/png,image/webp,image/gif", label: "imagen", Icon: ImgIcon },
  documento: { accept: "application/pdf,.doc,.docx",                label: "doc",    Icon: DocIcon },
};

export default function Uploader({
  tipo = "imagen",
  onSuccess,
  onError,
  maxSizeMB = 10,
  label,
  style = {},
  compact = false,
  resetKey = 0,   // ← cuando cambia, resetea el componente
}) {
  const [estado,  setEstado]  = useState("idle");
  const [preview, setPreview] = useState(null);
  const [msg,     setMsg]     = useState("");
  const inputRef = useRef(null);

  // Reset cuando cambia resetKey
  useEffect(() => {
    setEstado("idle");
    setPreview(null);
    setMsg("");
    if (inputRef.current) inputRef.current.value = "";
  }, [resetKey]);

  const reset = () => {
    setEstado("idle");
    setPreview(null);
    setMsg("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const subirArchivo = async (file) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      setMsg(`Máximo ${maxSizeMB}MB`); setEstado("error");
      onError?.(`Máximo ${maxSizeMB}MB`); return;
    }
    setEstado("loading");
    const form = new FormData();
    form.append("file", file);
    try {
      const res  = await fetch(`${API}/api/upload/${tipo}`, {
        method: "POST", body: form, credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setEstado("ok");
      if (tipo === "imagen") setPreview(data.url);
      setMsg(data.nombre || data.url);
      onSuccess?.(data);
    } catch (err) {
      setEstado("error"); setMsg(err.message);
      onError?.(err.message);
    }
  };

  const cfg = TIPOS[tipo] || TIPOS.imagen;

  return (
    <div style={{ fontFamily:"'Space Mono',monospace", fontSize:11, ...style }}>
      <input
        ref={inputRef} type="file" accept={cfg.accept}
        style={{ display:"none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) subirArchivo(f); }}
      />

      {estado === "ok" && tipo === "imagen" && preview ? (
        <div style={{ position:"relative", display:"inline-block" }}>
          <img
            src={`${API}${preview}`}
            alt="preview"
            style={{ width: compact ? 48 : 120, height: compact ? 48 : 120, objectFit:"cover", borderRadius: compact ? "50%" : 3, border:"1px solid rgba(255,255,255,.12)" }}
          />
          <button
            onClick={reset}
            style={{ position:"absolute", top:-6, right:-6, width:18, height:18, borderRadius:"50%", background:"#111", border:"1px solid rgba(255,255,255,.2)", color:"rgba(255,255,255,.6)", fontSize:10, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}
          >✕</button>
        </div>
      ) : (
        <button
          onClick={() => { reset(); inputRef.current?.click(); }}
          disabled={estado === "loading"}
          style={{
            background: estado === "loading" ? "rgba(255,255,255,.04)" : "transparent",
            border: `1px solid ${estado === "error" ? "#cc3344" : "rgba(255,255,255,.14)"}`,
            color: "rgba(242,240,248,.5)", cursor:"pointer", transition:"all .18s",
            padding: compact ? "7px 14px" : "13px 22px",
            borderRadius: compact ? 20 : 8,
            display:"inline-flex", alignItems:"center", gap:7,
            fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:".12em", textTransform:"uppercase",
          }}
          onMouseEnter={e => { if (estado !== "loading") { e.currentTarget.style.borderColor = "rgba(255,255,255,.34)"; e.currentTarget.style.color = "rgba(242,240,248,.85)"; } }}
          onMouseLeave={e => { if (estado !== "loading") { e.currentTarget.style.borderColor = estado === "error" ? "#cc3344" : "rgba(255,255,255,.14)"; e.currentTarget.style.color = "rgba(242,240,248,.5)"; } }}
        >
          {estado === "loading"
            ? <><span className="spinner-sm" /> procesando…</>
            : <><cfg.Icon /> {label || cfg.label}</>
          }
        </button>
      )}

      {estado === "ok" && tipo === "documento" && (
        <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:4 }}>
          <span style={{ fontSize:10, color:"rgba(255,255,255,.45)" }}>✓ {msg}</span>
          <button onClick={reset} style={{ background:"none", border:"none", color:"rgba(255,255,255,.3)", cursor:"pointer", fontSize:10 }}>✕</button>
        </div>
      )}
      {estado === "error" && (
        <div style={{ marginTop:4, fontSize:10, color:"#cc3344" }}>✕ {msg}</div>
      )}

      <style>{`
        .spinner-sm { display:inline-block; width:8px; height:8px; border:1px solid rgba(255,255,255,.15); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
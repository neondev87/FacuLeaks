"use client";

import { useState, useRef, useEffect } from "react";

const TIPOS = {
  imagen:    { accept: "image/jpeg,image/png,image/webp,image/gif", label: "imagen", icono: "◈" },
  documento: { accept: "application/pdf,.doc,.docx",                label: "doc",    icono: "†" },
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
      const res  = await fetch(`http://localhost:4000/api/upload/${tipo}`, {
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
    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, ...style }}>
      <input
        ref={inputRef} type="file" accept={cfg.accept}
        style={{ display:"none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) subirArchivo(f); }}
      />

      {estado === "ok" && tipo === "imagen" && preview ? (
        <div style={{ position:"relative", display:"inline-block" }}>
          <img
            src={`http://localhost:4000${preview}`}
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
            background: estado === "loading" ? "rgba(255,255,255,.03)" : "transparent",
            border: `1px dashed ${estado === "error" ? "#cc3344" : "rgba(255,255,255,.15)"}`,
            color: "rgba(255,255,255,.4)", cursor:"pointer", transition:"all .2s",
            padding: compact ? "6px 12px" : "14px 24px",
            display:"flex", alignItems:"center", gap:8,
            fontFamily:"'IBM Plex Mono',monospace", fontSize:10, letterSpacing:".1em",
          }}
          onMouseEnter={e => { if (estado !== "loading") e.currentTarget.style.borderColor = "rgba(255,255,255,.4)"; }}
          onMouseLeave={e => { if (estado !== "loading") e.currentTarget.style.borderColor = estado === "error" ? "#cc3344" : "rgba(255,255,255,.15)"; }}
        >
          {estado === "loading"
            ? <><span className="spinner-sm" /> procesando...</>
            : <>{cfg.icono} {label || `subir ${cfg.label}`}</>
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
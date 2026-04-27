"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import SpotifyWidget from "@/components/SpotifyWidget";

const API = "http://localhost:4000";

function TerminalCounter({ label, value, text }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === null || value === undefined) return;
    let start = 0;
    const step = Math.max(1, Math.ceil(value / 40));
    const t = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(t); }
      else setDisplay(start);
    }, 30);
    return () => clearInterval(t);
  }, [value]);
  return (
    <div style={{ fontSize: 12, color: "#555", display: "flex", justifyContent: "space-between", padding: "3px 0", fontFamily: "'Inter',sans-serif" }}>
      <span>{label}</span>
      <span style={{ color: "#e8e4d9", fontWeight: 500 }}>
        {text || display.toLocaleString()}
        {!text && <span style={{ animation: "blink 1s step-end infinite", color: "#333" }}>_</span>}
      </span>
    </div>
  );
}

// ── Pixel Trash ──
const TRASH_LID_C = [[0,0,1,1,1,0,0],[0,1,1,1,1,1,0],[0,0,1,1,1,0,0]];
const TRASH_LID_O = [[0,0,0,1,1,0,0],[0,1,1,1,1,1,0],[0,0,1,1,1,1,0]];
const TRASH_BODY  = [
  [0,1,1,1,1,1,0],
  [0,1,0,1,0,1,0],
  [0,1,0,1,0,1,0],
  [0,1,0,1,0,1,0],
  [0,1,1,1,1,1,0],
];

function PixelTrash({ s = 2, phase = "idle" }) {
  const lid = phase === "open" || phase === "shrink" ? TRASH_LID_O : TRASH_LID_C;
  const col = phase === "idle" ? "rgba(255,255,255,.28)" : phase === "open" ? "rgba(255,80,80,.85)" : "rgba(255,80,80,.5)";
  return (
    <svg width={7*s} height={8*s} viewBox={`0 0 ${7*s} ${8*s}`} style={{ display:"block" }}>
      {lid.map((row, r) => row.map((c, ci) => c ? <rect key={`l${r}${ci}`} x={ci*s} y={r*s} width={s} height={s} fill={col}/> : null))}
      {TRASH_BODY.map((row, r) => row.map((c, ci) => c ? <rect key={`b${r}${ci}`} x={ci*s} y={(r+3)*s} width={s} height={s} fill={col}/> : null))}
    </svg>
  );
}

function TrashBtn({ onDelete, s = 2 }) {
  const [phase, setPhase] = useState("idle");
  const [busy,  setBusy]  = useState(false);
  const ref = useRef();
  const handleClick = async () => {
    if (busy) return;
    setPhase("open");
    ref.current = setTimeout(() => {
      setPhase("shrink");
      setTimeout(async () => { setPhase("gone"); setBusy(true); await onDelete(); }, 300);
    }, 350);
  };
  useEffect(() => () => clearTimeout(ref.current), []);
  return (
    <button onClick={handleClick} disabled={busy} title="Eliminar"
      style={{ background:"none", border:"none", cursor: busy ? "default" : "pointer", padding:"2px 4px", display:"flex", alignItems:"center", opacity: busy ? .3 : 1, outline:"none" }}>
      <div style={{
        transition: phase === "shrink" ? "all .3s cubic-bezier(.4,0,.6,1)" : "none",
        transform: phase === "shrink" ? "scale(.05) perspective(200px) translateZ(-80px)" : phase === "open" ? "scale(1.15)" : "scale(1)",
        opacity: phase === "gone" ? 0 : 1,
        filter: phase === "open" || phase === "shrink" ? "brightness(1.4)" : "none",
      }}>
        <PixelTrash s={s} phase={phase} />
      </div>
    </button>
  );
}

// ── INPUT FIELD ──
function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: "#555", letterSpacing: ".07em", textTransform: "uppercase", marginBottom: 6, fontFamily: "'Inter',sans-serif", display: "flex", gap: 6, alignItems: "baseline" }}>
        {label}
        {hint && <span style={{ fontSize: 9, color: "#383838", textTransform: "none", fontWeight: 400, letterSpacing: 0 }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

// ── MODAL HORIZONTAL ──
function EditModal({ profile, user, onClose, onSave }) {
  const [form, setForm] = useState({
    nombre:     user.nombre || "",
    statusText: profile.statusText || "",
    bio:        profile.bio || "",
    intereses:  Array.isArray(profile.intereses) ? profile.intereses.join("\n") : (profile.intereses ? Object.values(profile.intereses).join("\n") : ""),
    links:      Array.isArray(profile.links) ? profile.links.map(l => `${l.label}|${l.url}`).join("\n") : "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    const interesesArr = form.intereses.split("\n").map(s => s.trim()).filter(Boolean);
    const linksArr = form.links.split("\n").map(s => s.trim()).filter(Boolean).map(line => {
      const [label, ...rest] = line.split("|");
      return { label: label.trim(), url: rest.join("|").trim() };
    }).filter(l => l.label);
    await onSave({ bio: form.bio, statusText: form.statusText, intereses: interesesArr, links: linksArr, nombre: form.nombre });
    setSaving(false);
  };

  const inp = (extra = {}) => ({
    width: "100%", background: "#1c1c1c", border: "1px solid #2e2e2e",
    borderRadius: 5, color: "#e8e4d9", fontSize: 13,
    fontFamily: "'Inter',sans-serif", padding: "8px 11px",
    outline: "none", boxSizing: "border-box",
    transition: "border-color .15s", lineHeight: 1.5,
    ...extra,
  });

  const focusIn  = e => e.target.style.borderColor = "#505050";
  const focusOut = e => e.target.style.borderColor = "#2e2e2e";

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 20px", overflow: "auto",
    }} onClick={onClose}>
      <div style={{
        background: "#161616", border: "1px solid #272727",
        borderRadius: 10, width: "100%", maxWidth: 780,
        fontFamily: "'Inter',sans-serif",
        boxShadow: "0 40px 120px rgba(0,0,0,.95)",
        maxHeight: "calc(100vh - 48px)", overflow: "auto",
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #222", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#e8e4d9" }}>Editar perfil</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "0 4px", transition: "color .15s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#e8e4d9"}
            onMouseLeave={e => e.currentTarget.style.color = "#555"}>×</button>
        </div>

        {/* Contenido en 2 columnas */}
        <div style={{ padding: "20px 24px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>

          {/* Columna izquierda */}
          <div>
            <Field label="Nombre de usuario">
              <input value={form.nombre} onChange={e => set("nombre", e.target.value)} maxLength={100}
                style={inp()} onFocus={focusIn} onBlur={focusOut} />
            </Field>

            <Field label="Estado">
              <input value={form.statusText} onChange={e => set("statusText", e.target.value)} maxLength={80}
                style={inp()} onFocus={focusIn} onBlur={focusOut} />
            </Field>

            <Field label="Bio">
              <textarea value={form.bio} onChange={e => set("bio", e.target.value)} maxLength={300} rows={5}
                style={inp({ resize: "vertical" })} onFocus={focusIn} onBlur={focusOut} />
              <div style={{ textAlign: "right", fontSize: 10, color: "#333", marginTop: 3 }}>{form.bio.length}/300</div>
            </Field>
          </div>

          {/* Columna derecha */}
          <div>
            <Field label="Intereses" hint="— uno por línea">
              <textarea value={form.intereses} onChange={e => set("intereses", e.target.value)} rows={5}
                style={inp({ resize: "vertical" })} onFocus={focusIn} onBlur={focusOut} />
            </Field>

            <Field label="Links" hint="— Nombre|URL · uno por línea">
              <textarea value={form.links} onChange={e => set("links", e.target.value)} rows={4}
                placeholder={"Discord|https://discord.gg/xxx\nTumblr|https://username.tumblr.com"}
                style={inp({ resize: "vertical" })} onFocus={focusIn} onBlur={focusOut} />
            </Field>
          </div>

          {/* Botones — full width */}
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8, paddingTop: 16, borderTop: "1px solid #222" }}>
            <button onClick={onClose} style={{
              background: "none", border: "1px solid #2e2e2e", color: "#666",
              fontFamily: "'Inter',sans-serif", fontSize: 13, padding: "8px 18px",
              cursor: "pointer", borderRadius: 6, transition: "all .15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#555"; e.currentTarget.style.color = "#e8e4d9"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#2e2e2e"; e.currentTarget.style.color = "#666"; }}>
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving} style={{
              background: saving ? "#222" : "#fff",
              border: "1px solid " + (saving ? "#333" : "#fff"),
              color: saving ? "#555" : "#000",
              fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 600,
              padding: "8px 22px", cursor: saving ? "not-allowed" : "pointer",
              borderRadius: 6, transition: "all .15s",
            }}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PÁGINA PRINCIPAL ──
export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router  = useRouter();
  const fileRef = useRef(null);
  const picRefs = useRef([null,null,null,null,null,null]);

  const [perfil,          setPerfil]          = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [showEdit,        setShowEdit]        = useState(false);
  const [avatarHover,     setAvatarHover]     = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saveMsg,         setSaveMsg]         = useState("");
  const [pictures,        setPictures]        = useState([null,null,null,null,null,null]);
  const [localPosts,      setLocalPosts]      = useState(null);

  const border = "1px solid rgba(255,255,255,.07)";
  const card   = { border, padding: 16, background: "#050505" };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth");
  }, [status, router]);

  useEffect(() => {
    const s = document.createElement("style");
    s.id = "profile-styles";
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Space+Mono:wght@400;700&family=Cinzel:wght@400;600;900&display=swap');
      @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0} }
      @keyframes savePop { 0%{opacity:0;transform:translateY(4px)} 20%{opacity:1;transform:translateY(0)} 80%{opacity:1} 100%{opacity:0} }
      body { background:#000; color:#e8e4d9; font-family:'Inter',sans-serif; font-size:13px; overflow-x:hidden; }
      body::before { content:''; position:fixed; inset:0; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E"); opacity:.04; pointer-events:none; z-index:9998; }
      body::after  { content:''; position:fixed; inset:0; background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.12) 2px,rgba(0,0,0,.12) 4px); pointer-events:none; z-index:9999; }
      ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:#000} ::-webkit-scrollbar-thumb{background:#222}
      .profile-wrap { padding:68px 28px 48px; max-width:960px; margin:0 auto; animation:fadeIn .5s ease; }
      .sec-title { font-family:'Cinzel',serif; font-size:12px; letter-spacing:.18em; margin-bottom:12px; color:rgba(255,255,255,.7); }
      .avatar-wrap { width:100%; aspect-ratio:1; background:#0a0a0a; border:${border}; overflow:hidden; position:relative; cursor:pointer; }
      .avatar-ol { position:absolute; inset:0; background:rgba(0,0,0,.55); display:flex; align-items:center; justify-content:center; flex-direction:column; gap:4px; transition:opacity .2s; font-family:'Inter',sans-serif; font-size:11px; color:#e8e4d9; }
      .pic-cell { aspect-ratio:1; background:#080808; border:1px solid rgba(255,255,255,.05); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:border-color .2s; overflow:hidden; }
      .pic-cell:hover { border-color:rgba(255,255,255,.15); }
      .post-row { display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid rgba(255,255,255,.04); font-size:12px; font-family:'Inter',sans-serif; }
      .post-row:last-child { border-bottom:none; }
    `;
    document.head.appendChild(s);
    return () => document.getElementById("profile-styles")?.remove();
  }, []);

  const fetchPerfil = async () => {
    if (!session?.user?.dbId) return;
    try {
      let res = await fetch(`${API}/api/perfil`, { credentials: "include" });
      if (res.status === 401) {
        const googleId = session.user.googleId || session.user.id;
        await fetch(`${API}/api/auth/login`, {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ googleId }),
        });
        res = await fetch(`${API}/api/perfil`, { credentials: "include" });
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPerfil(data);
      setLocalPosts(data.posts || []);
    } catch (err) {
      console.error("Error cargando perfil:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") fetchPerfil();
  }, [status, session]);

  const handleAvatarChange = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res  = await fetch(`${API}/api/perfil/avatar`, { method: "PUT", credentials: "include", body: fd });
      const data = await res.json();
      if (data.ok) {
        setPerfil(p => ({ ...p, user: { ...p.user, imagen: data.url } }));
        toast("Avatar actualizado");
      }
    } catch {}
    finally { setUploadingAvatar(false); e.target.value = ""; }
  };

  const handlePicUpload = async (idx, file) => {
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res  = await fetch(`${API}/api/upload/imagen`, { method: "POST", credentials: "include", body: fd });
      const data = await res.json();
      if (data.url) {
        const arr = [...pictures]; arr[idx] = data.url; setPictures(arr);
      }
    } catch {}
  };

  const handleSave = async fields => {
    try {
      const res  = await fetch(`${API}/api/perfil`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await res.json();
      if (data.ok) { await fetchPerfil(); setShowEdit(false); toast("Perfil guardado"); }
    } catch {}
  };

  const handleDeletePost = async postId => {
    try {
      await fetch(`${API}/api/posts/${postId}`, { method: "DELETE", credentials: "include" });
      setLocalPosts(prev => prev.filter(p => p.id !== postId));
    } catch {}
  };

  const toast = msg => { setSaveMsg(msg); setTimeout(() => setSaveMsg(""), 2500); };

  if (status === "loading" || loading) return null;
  if (!perfil) return null;

  const { user, profile, stats } = perfil;
  const posts = localPosts ?? perfil.posts ?? [];

  const intereses = Array.isArray(profile.intereses) ? profile.intereses
    : profile.intereses ? Object.values(profile.intereses) : [];
  const links = Array.isArray(profile.links) ? profile.links
    : profile.links ? Object.values(profile.links) : [];

  const avatarUrl = user.imagen
    ? (user.imagen.startsWith("http") ? user.imagen : `${API}${user.imagen}`)
    : null;

  return (
    <>
      <Navbar />

      <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleAvatarChange} />
      {[0,1,2,3,4,5].map(i => (
        <input key={i} type="file" accept="image/*" style={{ display:"none" }}
          ref={el => picRefs.current[i] = el}
          onChange={e => { const f = e.target.files?.[0]; if (f) handlePicUpload(i, f); e.target.value = ""; }} />
      ))}

      {showEdit && <EditModal profile={profile} user={user} onClose={() => setShowEdit(false)} onSave={handleSave} />}

      {saveMsg && (
        <div style={{ position:"fixed", bottom:28, left:"50%", transform:"translateX(-50%)", background:"#fff", color:"#000", padding:"8px 20px", fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:500, zIndex:2000, animation:"savePop 2.5s ease forwards", borderRadius:4 }}>
          {saveMsg}
        </div>
      )}

      <div className="profile-wrap">

        {/* Header */}
        <div style={{ borderBottom:"1px solid rgba(255,255,255,.06)", paddingBottom:18, marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
          <div>
            <div style={{ fontFamily:"'Cinzel',serif", fontSize:30, color:"#e8e4d9", letterSpacing:".06em", lineHeight:1.1 }}>
              {user.nombre || user.username}
            </div>
            {profile.statusText && (
              <div style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:"#555", marginTop:5, fontStyle:"italic" }}>
                {profile.statusText}
              </div>
            )}
          </div>
          <button onClick={() => setShowEdit(true)} style={{
            background:"none", border:"1px solid rgba(255,255,255,.08)",
            color:"rgba(255,255,255,.3)", fontFamily:"'Inter',sans-serif",
            fontSize:11, padding:"6px 14px", cursor:"pointer",
            transition:"all .2s", borderRadius:4,
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(255,255,255,.25)"; e.currentTarget.style.color="#e8e4d9"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(255,255,255,.08)"; e.currentTarget.style.color="rgba(255,255,255,.3)"; }}>
            Editar perfil
          </button>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"210px 1fr 230px", gap:12 }}>

          {/* IZQUIERDA */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div className="avatar-wrap"
              onClick={() => !uploadingAvatar && fileRef.current?.click()}
              onMouseEnter={() => setAvatarHover(true)}
              onMouseLeave={() => setAvatarHover(false)}>
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                : <div style={{ fontFamily:"'Space Mono',monospace", fontSize:8, color:"rgba(255,255,255,.07)", lineHeight:1.3, textAlign:"center", whiteSpace:"pre", userSelect:"none" }}>
                    {"  ░▒▒▒▒▒░\n ▒██████▒\n▒████████▒\n▒██▒▒▒██▒\n ▒██████▒\n  ░▒▒▒▒░"}
                  </div>
              }
              <div className="avatar-ol" style={{ opacity: uploadingAvatar ? 1 : avatarHover ? 1 : 0 }}>
                {uploadingAvatar ? <span>subiendo...</span> : <><span style={{ fontSize:20 }}>+</span><span>cambiar foto</span></>}
              </div>
            </div>

            <SpotifyWidget userId={user.id}
              onConnect={() => window.location.href = `${API}/api/spotify/auth`}
              onDisconnect={() => fetchPerfil()} />

            <div style={card}>
              <div className="sec-title">† Stats</div>
              <TerminalCounter label="visitas" value={stats?.visitas || 0} />
              <TerminalCounter label="vlogs"   value={stats?.vlogs   || 0} />
              <TerminalCounter label="amigos"  value={stats?.amigos  || 0} />
              <TerminalCounter label="desde"   value={null} text={
                user.creadoEn ? new Date(user.creadoEn).toLocaleDateString("es-MX", { month:"short", year:"numeric" }) : "—"
              } />
            </div>
          </div>

          {/* CENTRAL */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={card}>
              <div className="sec-title">† About Me</div>
              {profile.bio
                ? <div style={{ fontSize:13, color:"rgba(232,228,217,.65)", lineHeight:1.75, fontFamily:"'Inter',sans-serif" }}>{profile.bio}</div>
                : <div style={{ fontSize:12, color:"#222", cursor:"pointer" }} onClick={() => setShowEdit(true)}>+ agregar bio...</div>
              }
            </div>

            <div style={card}>
              <div className="sec-title">† Interests</div>
              {intereses.length > 0
                ? intereses.map((t, i) => (
                  <div key={i} style={{ display:"flex", gap:10, marginBottom:5, fontSize:13, color:"rgba(232,228,217,.6)", fontFamily:"'Inter',sans-serif" }}>
                    <span style={{ color:"rgba(255,255,255,.18)", flexShrink:0 }}>—</span><span>{t}</span>
                  </div>
                ))
                : <div style={{ fontSize:12, color:"#222", cursor:"pointer" }} onClick={() => setShowEdit(true)}>+ agregar intereses...</div>
              }
            </div>

            <div style={card}>
              <div className="sec-title">† Latest Posts</div>
              {posts.length > 0
                ? posts.map((p, i) => (
                  <div key={p.id || i} className="post-row">
                    <div style={{ display:"flex", gap:8, color:"#e8e4d9", overflow:"hidden", alignItems:"center", flex:1 }}>
                      <span style={{ color:"rgba(255,255,255,.18)", flexShrink:0 }}>—</span>
                      <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {p.titulo || p.contenido?.slice(0, 40) || "sin título"}
                      </span>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0, marginLeft:10 }}>
                      <span style={{ color:"#3a3a3a", fontSize:11 }}>
                        {new Date(p.creadoEn).toLocaleDateString("es-MX", { month:"short", day:"numeric" })}
                      </span>
                      <TrashBtn s={2} onDelete={() => handleDeletePost(p.id)} />
                    </div>
                  </div>
                ))
                : <div style={{ fontSize:12, color:"#222" }}>no hay posts aún</div>
              }
            </div>
          </div>

          {/* DERECHA */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={card}>
              <div className="sec-title">† Pictures</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4 }}>
                {[0,1,2,3,4,5].map(i => (
                  <div key={i} className="pic-cell" onClick={() => picRefs.current[i]?.click()}>
                    {pictures[i]
                      ? <img src={`${API}${pictures[i]}`} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                      : <span style={{ fontSize:16, color:"rgba(255,255,255,.07)" }}>+</span>
                    }
                  </div>
                ))}
              </div>
            </div>

            <div style={card}>
              <div className="sec-title">† Links</div>
              {links.length > 0
                ? links.map((l, i) => {
                  const lbl = typeof l === "string" ? l : l.label;
                  const url = typeof l === "string" ? "#" : (l.url || "#");
                  return (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      style={{ display:"flex", gap:8, padding:"5px 0", fontSize:12, color:"#555", cursor:"pointer", transition:"color .2s", textDecoration:"none", fontFamily:"'Inter',sans-serif" }}
                      onMouseEnter={e => e.currentTarget.style.color = "#e8e4d9"}
                      onMouseLeave={e => e.currentTarget.style.color = "#555"}>
                      <span style={{ color:"rgba(255,255,255,.15)" }}>→</span> {lbl}
                    </a>
                  );
                })
                : <div style={{ fontSize:12, color:"#222", cursor:"pointer" }} onClick={() => setShowEdit(true)}>+ agregar links...</div>
              }
            </div>

            <button onClick={() => setShowEdit(true)} style={{
              background:"#050505", border, padding:"10px", width:"100%",
              color:"#444", fontFamily:"'Inter',sans-serif", fontSize:12,
              cursor:"pointer", transition:"all .2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.18)"; e.currentTarget.style.color = "#e8e4d9"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.07)"; e.currentTarget.style.color = "#444"; }}>
              Editar perfil
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
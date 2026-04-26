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
    <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 12, color: "#555", display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
      <span>{label}:</span>
      <span style={{ color: "#e8e4d9" }}>
        {text || display.toLocaleString()}
        {!text && <span style={{ animation: "blink 1s step-end infinite", color: "#444" }}>_</span>}
      </span>
    </div>
  );
}

function EditModal({ profile, user, onClose, onSave }) {
  const [form, setForm] = useState({
    bio: profile.bio || "",
    statusText: profile.statusText || "",
    intereses: Array.isArray(profile.intereses) ? profile.intereses.join("\n") : (profile.intereses ? Object.values(profile.intereses).join("\n") : ""),
    links: profile.links ? (Array.isArray(profile.links) ? profile.links.map(l => `${l.label}|${l.url}`).join("\n") : JSON.stringify(profile.links)) : "",
    nombre: user.nombre || "",
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

  const labelStyle = { fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: "#555", marginBottom: 4, letterSpacing: ".1em" };
  const inputStyle = {
    width: "100%", background: "#0a0a0a", border: "1px solid rgba(255,255,255,.1)",
    color: "#e8e4d9", padding: "8px 10px", fontSize: 12,
    fontFamily: "'Space Mono',monospace", outline: "none", resize: "vertical",
    boxSizing: "border-box", transition: "border-color .2s",
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "#050505", border: "1px solid rgba(255,255,255,.12)", padding: 28, width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto", position: "relative" }} onClick={e => e.stopPropagation()}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: 16, color: "#e8e4d9", letterSpacing: ".15em" }}>† EDITAR PERFIL</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={labelStyle}>NOMBRE DISPLAY</div>
          <input value={form.nombre} onChange={e => set("nombre", e.target.value)} maxLength={100}
            style={{ ...inputStyle, resize: "none" }}
            onFocus={e => e.target.style.borderColor = "rgba(255,255,255,.35)"}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.1)"} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={labelStyle}>STATUS <span style={{ color: "#333" }}>— max 80 chars</span></div>
          <input value={form.statusText} onChange={e => set("statusText", e.target.value)} maxLength={80}
            placeholder="ej: rotting in digital shadows" style={{ ...inputStyle, resize: "none" }}
            onFocus={e => e.target.style.borderColor = "rgba(255,255,255,.35)"}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.1)"} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={labelStyle}>BIO <span style={{ color: "#333" }}>— max 300 chars</span></div>
          <textarea value={form.bio} onChange={e => set("bio", e.target.value)} maxLength={300} rows={4}
            placeholder="algo sobre ti" style={{ ...inputStyle }}
            onFocus={e => e.target.style.borderColor = "rgba(255,255,255,.35)"}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.1)"} />
          <div style={{ textAlign: "right", fontSize: 10, color: "#333", marginTop: 3 }}>{form.bio.length}/300</div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={labelStyle}>INTERESES <span style={{ color: "#333" }}>— uno por línea</span></div>
          <textarea value={form.intereses} onChange={e => set("intereses", e.target.value)} rows={5}
            placeholder={"dark & heavy music\nold websites\nglitch art"} style={{ ...inputStyle }}
            onFocus={e => e.target.style.borderColor = "rgba(255,255,255,.35)"}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.1)"} />
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={labelStyle}>LINKS <span style={{ color: "#333" }}>— formato: Label|URL (uno por línea)</span></div>
          <textarea value={form.links} onChange={e => set("links", e.target.value)} rows={4}
            placeholder={"Discord|https://discord.gg/xxx\nTumblr|https://username.tumblr.com"} style={{ ...inputStyle }}
            onFocus={e => e.target.style.borderColor = "rgba(255,255,255,.35)"}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.1)"} />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", background: "none", border: "1px solid rgba(255,255,255,.1)", color: "#555", fontFamily: "'Share Tech Mono',monospace", fontSize: 12, cursor: "pointer", letterSpacing: ".1em", transition: "all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.3)"; e.currentTarget.style.color = "#e8e4d9"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.1)"; e.currentTarget.style.color = "#555"; }}>
            CANCELAR
          </button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: "10px 0", background: "#fff", border: "1px solid #fff", color: "#000", fontFamily: "'Share Tech Mono',monospace", fontSize: 12, cursor: saving ? "not-allowed" : "pointer", letterSpacing: ".1em", opacity: saving ? .6 : 1, transition: "opacity .2s" }}>
            {saving ? "GUARDANDO..." : "GUARDAR"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileRef = useRef(null);

  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [avatarHover, setAvatarHover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const ac = "#ffffff";
  const border = `1px solid ${ac}22`;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth");
  }, [status, router]);

  useEffect(() => {
    const s = document.createElement("style");
    s.id = "profile-styles";
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Space+Mono:wght@400;700&family=Cinzel:wght@400;600;900&family=Syne:wght@400;500;700&family=IM+Fell+English:ital@0;1&display=swap');
      @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0} }
      @keyframes savePop { 0%{opacity:0;transform:translateY(4px)} 20%{opacity:1;transform:translateY(0)} 80%{opacity:1} 100%{opacity:0} }
      body { background:#000; color:#e8e4d9; font-family:'Space Mono',monospace; font-size:13px; overflow-x:hidden; }
      body::before { content:''; position:fixed; inset:0; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E"); opacity:.05; pointer-events:none; z-index:9998; }
      body::after { content:''; position:fixed; inset:0; background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.15) 2px,rgba(0,0,0,.15) 4px); pointer-events:none; z-index:9999; }
      ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:#000} ::-webkit-scrollbar-thumb{background:#333}
      .profile-wrap { padding:68px 28px 48px; max-width:960px; margin:0 auto; animation:fadeIn .5s ease; }
      .section-title { font-family:'Cinzel',serif; font-size:14px; letter-spacing:.2em; margin-bottom:12px; }
      .about-item { display:flex; gap:10px; margin-bottom:7px; font-size:13px; color:rgba(232,228,217,.75); line-height:1.5; }
      .post-row { display:flex; justify-content:space-between; padding:7px 0; border-bottom:1px solid rgba(255,255,255,.04); font-size:12px; }
      .post-row:last-child { border-bottom:none; }
      .pic-cell { aspect-ratio:1; background:#0a0a0a; border:1px solid rgba(255,255,255,.06); display:flex; align-items:center; justify-content:center; font-size:9px; color:rgba(255,255,255,.2); cursor:pointer; transition:border-color .2s; }
      .pic-cell:hover { border-color:rgba(255,255,255,.25); }
      .avatar-wrap { width:100%; aspect-ratio:1; background:#0a0a0a; border:1px solid rgba(255,255,255,.13); overflow:hidden; position:relative; cursor:pointer; }
      .avatar-overlay { position:absolute; inset:0; background:rgba(0,0,0,.6); display:flex; align-items:center; justify-content:center; flex-direction:column; gap:4px; transition:opacity .2s; font-family:'Share Tech Mono',monospace; font-size:10px; color:#e8e4d9; letter-spacing:.1em; }
    `;
    document.head.appendChild(s);
    return () => document.getElementById("profile-styles")?.remove();
  }, []);

  // ── Cargar perfil con auto-relogin si hay 401 ──
  const fetchPerfil = async () => {
    if (!session?.user?.dbId) return;
    try {
      let res = await fetch(`${API}/api/perfil`, { credentials: "include" });

      // 401 → re-setear cookie del backend y reintentar
      if (res.status === 401) {
        const googleId = session.user.googleId || session.user.id;
        await fetch(`${API}/api/auth/login`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ googleId }),
        });
        res = await fetch(`${API}/api/perfil`, { credentials: "include" });
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPerfil(data);
    } catch (err) {
      console.error("Error cargando perfil:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") fetchPerfil();
  }, [status, session]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(`${API}/api/perfil/avatar`, { method: "PUT", credentials: "include", body: fd });
      const data = await res.json();
      if (data.ok) {
        setPerfil(p => ({ ...p, user: { ...p.user, imagen: data.url } }));
        showSaveMsg("Avatar actualizado");
      }
    } catch {
      console.error("Error subiendo avatar");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleSave = async (fields) => {
    try {
      const res = await fetch(`${API}/api/perfil`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchPerfil();
        setShowEdit(false);
        showSaveMsg("Perfil guardado");
      }
    } catch {
      console.error("Error guardando perfil");
    }
  };

  const showSaveMsg = (msg) => {
    setSaveMsg(msg);
    setTimeout(() => setSaveMsg(""), 2500);
  };

  if (status === "loading" || loading) return null;
  if (!perfil) return null;

  const { user, profile, stats, posts } = perfil;

  const intereses = Array.isArray(profile.intereses)
    ? profile.intereses
    : profile.intereses ? Object.values(profile.intereses) : [];

  const links = Array.isArray(profile.links)
    ? profile.links
    : profile.links ? Object.values(profile.links) : [];

  const avatarUrl = user.imagen
    ? (user.imagen.startsWith("http") ? user.imagen : `${API}${user.imagen}`)
    : null;

  return (
    <>
      <Navbar />

      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />

      {showEdit && (
        <EditModal profile={profile} user={user} onClose={() => setShowEdit(false)} onSave={handleSave} />
      )}

      {saveMsg && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "#fff", color: "#000", padding: "8px 20px", fontFamily: "'Share Tech Mono',monospace", fontSize: 12, letterSpacing: ".1em", zIndex: 2000, animation: "savePop 2.5s ease forwards" }}>
          {saveMsg}
        </div>
      )}

      <div className="profile-wrap">

        {/* Header */}
        <div style={{ borderBottom: `1px solid ${ac}33`, paddingBottom: 18, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: 34, color: "#e8e4d9", letterSpacing: ".1em" }}>
              {user.nombre || user.username}
            </div>
            {profile.statusText && (
              <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: "#555", marginTop: 4 }}>
                {profile.statusText}
              </div>
            )}
          </div>
          <div style={{ fontSize: 12, color: "rgba(232,228,217,.5)", display: "flex", gap: 14, alignItems: "center" }}>
            <span style={{ color: ac }}>†</span>
            <span style={{ color: "#3ddc84" }}>STATUS: ALIVE</span>
            <span style={{ cursor: "pointer", color: `${ac}66`, transition: "color .2s", fontFamily: "'Share Tech Mono',monospace" }}
              onMouseEnter={e => e.currentTarget.style.color = "#e8e4d9"}
              onMouseLeave={e => e.currentTarget.style.color = `${ac}66`}
              onClick={() => setShowEdit(true)}>
              [editar]
            </span>
            <span style={{ cursor: "pointer", color: `${ac}44`, transition: "color .2s" }}
              onMouseEnter={e => e.currentTarget.style.color = "#e8e4d9"}
              onMouseLeave={e => e.currentTarget.style.color = `${ac}44`}
              onClick={() => router.push("/auth")}>
              logout
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "210px 1fr 230px", gap: 16 }}>

          {/* ── IZQUIERDA ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Avatar */}
            <div className="avatar-wrap"
              onClick={() => !uploadingAvatar && fileRef.current?.click()}
              onMouseEnter={() => setAvatarHover(true)}
              onMouseLeave={() => setAvatarHover(false)}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              ) : (
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: `${ac}18`, lineHeight: 1.3, textAlign: "center", whiteSpace: "pre", userSelect: "none" }}>
                  {"  ░▒▒▒▒▒░\n ▒██████▒\n▒████████▒\n▒██▒▒▒██▒\n ▒██████▒\n  ░▒▒▒▒░"}
                </div>
              )}
              <div className="avatar-overlay" style={{ opacity: uploadingAvatar ? 1 : avatarHover ? 1 : 0 }}>
                {uploadingAvatar ? <span>subiendo...</span> : <><span style={{ fontSize: 18 }}>+</span><span>cambiar foto</span></>}
              </div>
            </div>

            {/* Spotify */}
            <SpotifyWidget userId={user.id} onConnect={() => window.location.href = `${API}/api/spotify/auth`} />

            {/* Stats */}
            <div style={{ border, padding: "10px 12px" }}>
              <div style={{ color: ac, marginBottom: 8, letterSpacing: ".15em", fontSize: 13, fontFamily: "'Cinzel',serif" }}>† STATS</div>
              <TerminalCounter label="visitas" value={stats?.visitas || 0} />
              <TerminalCounter label="vlogs"   value={stats?.vlogs   || 0} />
              <TerminalCounter label="amigos"  value={stats?.amigos  || 0} />
              <TerminalCounter label="desde"   value={null} text={
                user.creadoEn
                  ? new Date(user.creadoEn).toLocaleDateString("es-MX", { month: "short", year: "numeric" })
                  : "—"
              } />
            </div>
          </div>

          {/* ── CENTRAL ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            <div style={{ border, padding: 14 }}>
              <div className="section-title" style={{ color: ac }}>† About Me:</div>
              {profile.bio ? (
                <div style={{ fontSize: 13, color: "rgba(232,228,217,.75)", lineHeight: 1.7, fontFamily: "'IM Fell English',serif" }}>{profile.bio}</div>
              ) : (
                <div style={{ fontSize: 12, color: "#333", cursor: "pointer", fontFamily: "'Share Tech Mono',monospace" }} onClick={() => setShowEdit(true)}>+ agregar bio...</div>
              )}
            </div>

            <div style={{ border, padding: 14 }}>
              <div className="section-title" style={{ color: ac }}>† Interests:</div>
              {intereses.length > 0 ? intereses.map((t, i) => (
                <div key={i} className="about-item">
                  <span style={{ color: ac, flexShrink: 0 }}>+</span><span>{t}</span>
                </div>
              )) : (
                <div style={{ fontSize: 12, color: "#333", cursor: "pointer", fontFamily: "'Share Tech Mono',monospace" }} onClick={() => setShowEdit(true)}>+ agregar intereses...</div>
              )}
            </div>

            <div style={{ border, padding: 14 }}>
              <div className="section-title" style={{ color: ac }}>† Latest Posts:</div>
              {posts && posts.length > 0 ? posts.map((p, i) => (
                <div key={i} className="post-row">
                  <div style={{ display: "flex", gap: 10, color: "#e8e4d9", overflow: "hidden" }}>
                    <span style={{ color: ac, flexShrink: 0 }}>+</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.titulo || p.contenido?.slice(0, 40) || "sin título"}
                    </span>
                  </div>
                  <div style={{ color: "#555", flexShrink: 0, marginLeft: 12, fontSize: 11 }}>
                    {new Date(p.creadoEn).toLocaleDateString("es-MX", { month: "short", day: "numeric" })} · {p.totalVistas}v
                  </div>
                </div>
              )) : (
                <div style={{ fontSize: 12, color: "#333", fontFamily: "'Share Tech Mono',monospace" }}>no hay posts aún</div>
              )}
            </div>
          </div>

          {/* ── DERECHA ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            <div style={{ border, padding: 12 }}>
              <div className="section-title" style={{ color: ac }}>† Pictures:</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                {[0,1,2,3,4,5].map(i => <div key={i} className="pic-cell">img</div>)}
              </div>
            </div>

            <div style={{ border, padding: 12 }}>
              <div className="section-title" style={{ color: ac }}>† Links:</div>
              {links.length > 0 ? links.map((l, i) => {
                const label = typeof l === "string" ? l : l.label;
                const url   = typeof l === "string" ? "#" : (l.url || "#");
                return (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", gap: 8, padding: "4px 0", fontSize: 12, color: "#555", cursor: "pointer", transition: "color .2s", textDecoration: "none" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#e8e4d9"}
                    onMouseLeave={e => e.currentTarget.style.color = "#555"}>
                    <span style={{ color: ac }}>→</span> {label}
                  </a>
                );
              }) : (
                <div style={{ fontSize: 12, color: "#333", cursor: "pointer", fontFamily: "'Share Tech Mono',monospace" }} onClick={() => setShowEdit(true)}>+ agregar links...</div>
              )}
            </div>

            <button onClick={() => setShowEdit(true)} style={{ background: "none", border, padding: "10px", width: "100%", color: "#555", fontFamily: "'Share Tech Mono',monospace", fontSize: 11, cursor: "pointer", letterSpacing: ".12em", transition: "all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.3)"; e.currentTarget.style.color = "#e8e4d9"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${ac}22`; e.currentTarget.style.color = "#555"; }}>
              † EDITAR PERFIL
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { io } from "socket.io-client";
import Navbar from "@/components/Navbar";
import AvatarMenu from "@/components/AvatarMenu";
import PicturesGrid from "@/components/PicturesGrid";
import PostCard from "@/components/PostCard";

const API = "http://localhost:4000";

// ── Lightbox ──
function Lightbox({ src, onClose }) {
  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.95)", zIndex:99999, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
      <img src={src.startsWith("http") ? src : `${API}${src}`} alt="full"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth:"92vw", maxHeight:"92vh", objectFit:"contain", cursor:"default", border:"1px solid rgba(255,255,255,.1)" }} />
      <div style={{ position:"absolute", top:20, right:24, color:"rgba(255,255,255,.4)", fontSize:22, cursor:"pointer" }} onClick={onClose}>✕</div>
    </div>
  );
}

// ── Terminal counter ──
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
    <div style={{ fontSize:12, color:"#555", display:"flex", justifyContent:"space-between", padding:"3px 0", fontFamily:"'Inter',sans-serif" }}>
      <span>{label}</span>
      <span style={{ color:"#e8e4d9", fontWeight:500 }}>
        {text || display.toLocaleString()}
        {!text && <span style={{ animation:"blink 1s step-end infinite", color:"#333" }}>_</span>}
      </span>
    </div>
  );
}

// ── Caja para escribir en muro de amigo ──
function WritePost({ profileUserId, onPostCreated }) {
  const [contenido, setContenido] = useState("");
  const [posting, setPosting] = useState(false);

  const handlePost = async () => {
    if (!contenido.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`${API}/api/posts`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contenido: contenido.trim(),
          privacidad: "PUBLICA",
          // Opcional: podrías agregar un campo "muroId" para indicar en qué muro se escribe
        })
      });
      const data = await res.json();
      if (data.ok) {
        setContenido("");
        if (onPostCreated) onPostCreated();
      }
    } catch (error) {
      console.error("Error creando post:", error);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div style={{ border:"1px solid rgba(255,255,255,.07)", padding:16, background:"#050505", marginBottom:10 }}>
      <div style={{ fontFamily:"'Cinzel',serif", fontSize:12, letterSpacing:".18em", marginBottom:12, color:"rgba(255,255,255,.7)" }}>
        † Escribe algo
      </div>
      <textarea
        value={contenido}
        onChange={e => setContenido(e.target.value)}
        placeholder="¿Qué quieres compartir?"
        disabled={posting}
        style={{
          width:"100%",
          background:"rgba(255,255,255,.05)",
          border:"1px solid rgba(255,255,255,.08)",
          borderRadius:6,
          color:"rgba(255,255,255,.85)",
          fontFamily:"'Inter',sans-serif",
          fontSize:14,
          padding:"10px 12px",
          outline:"none",
          resize:"vertical",
          lineHeight:1.6,
          boxSizing:"border-box",
          minHeight:80
        }}
      />
      <button
        onClick={handlePost}
        disabled={posting || !contenido.trim()}
        style={{
          marginTop:8,
          background: posting ? "rgba(255,255,255,.1)" : "rgba(255,255,255,.92)",
          border:"1px solid rgba(255,255,255,.4)",
          borderRadius:7,
          color:"#111",
          fontFamily:"'Inter',sans-serif",
          fontSize:13,
          fontWeight:500,
          padding:"9px 22px",
          cursor: posting || !contenido.trim() ? "not-allowed" : "pointer",
          transition:"all .2s"
        }}
      >
        {posting ? "Publicando..." : "Publicar"}
      </button>
    </div>
  );
}

export default function PerfilPublicoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const userId = params?.id;

  const [perfil,      setPerfil]      = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [notFound,    setNotFound]    = useState(false);
  const [photos,      setPhotos]      = useState([]); // ← NUEVO: fotos del perfil
  const [sonAmigos,   setSonAmigos]   = useState(false); // ← NUEVO: verificar amistad

  const border = "1px solid rgba(255,255,255,.07)";
  const card   = { border, padding:16, background:"#050505" };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth");
  }, [status, router]);

  useEffect(() => {
    const s = document.createElement("style");
    s.id = "perfil-pub-styles";
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Space+Mono:wght@400;700&family=Cinzel:wght@400;600;900&display=swap');
      @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0} }
      body { background:#000; color:#e8e4d9; font-family:'Inter',sans-serif; font-size:13px; overflow-x:hidden; }
      body::before { content:''; position:fixed; inset:0; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E"); opacity:.04; pointer-events:none; z-index:9998; }
      ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:#000} ::-webkit-scrollbar-thumb{background:#222}
      .pub-wrap { padding:68px 28px 48px; max-width:960px; margin:0 auto; animation:fadeIn .5s ease; }
      .sec-title { font-family:'Cinzel',serif; font-size:12px; letter-spacing:.18em; margin-bottom:12px; color:rgba(255,255,255,.7); }
      .post-row { display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid rgba(255,255,255,.04); font-size:12px; font-family:'Inter',sans-serif; }
      .post-row:last-child { border-bottom:none; }
    `;
    document.head.appendChild(s);
    return () => document.getElementById("perfil-pub-styles")?.remove();
  }, []);

  const fetchPerfil = async () => {
    if (!userId || !session?.user?.dbId) return;
    setLoading(true);
    try {
      console.log('[FETCH_PERFIL] Fetching userId:', userId);
      // ← CAMBIO: Usar proxy de Next.js en lugar de URL directa
      const res  = await fetch(`/api/perfil/${userId}`, { credentials:"include" });
      console.log('[FETCH_PERFIL] Response status:', res.status);
      
      if (res.status === 404) { setNotFound(true); setLoading(false); return; }
      if (!res.ok) throw new Error('Response not OK');
      
      const data = await res.json();
      console.log('[FETCH_PERFIL] Data received:', data);
      
      // ← Si es tu propio perfil, redirigir a /perfil
      if (data.isOwnProfile) {
        console.log('[FETCH_PERFIL] isOwnProfile=true, redirecting to /perfil');
        router.push('/perfil');
        return;
      }
      
      setPerfil(data);
      if (data.photos) setPhotos(data.photos);
      
      // ← HARDCODE TEMPORAL: Activar "son amigos" para testing
      // TODO: Implementar endpoint /api/amistades/verificar/:userId en el backend
      setSonAmigos(true);
      
      /* COMENTADO HASTA CREAR EL ENDPOINT EN EL BACKEND
      // ← verificar si son amigos
      if (data.stats?.amigos > 0 && !data.isOwnProfile) {
        const amigosRes = await fetch(`/api/amistades/verificar/${userId}`, { credentials:"include" });
        const amigosData = await amigosRes.json();
        setSonAmigos(amigosData.sonAmigos || false);
      }
      */
    } catch (err) {
      console.error('[FETCH_PERFIL] Error:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && userId) fetchPerfil();
  }, [status, userId]);

  useEffect(() => {
    if (!session?.user?.dbId) return;
    const socket = io(API);
    socket.emit('user:connect', session.user.dbId);
    socket.on('profile:visit', ({ visitas }) => {
      setPerfil(prev => prev ? { ...prev, stats: { ...prev.stats, visitas } } : prev);
    });
    return () => socket.disconnect();
  }, [session?.user?.dbId]);

  if (status === "loading" || loading) return (
    <>
      <Navbar />
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"calc(100vh - 48px)", marginTop:48, color:"rgba(255,255,255,.2)", fontFamily:"'Inter',sans-serif", fontSize:13 }}>
        cargando perfil...
      </div>
    </>
  );

  if (notFound) return (
    <>
      <Navbar />
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"calc(100vh - 48px)", marginTop:48, flexDirection:"column", gap:12 }}>
        <div style={{ fontFamily:"'Cinzel',serif", fontSize:28, color:"rgba(255,255,255,.15)" }}>404</div>
        <div style={{ fontFamily:"'Inter',sans-serif", fontSize:13, color:"rgba(255,255,255,.3)" }}>perfil no encontrado</div>
        <button onClick={() => router.back()} style={{ marginTop:8, background:"transparent", border:"1px solid rgba(255,255,255,.15)", color:"rgba(255,255,255,.4)", fontFamily:"'Inter',sans-serif", fontSize:12, padding:"7px 18px", cursor:"pointer", transition:"all .2s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(255,255,255,.35)"; e.currentTarget.style.color="#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(255,255,255,.15)"; e.currentTarget.style.color="rgba(255,255,255,.4)"; }}>
          ← volver
        </button>
      </div>
    </>
  );

  if (!perfil) return null;

  const { user, profile, stats, posts, isOwnProfile } = perfil;

  const intereses = Array.isArray(profile.intereses) ? profile.intereses
    : profile.intereses ? Object.values(profile.intereses) : [];
  const links = Array.isArray(profile.links) ? profile.links
    : profile.links ? Object.values(profile.links) : [];

  return (
    <>
      <Navbar />
      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}

      <div className="pub-wrap">

        {/* Header */}
        <div style={{ borderBottom:"1px solid rgba(255,255,255,.06)", paddingBottom:18, marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
          <div>
            <div style={{ display:"flex", alignItems:"baseline", gap:12 }}>
              <div style={{ fontFamily:"'Cinzel',serif", fontSize:30, color:"#e8e4d9", letterSpacing:".06em", lineHeight:1.1 }}>
                {user.nombre || user.username}
              </div>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:12, color:"rgba(255,255,255,.3)", letterSpacing:".04em" }}>
                @{user.username}
              </div>
            </div>
            {profile.statusText && (
              <div style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:"#555", marginTop:5, fontStyle:"italic" }}>
                {profile.statusText}
              </div>
            )}
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            {isOwnProfile && (
              <button onClick={() => router.push("/perfil")}
                style={{ background:"none", border:"1px solid rgba(255,255,255,.08)", color:"rgba(255,255,255,.3)", fontFamily:"'Inter',sans-serif", fontSize:11, padding:"6px 14px", cursor:"pointer", transition:"all .2s", borderRadius:4 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(255,255,255,.25)"; e.currentTarget.style.color="#e8e4d9"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(255,255,255,.08)"; e.currentTarget.style.color="rgba(255,255,255,.3)"; }}>
                ir a mi perfil
              </button>
            )}
            <button onClick={() => router.back()}
              style={{ background:"none", border:"none", color:"rgba(255,255,255,.2)", fontFamily:"'Inter',sans-serif", fontSize:11, cursor:"pointer", transition:"color .2s" }}
              onMouseEnter={e => e.currentTarget.style.color = "#e8e4d9"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.2)"}>
              ← volver
            </button>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"210px 1fr 230px", gap:12 }}>

          {/* IZQUIERDA */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {/* Avatar (solo ver, no editar) */}
            <AvatarMenu
              currentAvatar={user.imagen}
              canEdit={false}
              onViewClick={() => user.imagen && setLightboxSrc(user.imagen)}
            />

            {/* Stats */}
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
            
            {/* ← NUEVO: Caja para escribir (solo si son amigos) */}
            {sonAmigos && !isOwnProfile && (
              <WritePost profileUserId={parseInt(userId)} onPostCreated={fetchPerfil} />
            )}

            <div style={card}>
              <div className="sec-title">† Sobre mí</div>
              {profile.bio
                ? <div style={{ fontSize:13, color:"rgba(232,228,217,.65)", lineHeight:1.75, fontFamily:"'Inter',sans-serif" }}>{profile.bio}</div>
                : <div style={{ fontSize:12, color:"#333", fontFamily:"'Inter',sans-serif" }}>sin bio</div>
              }
            </div>

            {intereses.length > 0 && (
              <div style={card}>
                <div className="sec-title">† Intereses</div>
                {intereses.map((t, i) => (
                  <div key={i} style={{ display:"flex", gap:10, marginBottom:5, fontSize:13, color:"rgba(232,228,217,.6)", fontFamily:"'Inter',sans-serif" }}>
                    <span style={{ color:"rgba(255,255,255,.18)", flexShrink:0 }}>—</span><span>{t}</span>
                  </div>
                ))}
              </div>
            )}

            {posts.length > 0 && (
              <div style={card}>
                <div className="sec-title">† Posts</div>
                {posts.map(p => (
                  <PostCard
                    key={p.id}
                    post={p}
                    currentUser={perfil.user}
                    canDelete={false}
                    onImageClick={(src) => setLightboxSrc(src)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* DERECHA */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            
            {/* ← NUEVO: Pictures (solo ver, no editar) */}
            {photos.length > 0 && (
              <div style={card}>
                <div className="sec-title">† Pictures</div>
                <PicturesGrid
                  userId={parseInt(userId)}
                  initialPhotos={photos}
                  canEdit={false}
                />
              </div>
            )}

            {links.length > 0 && (
              <div style={card}>
                <div className="sec-title">† Links</div>
                {links.map((l, i) => {
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
                })}
              </div>
            )}

            {/* Enviar mensaje */}
            {!isOwnProfile && (
              <button onClick={() => router.push("/chat")}
                style={{ background:"#050505", border, padding:"10px", width:"100%", color:"#444", fontFamily:"'Inter',sans-serif", fontSize:12, cursor:"pointer", transition:"all .2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(255,255,255,.18)"; e.currentTarget.style.color="#e8e4d9"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(255,255,255,.07)"; e.currentTarget.style.color="#444"; }}>
                → enviar mensaje
              </button>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
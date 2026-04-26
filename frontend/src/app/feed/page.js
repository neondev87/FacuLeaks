"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import Navbar from "@/components/Navbar";
import Uploader from "@/components/Uploader";
import DownloadBar from "@/components/DownloadBar";
import BgCross from "@/components/BgCross";

let feedSocket = null;

// ── PIXEL HEART ──
const HRT = [
  [0,0,1,1,0,0,1,1,0,0],
  [0,1,3,3,1,1,3,3,1,0],
  [1,3,4,3,3,3,2,3,3,1],
  [1,3,4,3,3,3,3,3,3,1],
  [1,3,3,3,3,3,3,3,3,1],
  [0,1,3,3,3,3,3,3,1,0],
  [0,0,1,3,3,3,3,1,0,0],
  [0,0,0,1,3,3,1,0,0,0],
  [0,0,0,0,1,1,0,0,0,0],
];
const HC = { 1:"#000", 2:"#7a0000", 3:"#c00000", 4:"#ff5555" };

function PixelHeart({ s=3, white=false }) {
  return (
    <svg width={10*s} height={9*s} viewBox={`0 0 ${10*s} ${9*s}`} style={{ display:"block" }}>
      {HRT.map((row,r) => row.map((cell,c) =>
        cell ? <rect key={`${r}-${c}`} x={c*s} y={r*s} width={s} height={s} fill={white ? "#fff" : HC[cell]}/> : null
      ))}
    </svg>
  );
}

// ── PIXEL SKULL ──
const SKL = [
  [0,0,1,1,1,1,0,0],
  [0,1,1,1,1,1,1,0],
  [1,1,0,1,1,0,1,1],
  [1,1,0,1,1,0,1,1],
  [1,1,1,1,1,1,1,1],
  [0,1,1,1,1,1,1,0],
  [0,1,0,1,1,0,1,0],
  [0,0,0,0,0,0,0,0],
];

function PixelSkull({ s=3, color="rgba(255,255,255,.35)" }) {
  return (
    <svg width={8*s} height={8*s} viewBox={`0 0 ${8*s} ${8*s}`} style={{ display:"block" }}>
      {SKL.map((row,r) => row.map((cell,c) =>
        cell ? <rect key={`${r}-${c}`} x={c*s} y={r*s} width={s} height={s} fill={color}/> : null
      ))}
    </svg>
  );
}

// ── HEART ICON ──
function HeartIcon({ count = 0 }) {
  const [phase,  setPhase]  = useState("idle");
  const [liked,  setLiked]  = useState(false);
  const resetRef = useRef();

  const trigger = () => {
    clearTimeout(resetRef.current);
    if (liked) {
      setLiked(false);
      setPhase("idle");
      return;
    }
    setLiked(true);
    setPhase("white");
    setTimeout(() => setPhase("dead"), 280);
    setTimeout(() => setPhase("gone"), 620);
    resetRef.current = setTimeout(() => setPhase("idle"), 1800);
  };

  useEffect(() => () => clearTimeout(resetRef.current), []);

  return (
    <button onClick={trigger}
      style={{ background:"none", border:"none", cursor:"pointer", padding:"4px 6px", display:"flex", alignItems:"center", gap:6, borderRadius:2, transition:"background .15s", outline:"none" }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.04)"}
      onMouseLeave={e => e.currentTarget.style.background = "none"}
    >
      <div style={{
        display:"inline-block",
        transition: phase === "dead" ? "all .38s cubic-bezier(.4,0,.6,1)" : "none",
        opacity:   phase === "dead" || phase === "gone" ? 0 : 1,
        transform: phase === "dead" ? "scale(.15) rotate(-30deg)" : "scale(1)",
        filter:    phase === "white" ? "saturate(0) brightness(6)" : "none",
      }}>
        <PixelHeart s={3} white={phase === "white"} />
      </div>
      <span style={{ fontSize:10, fontFamily:"'Space Mono',monospace", color: liked ? "#c00000" : "#444", letterSpacing:".1em", transition:"color .3s" }}>
        {count + (liked ? 1 : 0)}
      </span>
    </button>
  );
}

// ── SKULL ICON ──
function SkullIcon({ count = 0 }) {
  const [phase,    setPhase]    = useState("idle");
  const [disliked, setDisliked] = useState(false);
  const resetRef = useRef();

  const trigger = () => {
    clearTimeout(resetRef.current);
    if (disliked) {
      setDisliked(false);
      setPhase("idle");
      return;
    }
    setDisliked(true);
    setPhase("dead");
    setTimeout(() => setPhase("gone"), 420);
    resetRef.current = setTimeout(() => setPhase("idle"), 1800);
  };

  useEffect(() => () => clearTimeout(resetRef.current), []);

  return (
    <button onClick={trigger}
      style={{ background:"none", border:"none", cursor:"pointer", padding:"4px 6px", display:"flex", alignItems:"center", gap:6, borderRadius:2, transition:"background .15s", outline:"none" }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.04)"}
      onMouseLeave={e => e.currentTarget.style.background = "none"}
    >
      <div style={{
        display:"inline-block",
        transition: phase === "dead" ? "all .55s cubic-bezier(.4,0,1,1)" : "none",
        opacity:   phase === "dead" || phase === "gone" ? 0 : 1,
        transform: phase === "dead" ? "scale(.05) perspective(200px) translateZ(-120px)" : "scale(1)",
        filter:    phase === "dead" ? "brightness(0)" : "none",
      }}>
        <PixelSkull s={3} color={disliked ? "rgba(255,255,255,.9)" : "rgba(255,255,255,.35)"} />
      </div>
      <span style={{ fontSize:10, fontFamily:"'Space Mono',monospace", color: disliked ? "rgba(255,255,255,.6)" : "#444", letterSpacing:".1em", transition:"color .3s" }}>
        {count + (disliked ? 1 : 0)}
      </span>
    </button>
  );
}

// ── LIGHTBOX ──
function Lightbox({ src, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.92)", zIndex:99999, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", animation:"fadeIn .15s ease" }}>
      <img src={`http://localhost:4000${src}`} alt="full" onClick={e => e.stopPropagation()}
        style={{ maxWidth:"92vw", maxHeight:"92vh", objectFit:"contain", cursor:"default", border:"1px solid rgba(255,255,255,.1)" }} />
      <div style={{ position:"absolute", top:20, right:24, color:"rgba(255,255,255,.4)", fontSize:22, cursor:"pointer", fontFamily:"'IBM Plex Mono',monospace" }} onClick={onClose}>✕</div>
    </div>
  );
}

// ── LINK PREVIEW ──
function LinkPreview({ data, onRemove }) {
  if (!data) return null;
  return (
    <div style={{ border:"1px solid rgba(255,255,255,.1)", marginBottom:10, background:"rgba(255,255,255,.03)", position:"relative" }}>
      {data.imagen && (
        <img src={data.imagen} alt="preview" style={{ width:"100%", maxHeight:180, objectFit:"cover", display:"block" }}
          onError={e => e.target.style.display = "none"} />
      )}
      <div style={{ padding:"8px 12px" }}>
        <div style={{ fontSize:11, color:"rgba(255,255,255,.6)", fontFamily:"'Space Mono',monospace", marginBottom:3, letterSpacing:".04em" }}>{data.titulo || data.url}</div>
        {data.descripcion && <div style={{ fontSize:10, color:"rgba(255,255,255,.3)", fontFamily:"'Space Mono',monospace", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{data.descripcion}</div>}
        <div style={{ fontSize:9, color:"rgba(255,255,255,.2)", marginTop:3, letterSpacing:".06em" }}>{data.url}</div>
      </div>
      <div onClick={onRemove} style={{ position:"absolute", top:6, right:6, background:"#000", border:"1px solid rgba(255,255,255,.2)", color:"rgba(255,255,255,.5)", width:20, height:20, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:11 }}>✕</div>
    </div>
  );
}

function PostCard({ post, accent = "#ffffff" }) {
  const [lightbox, setLightbox] = useState(false);
  const ac = accent;
  const username = post.autor?.username || post.user || "unknown";
  const tiempo   = post.creadoEn
    ? new Date(post.creadoEn).toLocaleString("es-MX", { hour:"2-digit", minute:"2-digit", month:"short", day:"numeric" })
    : post.time || "";
  const titulo   = post.titulo || post.title || "";
  const cuerpo   = post.contenido || post.body || "";
  const likes    = post._count?.likes ?? post._count?.post_likes ?? post.likes ?? 0;
  const comments = post._count?.comentarios ?? post._count?.comments ?? post.replies ?? 0;
  const vistas   = post.totalVistas ?? post.views ?? 0;
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  return (
    <>
      {lightbox && post.imagen && <Lightbox src={post.imagen} onClose={() => setLightbox(false)} />}
      <div
        style={{ border:"1px solid rgba(255,255,255,.08)", marginBottom:16, transition:"border-color .2s", animation:"fadeIn .3s ease" }}
        onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,.2)"}
        onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,.08)"}
      >
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", borderBottom:"1px solid rgba(255,255,255,.04)" }}>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <div style={{ width:30, height:30, background:"#0a0a0a", border:`1px solid ${ac}33`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:`${ac}55` }}>◈</div>
            <div>
              <div style={{ fontSize:13, color:"#e8e4d9", letterSpacing:".05em" }}>{username}</div>
              <div style={{ fontSize:11, color:"#444" }}>{tiempo}</div>
            </div>
          </div>
          <div style={{ fontSize:11, color:`${ac}55` }}>
            {post.privacidad === "PUBLICA" ? "#público" : post.privacidad === "AMIGOS" ? "#amigos" : "#privado"}
          </div>
        </div>

        {post.imagen && (
          <div onClick={() => setLightbox(true)} style={{ borderBottom:"1px solid rgba(255,255,255,.04)", background:"#050505", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", maxHeight:480, overflow:"hidden" }}>
            <img src={`http://localhost:4000${post.imagen}`} alt="post" style={{ width:"100%", maxHeight:480, objectFit:"contain", display:"block" }} />
          </div>
        )}

        <div style={{ padding:"12px 14px" }}>
          {titulo && <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:16, color:"#e8e4d9", marginBottom:6, lineHeight:1.3 }}>{titulo}</div>}
          <div style={{ fontSize:13, color:"rgba(232,228,217,.55)", lineHeight:1.7, whiteSpace:"pre-wrap" }}>
            {cuerpo.split(urlRegex).map((part, i) =>
              urlRegex.test(part)
                ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color:"rgba(255,255,255,.55)", textDecoration:"underline", textUnderlineOffset:3 }}>{part}</a>
                : part
            )}
          </div>
        </div>

        <div style={{ padding:"8px 14px", borderTop:"1px solid rgba(255,255,255,.04)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", gap:4, alignItems:"center" }}>
            <HeartIcon count={likes} />
            <SkullIcon count={0} />
            <span style={{ cursor:"pointer", letterSpacing:".1em", color:`${ac}66`, fontSize:11, marginLeft:8 }}>† {comments} replies</span>
          </div>
          <span style={{ color:"rgba(255,255,255,.2)", letterSpacing:".1em", fontSize:11 }}>{vistas}v</span>
        </div>
      </div>
    </>
  );
}

function EmptyState({ tab }) {
  const msgs = {
    RECIENTES: { title:"tu feed está vacío",  sub:"sé el primero en publicar algo"      },
    TRENDING:  { title:"nada trending aún",   sub:"sé el primero en publicar algo"       },
    SIGUIENDO: { title:"sin conexiones",       sub:"agrega amigos para ver su contenido" },
  };
  const m = msgs[tab] || msgs.RECIENTES;
  return (
    <div style={{ textAlign:"center", padding:"60px 0", color:"#333" }}>
      <div style={{ fontSize:28, marginBottom:12 }}>◈</div>
      <div style={{ fontSize:14, color:"#555", letterSpacing:".1em", marginBottom:6 }}>{m.title}</div>
      <div style={{ fontSize:11, color:"#333", letterSpacing:".06em" }}>{m.sub}</div>
    </div>
  );
}

export default function FeedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const ac = "#ffffff";

  const [activeTab,    setActiveTab]    = useState("RECIENTES");
  const [posts,        setPosts]        = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [postContent,  setPostContent]  = useState("");
  const [postTitle,    setPostTitle]    = useState("");
  const [postImagen,   setPostImagen]   = useState(null);
  const [linkPreview,  setLinkPreview]  = useState(null);
  const [publishing,   setPublishing]   = useState(false);
  const [newCount,     setNewCount]     = useState(0);
  const [dlTrigger,    setDlTrigger]    = useState(0);
  const [dlFilename,   setDlFilename]   = useState("");
  const [uploaderKey,  setUploaderKey]  = useState(0);

  const activeTabRef  = useRef("RECIENTES");
  const trendingTimer = useRef(null);
  const linkTimer     = useRef(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth");
  }, [status, router]);

  useEffect(() => {
    activeTabRef.current = activeTab;
    setNewCount(0);
  }, [activeTab]);

  const loadPosts = useCallback(async (tab) => {
    setLoading(true);
    setPosts([]);
    try {
      const endpoints = {
        RECIENTES: "http://localhost:4000/api/posts/feed/recientes",
        TRENDING:  "http://localhost:4000/api/posts/feed/trending",
        SIGUIENDO: "http://localhost:4000/api/posts/feed/siguiendo",
      };
      const res  = await fetch(endpoints[tab], { credentials:"include" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPosts(data.posts || []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") loadPosts(activeTab);
  }, [activeTab, status, loadPosts]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.dbId) return;
    feedSocket = io("http://localhost:4000");
    feedSocket.emit("user:connect", session.user.dbId);
    feedSocket.on("post:new", (post) => {
      const tab = activeTabRef.current;
      if (tab === "RECIENTES" && post.privacidad === "PUBLICA") {
        setPosts(prev => [post, ...prev]);
        setNewCount(prev => prev + 1);
      }
      if (tab === "SIGUIENDO") loadPosts("SIGUIENDO");
    });
    trendingTimer.current = setInterval(() => {
      if (activeTabRef.current === "TRENDING") loadPosts("TRENDING");
    }, 60000);
    return () => {
      feedSocket?.disconnect();
      feedSocket = null;
      clearInterval(trendingTimer.current);
    };
  }, [status, session]);

  const handleContentChange = (e) => {
    const val = e.target.value;
    setPostContent(val);
    clearTimeout(linkTimer.current);
    const urlMatch = val.match(/(https?:\/\/[^\s]{10,})/);
    if (urlMatch && !linkPreview) {
      linkTimer.current = setTimeout(async () => {
        try {
          const res  = await fetch("http://localhost:4000/api/upload/url", {
            method:"POST", headers:{"Content-Type":"application/json"},
            credentials:"include", body: JSON.stringify({ url: urlMatch[1] }),
          });
          const data = await res.json();
          if (res.ok) setLinkPreview(data);
        } catch {}
      }, 800);
    }
    if (!urlMatch) setLinkPreview(null);
  };

  const handlePublish = async () => {
    if (!postContent.trim() && !postImagen) return;
    setPublishing(true);
    try {
      const res = await fetch("http://localhost:4000/api/posts", {
        method:"POST", headers:{"Content-Type":"application/json"},
        credentials:"include",
        body: JSON.stringify({ titulo:postTitle, contenido:postContent||"", privacidad:"PUBLICA", imagen:postImagen }),
      });
      if (res.ok) { setPostContent(""); setPostTitle(""); setPostImagen(null); setLinkPreview(null); setUploaderKey(k => k+1); }
    } catch {}
    setPublishing(false);
  };

  useEffect(() => {
    const s = document.createElement("style");
    s.id = "feed-styles";
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Cinzel:wght@400;600;900&family=Syne:wght@400;500;600;700;800&display=swap');
      @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      body { background:#000; color:#e8e4d9; font-family:'Space Mono',monospace; font-size:13px; overflow-x:hidden; }
      body::before { content:''; position:fixed; inset:0; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E"); opacity:.05; pointer-events:none; z-index:9998; }
      body::after { content:''; position:fixed; inset:0; background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.15) 2px,rgba(0,0,0,.15) 4px); pointer-events:none; z-index:9999; }
      ::-webkit-scrollbar { width:4px } ::-webkit-scrollbar-track { background:#000 } ::-webkit-scrollbar-thumb { background:#333 }
      .feed-wrap { padding:68px 28px 48px; max-width:860px; margin:0 auto; animation:fadeIn .5s ease; }
      .post-title-input { width:100%; background:transparent; border:none; outline:none; font-family:'Syne',sans-serif; font-size:14px; color:rgba(232,228,217,.5); padding:4px 0; margin-bottom:6px; letter-spacing:.02em; border-bottom:1px solid rgba(255,255,255,.04); }
      .post-title-input::placeholder { color:rgba(232,228,217,.2); }
      .post-title-input:focus { color:#e8e4d9; border-bottom-color:rgba(255,255,255,.1); }
      .post-body-input { width:100%; background:transparent; border:none; outline:none; font-family:'Space Mono',monospace; font-size:13px; color:rgba(232,228,217,.4); padding:4px 0; margin-bottom:8px; letter-spacing:.02em; resize:none; min-height:36px; border-bottom:1px solid rgba(255,255,255,.08); }
      .post-body-input::placeholder { color:rgba(232,228,217,.2); }
      .post-body-input:focus { color:#e8e4d9; border-bottom-color:rgba(255,255,255,.2); }
      .publish-btn { background:transparent; border:1px solid rgba(255,255,255,.2); color:rgba(255,255,255,.6); font-family:'Space Mono',monospace; font-size:11px; padding:6px 18px; cursor:pointer; letter-spacing:.2em; transition:all .2s; }
      .publish-btn:hover { background:rgba(255,255,255,.06); color:#fff; border-color:rgba(255,255,255,.4); }
      .publish-btn:disabled { opacity:.3; cursor:not-allowed; }
      .spinner { width:14px; height:14px; border:1px solid rgba(255,255,255,.15); border-top-color:rgba(255,255,255,.5); border-radius:50%; animation:spin .7s linear infinite; display:inline-block; }
      .new-badge { background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.15); color:rgba(255,255,255,.7); font-family:'Space Mono',monospace; font-size:10px; padding:5px 16px; letter-spacing:.15em; cursor:pointer; transition:all .2s; display:block; width:100%; text-align:center; margin-bottom:12px; }
      .new-badge:hover { background:rgba(255,255,255,.12); color:#fff; }
      .imagen-preview { position:relative; margin-bottom:10px; }
      .imagen-preview img { width:100%; max-height:200px; object-fit:contain; background:#050505; border:1px solid rgba(255,255,255,.08); }
      .imagen-preview-remove { position:absolute; top:6px; right:6px; background:#000; border:1px solid rgba(255,255,255,.2); color:rgba(255,255,255,.6); width:22px; height:22px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:12px; transition:all .15s; }
      .imagen-preview-remove:hover { background:#111; color:#fff; }
    `;
    document.head.appendChild(s);
    return () => document.getElementById("feed-styles")?.remove();
  }, []);

  if (status === "loading") return null;

  return (
    <>
      <Navbar />
      <BgCross />
      <div className="feed-wrap">

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, borderBottom:`1px solid ${ac}22`, paddingBottom:14 }}>
          <div style={{ fontFamily:"'Cinzel',serif", fontSize:16, color:ac, letterSpacing:".2em" }}>† MURO · {activeTab}</div>
          <div style={{ display:"flex", gap:20, fontSize:12, color:"#444" }}>
            {["RECIENTES", "TRENDING", "SIGUIENDO"].map(t => (
              <span key={t} onClick={() => setActiveTab(t)}
                style={{ cursor:"pointer", letterSpacing:".12em", transition:"color .2s", color: activeTab === t ? "#fff" : "#444" }}
                onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                onMouseLeave={e => e.currentTarget.style.color = activeTab === t ? "#fff" : "#444"}
              >{t}</span>
            ))}
          </div>
        </div>

        <div style={{ border:`1px solid ${ac}22`, padding:16, marginBottom:28, background:`${ac}05` }}>
          <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
            <div style={{ width:34, height:34, background:"#0a0a0a", border:`1px solid ${ac}33`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:`${ac}55`, flexShrink:0 }}>◈</div>
            <div style={{ flex:1 }}>
              <input className="post-title-input" placeholder="título (opcional)" value={postTitle} onChange={e => setPostTitle(e.target.value)} />
              <textarea className="post-body-input" placeholder="¿qué está pasando en tu realidad?" value={postContent} onChange={handleContentChange} rows={2} />
              <LinkPreview data={linkPreview} onRemove={() => setLinkPreview(null)} />
              {postImagen && (
                <div className="imagen-preview">
                  <img src={`http://localhost:4000${postImagen}`} alt="adjunto" />
                  <div className="imagen-preview-remove" onClick={() => { setPostImagen(null); setUploaderKey(k => k+1); }}>✕</div>
                </div>
              )}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                {!postImagen ? (
                  <Uploader resetKey={uploaderKey} tipo="imagen" compact label="+ imagen"
                    onSuccess={({ url }) => { setPostImagen(url); setDlFilename(url.split('/').pop()); setDlTrigger(t => t+1); }}
                    onError={(msg) => console.error(msg)}
                    style={{ fontFamily:"'Space Mono',monospace" }}
                  />
                ) : <div />}
                <button className="publish-btn" onClick={handlePublish} disabled={publishing || (!postContent.trim() && !postImagen)}>
                  {publishing ? <span className="spinner" /> : "PUBLICAR †"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {newCount > 0 && activeTab === "RECIENTES" && (
          <button className="new-badge" onClick={() => { setNewCount(0); window.scrollTo({ top:0, behavior:"smooth" }); }}>
            ↑ {newCount} nuevo{newCount > 1 ? "s" : ""} post{newCount > 1 ? "s" : ""}
          </button>
        )}

        {loading ? (
          <div style={{ textAlign:"center", padding:"48px 0" }}><span className="spinner" /></div>
        ) : posts.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          posts.map((p, i) => <PostCard key={p.id || i} post={p} accent={ac} />)
        )}
      </div>

      <DownloadBar filename={dlFilename} trigger={dlTrigger} />
    </>
  );
}
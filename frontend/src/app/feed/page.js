"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

// ── SPOTIFY WIDGET COMPACTO ──────────────────────────────────
function SpotifyWidgetCompact() {
  const [prog, setProg] = useState(42);
  useEffect(() => {
    const t = setInterval(() => setProg(p => p >= 100 ? 0 : p + 0.1), 300);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#555" }}>
      <span style={{ color: "#1db954" }}>▶</span>
      <div>
        <div style={{ color: "#e8e4d9", fontSize: 11, letterSpacing: ".04em", marginBottom: 2 }}>
          rotting in digital shadows
        </div>
        <div style={{ width: 80, height: 2, background: "rgba(255,255,255,.08)", borderRadius: 1 }}>
          <div style={{ height: "100%", width: `${prog}%`, background: "#1db954", borderRadius: 1, transition: "width .3s linear" }} />
        </div>
      </div>
    </div>
  );
}

// ── POST CARD ────────────────────────────────────────────────
function PostCard({ post, accent = "#ffffff" }) {
  const [liked, setLiked] = useState(false);
  const ac = accent;

  const username = post.autor?.username || post.user || "unknown";
  const tiempo   = post.creadoEn
    ? new Date(post.creadoEn).toLocaleString("es-MX", { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })
    : post.time || "";
  const titulo   = post.titulo || post.title || "";
  const cuerpo   = post.contenido || post.body || "";
  const likes    = post._count?.likes ?? post.likes ?? 0;
  const comments = post._count?.comentarios ?? post.replies ?? 0;
  const vistas   = post.totalVistas ?? post.views ?? 0;

  return (
    <div
      style={{ border: "1px solid rgba(255,255,255,.08)", marginBottom: 16, transition: "border-color .2s" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,.2)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,.08)"}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ width: 30, height: 30, background: "#0a0a0a", border: `1px solid ${ac}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: `${ac}55` }}>◈</div>
          <div>
            <div style={{ fontSize: 13, color: "#e8e4d9", letterSpacing: ".05em" }}>{username}</div>
            <div style={{ fontSize: 11, color: "#444" }}>{tiempo}</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: `${ac}55` }}>{post.privacidad === "PUBLICA" ? "#público" : post.privacidad === "AMIGOS" ? "#amigos" : "#privado"}</div>
      </div>

      {/* Contenido */}
      <div style={{ padding: "12px 14px" }}>
        {titulo && (
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, color: "#e8e4d9", marginBottom: 6, lineHeight: 1.3 }}>
            {titulo}
          </div>
        )}
        <div style={{ fontSize: 13, color: "rgba(232,228,217,.55)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{cuerpo}</div>
      </div>

      {/* Footer */}
      <div style={{ padding: "8px 14px", borderTop: "1px solid rgba(255,255,255,.04)", display: "flex", justifyContent: "space-between", fontSize: 11, color: "#444" }}>
        <div style={{ display: "flex", gap: 16 }}>
          <button
            onClick={() => setLiked(!liked)}
            style={{ background: "none", border: "none", cursor: "pointer", color: liked ? "#cc3344" : "#444", fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: ".1em", transition: "color .2s" }}
          >
            ♥ {likes + (liked ? 1 : 0)}
          </button>
          <span style={{ cursor: "pointer", letterSpacing: ".1em", color: `${ac}66` }}>† {comments} replies</span>
        </div>
        <span style={{ color: "rgba(255,255,255,.2)", letterSpacing: ".1em" }}>{vistas}v</span>
      </div>
    </div>
  );
}

// ── EMPTY STATE ───────────────────────────────────────────────
function EmptyState({ tab }) {
  const msgs = {
    RECIENTES:  { title: "tu feed está vacío", sub: "sigue a alguien para ver sus posts aquí" },
    TRENDING:   { title: "nada trending aún", sub: "sé el primero en publicar algo" },
    SIGUIENDO:  { title: "sin conexiones", sub: "agrega amigos para ver su contenido aquí" },
  };
  const m = msgs[tab] || msgs.RECIENTES;
  return (
    <div style={{ textAlign: "center", padding: "60px 0", color: "#333" }}>
      <div style={{ fontSize: 28, marginBottom: 12 }}>◈</div>
      <div style={{ fontSize: 14, color: "#555", letterSpacing: ".1em", marginBottom: 6 }}>{m.title}</div>
      <div style={{ fontSize: 11, color: "#333", letterSpacing: ".06em" }}>{m.sub}</div>
    </div>
  );
}

// ── FEED PAGE ────────────────────────────────────────────────
export default function FeedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const ac = "#ffffff";

  const [activeTab, setActiveTab]   = useState("RECIENTES");
  const [posts, setPosts]           = useState([]);
  const [loading, setLoading]       = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postTitle, setPostTitle]   = useState("");
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth");
  }, [status, router]);

  // ── Cargar posts según tab ──
  const loadPosts = useCallback(async (tab) => {
    setLoading(true);
    setPosts([]);
    try {
      const endpoints = {
        RECIENTES: "http://localhost:4000/api/posts/feed/recientes",
        TRENDING:  "http://localhost:4000/api/posts/feed/trending",
        SIGUIENDO: "http://localhost:4000/api/posts/feed/siguiendo",
      };
      const res = await fetch(endpoints[tab], { credentials: "include" });
      if (!res.ok) throw new Error("Error al cargar");
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

  // ── Publicar post ──
  const handlePublish = async () => {
    if (!postContent.trim()) return;
    setPublishing(true);
    try {
      const res = await fetch("http://localhost:4000/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ titulo: postTitle, contenido: postContent, privacidad: "PUBLICA" }),
      });
      if (res.ok) {
        setPostContent("");
        setPostTitle("");
        loadPosts(activeTab);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPublishing(false);
    }
  };

  // ── Estilos ──
  useEffect(() => {
    const s = document.createElement("style");
    s.id = "feed-styles";
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Cinzel:wght@400;600;900&family=Syne:wght@400;500;600;700;800&display=swap');

      @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

      body { background:#000; color:#e8e4d9; font-family:'Space Mono',monospace; font-size:13px; overflow-x:hidden; }

      body::before {
        content:''; position:fixed; inset:0;
        background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
        opacity:.05; pointer-events:none; z-index:9998;
      }
      body::after {
        content:''; position:fixed; inset:0;
        background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.15) 2px,rgba(0,0,0,.15) 4px);
        pointer-events:none; z-index:9999;
      }

      ::-webkit-scrollbar { width:4px }
      ::-webkit-scrollbar-track { background:#000 }
      ::-webkit-scrollbar-thumb { background:#333 }

      .nav {
        position:fixed; top:0; left:0; right:0; height:48px;
        border-bottom:1px solid rgba(255,255,255,.08);
        background:rgba(0,0,0,.94);
        display:flex; align-items:center; justify-content:space-between;
        padding:0 28px; z-index:200; backdrop-filter:blur(4px);
      }
      .nav-logo { font-family:'Cinzel',serif; font-size:15px; letter-spacing:.3em; color:#fff; cursor:pointer; opacity:.9; }
      .nav-logo:hover { opacity:1; }
      .nav-link { font-size:12px; letter-spacing:.2em; color:#555; cursor:pointer; transition:color .2s; text-transform:uppercase; background:none; border:none; font-family:'Space Mono',monospace; }
      .nav-link:hover, .nav-link.active { color:#fff; }

      .feed-wrap { padding:68px 28px 48px; max-width:860px; margin:0 auto; animation:fadeIn .5s ease; }

      .post-title-input {
        width:100%; background:transparent; border:none; outline:none;
        font-family:'Syne',sans-serif; font-size:14px; color:rgba(232,228,217,.5);
        padding:4px 0; margin-bottom:6px; letter-spacing:.02em;
        border-bottom:1px solid rgba(255,255,255,.04);
      }
      .post-title-input::placeholder { color:rgba(232,228,217,.2); }
      .post-title-input:focus { color:#e8e4d9; border-bottom-color:rgba(255,255,255,.1); }

      .post-body-input {
        width:100%; background:transparent; border:none; outline:none;
        font-family:'Space Mono',monospace; font-size:13px; color:rgba(232,228,217,.4);
        padding:4px 0; margin-bottom:8px; letter-spacing:.02em; resize:none; min-height:36px;
        border-bottom:1px solid rgba(255,255,255,.08);
      }
      .post-body-input::placeholder { color:rgba(232,228,217,.2); }
      .post-body-input:focus { color:#e8e4d9; border-bottom-color:rgba(255,255,255,.2); }

      .publish-btn {
        background:transparent; border:1px solid rgba(255,255,255,.2);
        color:rgba(255,255,255,.6); font-family:'Space Mono',monospace;
        font-size:11px; padding:6px 18px; cursor:pointer; letter-spacing:.2em; transition:all .2s;
      }
      .publish-btn:hover { background:rgba(255,255,255,.06); color:#fff; border-color:rgba(255,255,255,.4); }
      .publish-btn:disabled { opacity:.3; cursor:not-allowed; }

      .spinner {
        width:14px; height:14px;
        border:1px solid rgba(255,255,255,.15);
        border-top-color:rgba(255,255,255,.5);
        border-radius:50%;
        animation:spin .7s linear infinite;
        display:inline-block;
      }
    `;
    document.head.appendChild(s);
    return () => document.getElementById("feed-styles")?.remove();
  }, []);

  if (status === "loading") return null;

  return (
    <>
      {/* ── NAVBAR ── */}
      <nav className="nav">
        <span className="nav-logo">† FACULEAKS</span>
        <div style={{ display: "flex", gap: 28 }}>
          {[
            { label: "MURO",   href: "/feed"   },
            { label: "PERFIL", href: "/perfil" },
            { label: "FORO",   href: "/foro"   },
          ].map(({ label, href }) => (
            <button key={label} className={`nav-link${href === "/feed" ? " active" : ""}`} onClick={() => router.push(href)}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <SpotifyWidgetCompact />
          <span style={{ fontSize: 11, color: "#3ddc84", letterSpacing: ".12em" }}>● ONLINE</span>
          <button
            onClick={() => signOut({ callbackUrl: "/auth" })}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#555", fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: ".12em", transition: "color .2s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#e8e4d9"}
            onMouseLeave={e => e.currentTarget.style.color = "#555"}
          >
            logout
          </button>
        </div>
      </nav>

      {/* ── FEED ── */}
      <div className="feed-wrap">

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, borderBottom: `1px solid ${ac}22`, paddingBottom: 14 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 16, color: ac, letterSpacing: ".2em" }}>
            † MURO · {activeTab}
          </div>
          <div style={{ display: "flex", gap: 20, fontSize: 12, color: "#444" }}>
            {["RECIENTES", "TRENDING", "SIGUIENDO"].map(t => (
              <span
                key={t}
                onClick={() => setActiveTab(t)}
                style={{ cursor: "pointer", letterSpacing: ".12em", transition: "color .2s", color: activeTab === t ? "#fff" : "#444" }}
                onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                onMouseLeave={e => e.currentTarget.style.color = activeTab === t ? "#fff" : "#444"}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Crear post */}
        <div style={{ border: `1px solid ${ac}22`, padding: 16, marginBottom: 28, background: `${ac}05` }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 34, height: 34, background: "#0a0a0a", border: `1px solid ${ac}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: `${ac}55`, flexShrink: 0 }}>◈</div>
            <div style={{ flex: 1 }}>
              <input
                className="post-title-input"
                placeholder="título (opcional)"
                value={postTitle}
                onChange={e => setPostTitle(e.target.value)}
              />
              <textarea
                className="post-body-input"
                placeholder="¿qué está pasando en tu realidad?"
                value={postContent}
                onChange={e => setPostContent(e.target.value)}
                rows={2}
              />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button className="publish-btn" onClick={handlePublish} disabled={publishing || !postContent.trim()}>
                  {publishing ? <span className="spinner" /> : "PUBLICAR †"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Posts */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <span className="spinner" />
          </div>
        ) : posts.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          posts.map((p, i) => <PostCard key={p.id || i} post={p} accent={ac} />)
        )}
      </div>
    </>
  );
}
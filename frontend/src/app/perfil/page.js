"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

// ── TERMINAL COUNTER ──────────────────────────────────────────
function TerminalCounter({ label, value, text }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === null || value === undefined) return;
    let start = 0;
    const step = Math.ceil(value / 40);
    const t = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(t); }
      else setDisplay(start);
    }, 30);
    return () => clearInterval(t);
  }, [value]);
  return (
    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: "#555", display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
      <span>{label}:</span>
      <span style={{ color: "#e8e4d9" }}>
        {text || display.toLocaleString()}
        {!text && <span style={{ animation: "blink 1s step-end infinite", color: "#444" }}>_</span>}
      </span>
    </div>
  );
}


// ── SPOTIFY WIDGET COMPLETO ───────────────────────────────────
function SpotifyWidget() {
  const [prog, setProg] = useState(42);
  useEffect(() => {
    const t = setInterval(() => setProg(p => p >= 100 ? 0 : p + 0.1), 300);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ background: "rgba(0,0,0,.7)", border: "1px solid rgba(29,185,84,.15)", padding: 14 }}>
      <div style={{ fontSize: 11, color: "#1db954", letterSpacing: ".2em", marginBottom: 10 }}>† NOW PLAYING</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 48, height: 48, background: "#0a0a0a", border: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>♫</div>
        <div>
          <div style={{ fontSize: 13, color: "#e8e4d9", marginBottom: 2 }}>rotting in digital shadows</div>
          <div style={{ fontSize: 11, color: "#555" }}>self.decay</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginTop: 4 }}>1:13 / 4:29</div>
        </div>
      </div>
      <div style={{ height: 2, background: "rgba(255,255,255,.06)", borderRadius: 1, marginBottom: 12 }}>
        <div style={{ height: "100%", width: `${prog}%`, background: "#1db954", borderRadius: 1, transition: "width .3s linear" }} />
      </div>
      <div style={{ fontSize: 11, color: "#555", letterSpacing: ".15em", marginBottom: 8 }}>† ÚLTIMAS 5</div>
      {["an empty screaming void", "void.exe", "descending", "cemetery_code", "null_girl"].map((s, i) => (
        <div key={i} style={{ display: "flex", gap: 8, padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,.03)", fontSize: 11, color: "#555" }}>
          <span style={{ color: "rgba(255,255,255,.2)", width: 14 }}>{i + 1}</span>
          <span>{s}</span>
        </div>
      ))}
    </div>
  );
}

// ── PROFILE PAGE ─────────────────────────────────────────────
export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
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

      body {
        background:#000; color:#e8e4d9;
        font-family:'Space Mono',monospace;
        font-size:13px; overflow-x:hidden;
      }

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

      ::-webkit-scrollbar{width:4px}
      ::-webkit-scrollbar-track{background:#000}
      ::-webkit-scrollbar-thumb{background:#333}

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

      .profile-wrap {
        padding: 68px 28px 48px;
        max-width: 960px;
        margin: 0 auto;
        animation: fadeIn .5s ease;
      }

      .pic-cell {
        aspect-ratio: 1;
        background: #0a0a0a;
        border: 1px solid rgba(255,255,255,.06);
        display: flex; align-items: center; justify-content: center;
        font-size: 9px; color: rgba(255,255,255,.2);
        cursor: pointer; transition: border-color .2s;
      }
      .pic-cell:hover { border-color: rgba(255,255,255,.25); }

      .section-title {
        font-family: 'Cinzel', serif;
        font-size: 14px; letter-spacing: .2em;
        margin-bottom: 12px;
      }

      .about-item {
        display: flex; gap: 10px; margin-bottom: 7px;
        font-size: 13px; color: rgba(232,228,217,.75); line-height: 1.5;
      }

      .post-row {
        display: flex; justify-content: space-between;
        padding: 7px 0; border-bottom: 1px solid rgba(255,255,255,.04);
        font-size: 12px;
      }
    `;
    document.head.appendChild(s);
    return () => document.getElementById("profile-styles")?.remove();
  }, []);

  if (status === "loading") return null;

  return (
    <>
      {/* ── NAVBAR ── */}
      <Navbar />

      {/* ── PERFIL ── */}
      <div className="profile-wrap">

        {/* ── HEADER ── */}
        <div style={{ borderBottom: `1px solid ${ac}33`, paddingBottom: 18, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 34, color: "#e8e4d9", letterSpacing: ".1em" }}>
              {session?.user?.name || "dead_girl"}
            </div>
          </div>
          <div style={{ fontSize: 12, color: "rgba(232,228,217,.5)", display: "flex", gap: 14, alignItems: "center" }}>
            <span style={{ color: ac }}>†</span>
            <span style={{ color: "#3ddc84" }}>STATUS: ALIVE</span>
            <span>♥</span>
            <span
              style={{ cursor: "pointer", color: `${ac}66`, transition: "color .2s" }}
              onMouseEnter={e => e.currentTarget.style.color = "#e8e4d9"}
              onMouseLeave={e => e.currentTarget.style.color = `${ac}66`}
              onClick={() => router.push("/auth")}
            >
              logout
            </span>
          </div>
        </div>

        {/* ── GRID 3 COLUMNAS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "210px 1fr 230px", gap: 16 }}>

          {/* ── COLUMNA IZQUIERDA ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Avatar */}
            <div style={{ width: "100%", aspectRatio: "1", background: "#0a0a0a", border, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: `${ac}18`, lineHeight: 1.3, textAlign: "center", whiteSpace: "pre", userSelect: "none" }}>
                {"  ░▒▒▒▒▒░\n ▒██████▒\n▒████████▒\n▒██▒▒▒██▒\n ▒██████▒\n  ░▒▒▒▒░"}
              </div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent,rgba(0,0,0,.8))", padding: "4px 6px", fontSize: 10, color: `${ac}44`, textAlign: "center" }}>
                [ avatar ]
              </div>
            </div>

            {/* Spotify */}
            <SpotifyWidget />

            {/* Stats con contador terminal */}
            <div style={{ border, padding: "10px 12px" }}>
              <div style={{ color: ac, marginBottom: 8, letterSpacing: ".15em", fontSize: 13, fontFamily: "'Cinzel', serif" }}>† STATS</div>
              <TerminalCounter label="visitas" value={1337} />
              <TerminalCounter label="vlogs"   value={12}   />
              <TerminalCounter label="amigos"  value={48}   />
              <TerminalCounter label="desde"   value={null} text="II.MMXXIV" />
            </div>
          </div>

          {/* ── COLUMNA CENTRAL ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* About Me */}
            <div style={{ border, padding: 14 }}>
              <div className="section-title" style={{ color: ac }}>† About Me:</div>
              {[
                "i'm losing touch with reality // code is my only escape",
                "nihilist",
                "lost soul",
                "anime & horror",
              ].map((t, i) => (
                <div key={i} className="about-item">
                  <span style={{ color: ac, flexShrink: 0 }}>+</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>

            {/* Interests */}
            <div style={{ border, padding: 14 }}>
              <div className="section-title" style={{ color: ac }}>† Interests:</div>
              {[
                "dark & heavy music",
                "old websites",
                "satanic cybertrash",
                "glitch art",
                "horror manga",
              ].map((t, i) => (
                <div key={i} className="about-item">
                  <span style={{ color: ac, flexShrink: 0 }}>+</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>

            {/* Latest Posts */}
            <div style={{ border, padding: 14 }}>
              <div className="section-title" style={{ color: ac }}>† Latest Posts:</div>
              {[
                { title: "rotting in digital shadows", date: "Apr 22", views: 88  },
                { title: "an empty screaming void",    date: "Apr 20", views: 44  },
                { title: "void.exe",                   date: "Apr 18", views: 120 },
              ].map((p, i) => (
                <div key={i} className="post-row">
                  <div style={{ display: "flex", gap: 10, color: "#e8e4d9" }}>
                    <span style={{ color: ac }}>+</span>
                    <span>{p.title}</span>
                  </div>
                  <div style={{ color: "#555", flexShrink: 0, marginLeft: 12 }}>{p.date} · {p.views}v</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── COLUMNA DERECHA ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Pictures */}
            <div style={{ border, padding: 12 }}>
              <div className="section-title" style={{ color: ac }}>† Pictures:</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="pic-cell"
                    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,.25)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,.06)"}
                  >
                    img
                  </div>
                ))}
              </div>
            </div>

            {/* Music */}
            <div style={{ border, padding: 12 }}>
              <div className="section-title" style={{ color: ac }}>† Music:</div>
              <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 46, height: 46, background: "#0a0a0a", border: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>♪</div>
                <div>
                  <div style={{ fontSize: 13, color: "#e8e4d9", marginBottom: 2 }}>rotting in digital shadows</div>
                  <div style={{ fontSize: 11, color: "#555" }}>April 22</div>
                  <div style={{ fontSize: 11, color: "rgba(232,228,217,.3)", marginTop: 3 }}>an empty screaming void</div>
                </div>
              </div>
              <div
                style={{ fontSize: 12, color: ac, cursor: "pointer", letterSpacing: ".05em", transition: "opacity .2s" }}
                onMouseEnter={e => e.currentTarget.style.opacity = ".6"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                Archives →
              </div>
            </div>

            {/* Links */}
            <div style={{ border, padding: 12 }}>
              <div className="section-title" style={{ color: ac }}>† Links:</div>
              {["Discord", "Tumblr", "Pinterest", "Spotify", "Everskies"].map((l, i) => (
                <div key={i} style={{ display: "flex", gap: 8, padding: "4px 0", fontSize: 12, color: "#555", cursor: "pointer", transition: "color .2s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#e8e4d9"}
                  onMouseLeave={e => e.currentTarget.style.color = "#555"}
                >
                  <span style={{ color: ac }}>→</span> {l}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
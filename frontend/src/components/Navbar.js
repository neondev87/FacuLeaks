"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

const API = "http://localhost:4000";

function SpotifyNavWidget({ userId }) {
  const [data,    setData]    = useState(null);
  const [progress, setProgress] = useState(0);
  const [visible,  setVisible]  = useState(false);
  const tickRef   = useRef(null);
  const prevTrack = useRef(null);

  const load = async () => {
    if (!userId) return;
    try {
      const res  = await fetch(`${API}/api/spotify/now-playing/${userId}`);
      if (!res.ok) { setData(false); return; }
      const json = await res.json();
      setData(json);

      if (json?.isPlaying && json?.track) {
        if (json.progress !== undefined) setProgress(json.progress);
        // Nueva canción → animación de entrada
        if (json.track !== prevTrack.current) {
          prevTrack.current = json.track;
          setVisible(false);
          setTimeout(() => setVisible(true), 60);
        } else if (!visible) {
          setVisible(true);
        }
      } else {
        setVisible(false);
        prevTrack.current = null;
      }
    } catch {
      setData(false);
    }
  };

  // Polling cada 10 segundos
  useEffect(() => {
    if (!userId) return;
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [userId]);

  // Tick local cada segundo para la barra
  useEffect(() => {
    clearInterval(tickRef.current);
    if (data?.isPlaying && data?.duration) {
      tickRef.current = setInterval(() => {
        setProgress(p => Math.min(p + 1000, data.duration));
      }, 1000);
    }
    return () => clearInterval(tickRef.current);
  }, [data?.isPlaying, data?.duration, data?.track]);

  // Sin conectar
  if (data === false || (data && !data.connected)) {
    return (
      <button onClick={() => window.location.href = `${API}/api/spotify/auth`}
        style={{ background:"none", border:"1px solid rgba(255,255,255,.1)", color:"rgba(255,255,255,.3)", fontFamily:"'IBM Plex Mono',monospace", fontSize:8, letterSpacing:".15em", padding:"4px 10px", cursor:"pointer", transition:"all .2s" }}
        onMouseEnter={e => { e.currentTarget.style.borderColor="#1db954"; e.currentTarget.style.color="#1db954"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(255,255,255,.1)"; e.currentTarget.style.color="rgba(255,255,255,.3)"; }}>
        conectar spotify
      </button>
    );
  }

  // Nada sonando → invisible
  if (!data?.isPlaying || !data?.track) return null;

  const pct = data.duration ? Math.min((progress / data.duration) * 100, 100) : 0;
  const fmt = ms => {
    if (!ms && ms !== 0) return "0:00";
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };

  return (
    <div style={{
      display:"flex", alignItems:"center", gap:8,
      opacity: visible ? 1 : 0,
      transform: visible ? "translateX(0) scale(1)" : "translateX(8px) scale(.95)",
      transition: "opacity .4s cubic-bezier(.34,1.56,.64,1), transform .4s cubic-bezier(.34,1.56,.64,1)",
    }}>
      {data.albumArt && (
        <img src={data.albumArt} alt="art"
          style={{ width:28, height:28, objectFit:"cover", border:"1px solid rgba(255,255,255,.08)", flexShrink:0 }} />
      )}
      <div style={{ minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:3 }}>
          <span style={{ color:"#1db954", fontSize:9 }}>▶</span>
          <span style={{ fontSize:11, color:"#e8e4d9", fontFamily:"'IBM Plex Sans',sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:130 }}>
            {data.track}
          </span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <span style={{ fontSize:8, color:"rgba(255,255,255,.3)", fontFamily:"'IBM Plex Mono',monospace", flexShrink:0 }}>{fmt(progress)}</span>
          <div style={{ width:60, height:2, background:"rgba(255,255,255,.1)", borderRadius:1, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${pct}%`, background:"#1db954", borderRadius:1, transition:"width 1s linear" }} />
          </div>
          <span style={{ fontSize:8, color:"rgba(255,255,255,.3)", fontFamily:"'IBM Plex Mono',monospace", flexShrink:0 }}>{fmt(data.duration)}</span>
        </div>
      </div>
    </div>
  );
}

export default function Navbar() {
  const { data: session } = useSession();
  const router   = useRouter();
  const pathname = usePathname();

  const links = [
    { label:"MURO",     href:"/feed"   },
    { label:"PERFIL",   href:"/perfil" },
    { label:"FORO",     href:"/foro"   },
    { label:"MENSAJES", href:"/chat"   },
    { label:"AMIGOS",   href:"/amigos" },
  ];

  return (
    <>
      <style>{`
        .nav { position:fixed; top:0; left:0; right:0; height:48px; border-bottom:1px solid rgba(255,255,255,.07); background:rgba(0,0,0,.96); display:flex; align-items:center; justify-content:space-between; padding:0 28px; z-index:200; backdrop-filter:blur(6px); }
        .nav-logo { font-family:'Cinzel',serif; font-size:15px; letter-spacing:.3em; color:#fff; cursor:pointer; opacity:.85; background:none; border:none; }
        .nav-logo:hover { opacity:1; }
        .nav-link { font-size:11px; letter-spacing:.18em; color:#444; cursor:pointer; transition:color .2s; text-transform:uppercase; background:none; border:none; font-family:'Space Mono',monospace; }
        .nav-link:hover, .nav-link.active { color:#fff; }
        .nav-logout { background:none; border:none; cursor:pointer; color:#333; font-family:'Space Mono',monospace; font-size:10px; letter-spacing:.1em; transition:color .2s; }
        .nav-logout:hover { color:#e8e4d9; }
      `}</style>

      <nav className="nav">
        <button className="nav-logo" onClick={() => router.push("/feed")}>† FACULEAKS</button>

        <div style={{ display:"flex", gap:24 }}>
          {links.map(({ label, href }) => (
            <button key={label} className={`nav-link${pathname === href ? " active" : ""}`} onClick={() => router.push(href)}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ display:"flex", gap:16, alignItems:"center" }}>
          <SpotifyNavWidget userId={session?.user?.dbId} />
          <button className="nav-logout" onClick={() => signOut({ callbackUrl:"/auth" })}>logout</button>
        </div>
      </nav>
    </>
  );
}
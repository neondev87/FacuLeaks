"use client";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: components/Navbar.js — la barra de arriba de toda la app
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: la barra fija de navegación (Muro/Perfil/Foro/Mensajes/Amigos)
// que aparece en casi todas las páginas. Adentro, sin ser un archivo
// separado, vive `SpotifyNavWidget` — una versión chiquita del widget de
// Spotify (canción sonando) hecha a medida para caber en la navbar, con su
// propio polling cada 10 segundos.
//
// PARA QUÉ SIRVE: es el único componente de navegación de la app — no hay
// un router de tabs ni nada más, cada página lo importa y lo pone arriba.
//
// OJO — el logout ya NO está en la barra de escritorio (a pedido explícito,
// 2026-09-10): ahora vive solo al fondo del panel "Secciones" de celular
// (nav-mobile-panel, debajo de los 5 links). En escritorio ancho no hay,
// todavía, ningún botón para cerrar sesión — la idea a futuro es que viva
// en un menú de cuenta/ajustes (el engranaje que se mockeó en el rediseño
// del dashboard), que todavía no existe en código.
//
// CON QUÉ SE CONECTA:
//   - next-auth/react (useSession, signOut) → sabe quién sos y cierra sesión.
//   - backend: GET /api/spotify/now-playing/:userId (el widget interno).
//   - Nota para quien toque esto: hay OTRO widget de Spotify parecido pero
//     no idéntico en components/SpotifyWidget.js — ese es el que se usa
//     DENTRO de la tarjeta de perfil (con más detalle y botón conectar/
//     desconectar), no en la navbar. Son dos componentes a propósito, no
//     una duplicación por error.
// ════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { API } from "@/lib/api";

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

  // Menú de celular: los links completos no entran en 48px de alto en una
  // pantalla angosta, así que abajo de cierto ancho se esconden detrás de
  // la flechita y aparecen en un panel desplegable. Se cierra al elegir un
  // link (ver el onClick de nav-link-m más abajo), no con un efecto.
  const [mobileOpen, setMobileOpen] = useState(false);

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
        @import url('https://fonts.googleapis.com/css2?family=Marcellus+SC&family=Cormorant+Garamond:wght@700&display=swap');
        .nav { position:fixed; top:0; left:0; right:0; height:58px; border-bottom:1px solid rgba(255,255,255,.07); background:rgba(0,0,0,.96); display:flex; align-items:center; justify-content:space-between; padding:0 28px; z-index:200; backdrop-filter:blur(6px); }
        .nav-logo { display:flex; align-items:center; gap:11px; padding:0; font-family:'Marcellus SC',serif; font-size:19px; letter-spacing:.16em; color:#F4EEDD; cursor:pointer; opacity:.85; background:none; border:none; }
        .nav-logo svg { display:block; }
        .nav-logo:hover { opacity:1; }
        .nav-link { font-size:11px; letter-spacing:.18em; color:#444; cursor:pointer; transition:color .2s; text-transform:uppercase; background:none; border:none; font-family:'Space Mono',monospace; }
        .nav-link:hover, .nav-link.active { color:#fff; }
        .nav-links { display:flex; gap:24px; }

        /* ── Celular: los links se esconden, aparecen el título + la flechita ── */
        .nav-burger-label { display:none; font-family:'Space Mono',monospace; font-size:10px; letter-spacing:.1em; text-transform:uppercase; color:#555; white-space:nowrap; }
        .nav-burger { display:none; align-items:center; gap:6px; background:none; border:none; color:#999; cursor:pointer; padding:6px 2px; flex-shrink:0; }
        .nav-burger:hover { color:#fff; }
        .nav-burger:hover .nav-burger-label { color:#aaa; }
        .nav-burger svg { transition:transform .2s ease; }
        .nav-burger.open svg { transform:rotate(180deg); }
        .nav-mobile-panel { position:fixed; top:58px; left:0; right:0; background:rgba(0,0,0,.98); border-bottom:1px solid rgba(255,255,255,.07); backdrop-filter:blur(6px); display:flex; flex-direction:column; padding:6px 20px 14px; z-index:199; animation:navPanelIn .16s ease; }
        @keyframes navPanelIn { from{opacity:0; transform:translateY(-6px);} to{opacity:1; transform:translateY(0);} }
        .nav-link-m { display:block; width:100%; text-align:left; background:none; border:none; border-bottom:1px solid rgba(255,255,255,.06); color:#777; font-family:'Space Mono',monospace; font-size:12px; letter-spacing:.16em; text-transform:uppercase; padding:13px 2px; cursor:pointer; }
        .nav-link-m.active { color:#fff; }
        .nav-link-m:last-of-type { border-bottom:none; }
        .nav-link-m--logout { text-transform:none; letter-spacing:.06em; color:#555; margin-top:6px; border-top:1px solid rgba(255,255,255,.06); padding-top:16px; }
        .nav-link-m--logout:hover { color:#e8e4d9; }

        @media (max-width:760px) {
          .nav { padding:0 16px; }
          .nav-links, .nav-spotify { display:none; }
          .nav-burger-label { display:block; }
          .nav-burger { display:flex; }
        }
      `}</style>

      <nav className="nav">
        <button className="nav-logo" onClick={() => router.push("/feed")} aria-label="Faculeaks — inicio">
          {/* Escudo "Contorno": silueta + monograma FL. La cinta se omite a este
              tamaño (no se leería); el nombre va como wordmark al lado. */}
          <svg width="25" height="28" viewBox="0 0 160 178" fill="none" aria-hidden="true">
            <path d="M14 14 Q80 4 146 14 L146 66 Q146 128 80 158 Q14 128 14 66 Z" fill="none" stroke="#F4EEDD" strokeWidth="8" />
            <path d="M14 42 L146 42" stroke="#F4EEDD" strokeWidth="6" />
            <text x="80" y="128" fontFamily="'Cormorant Garamond',serif" fontWeight="700" fontSize="108" fill="#F4EEDD" textAnchor="middle">FL</text>
          </svg>
          <span>FACULEAKS</span>
        </button>

        <div className="nav-links">
          {links.map(({ label, href }) => (
            <button key={label} className={`nav-link${pathname === href ? " active" : ""}`} onClick={() => router.push(href)}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ display:"flex", gap:16, alignItems:"center" }}>
          <span className="nav-spotify"><SpotifyNavWidget userId={session?.user?.dbId} /></span>

          {/* Título + flechita de celular, juntos en un solo botón clickeable:
              abre/cierra el panel con los links de arriba. */}
          <button
            className={`nav-burger${mobileOpen ? " open" : ""}`}
            onClick={() => setMobileOpen(o => !o)}
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileOpen}
          >
            <span className="nav-burger-label">Secciones</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
          </button>
        </div>

        {mobileOpen && (
          <div className="nav-mobile-panel">
            {links.map(({ label, href }) => (
              <button
                key={label}
                className={`nav-link-m${pathname === href ? " active" : ""}`}
                onClick={() => { setMobileOpen(false); router.push(href); }}
              >
                {label}
              </button>
            ))}
            {/* Logout, siempre al fondo del panel — separado de las secciones. */}
            <button
              className="nav-link-m nav-link-m--logout"
              onClick={() => { setMobileOpen(false); signOut({ callbackUrl:"/auth" }); }}
            >
              logout
            </button>
          </div>
        )}
      </nav>
    </>
  );
}
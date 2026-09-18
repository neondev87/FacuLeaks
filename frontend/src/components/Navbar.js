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
//   - hooks/useNotifications.js + components/NotificationBell.js → la
//     campana de notificaciones (2026-09-17), ver notifWidget más abajo.
//   - Nota para quien toque esto: hay OTRO widget de Spotify parecido pero
//     no idéntico en components/SpotifyWidget.js — ese es el que se usa
//     DENTRO de la tarjeta de perfil (con más detalle y botón conectar/
//     desconectar), no en la navbar. Son dos componentes a propósito, no
//     una duplicación por error.
// ════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { API, avatarSrc } from "@/lib/api";
import useNotifications from "@/hooks/useNotifications";
import NotificationBell from "@/components/NotificationBell";
import { displayName } from "@/lib/displayName";

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

// Texto de cada notificación según su tipo — igual criterio que
// RequestsIcon/solicitudes: el componente no sabe de negocio, pero acá sí
// hace falta traducir `tipo` (SOLICITUD_AMISTAD, LIKE_POST, ...) a una
// frase legible. `mensaje` solo trae contenido en COMENTARIO_POST (preview
// del comentario, ver posts.controller.js → createComment).
function notifTexto(n) {
  const nombre = displayName(n.generador) || "Alguien";
  switch (n.tipo) {
    case "SOLICITUD_AMISTAD": return `${nombre} te envió una solicitud de amistad`;
    case "AMISTAD_ACEPTADA":  return `${nombre} aceptó tu solicitud de amistad`;
    case "LIKE_POST":         return `A ${nombre} le gustó tu publicación`;
    case "POST_COMPARTIDO":   return `${nombre} compartió tu publicación`;
    // El texto del comentario en sí (n.mensaje) se dibuja aparte, en su
    // propio cuadrito debajo — acá va solo la frase de qué pasó.
    case "COMENTARIO_POST":   return `${nombre} comentó tu publicación`;
    case "VISITA_PERFIL":     return `${nombre} visitó tu perfil`;
    case "MENCION":           return `${nombre} te mencionó`;
    default:                  return n.mensaje || "Tenés una notificación nueva";
  }
}

// A dónde navegar al clickear una notificación. No hay página de post
// individual (los posts solo se ven inline en el Muro) — para LIKE_POST/
// COMENTARIO_POST se manda el id como query param (?post=) y feed/page.js
// se encarga de ir a buscar ESE post puntual (aunque haya quedado afuera de
// la primera página) y hacerle scroll + resaltarlo, ver useEffect ahí.
function notifHref(n) {
  if (n.entidadTipo === "amistad") return "/amigos";
  if (n.entidadTipo === "post" && n.entidadId) return `/feed?post=${n.entidadId}`;
  return "/feed";
}

function notifTiempo(fecha) {
  const ms = Date.now() - new Date(fecha).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1)   return "ahora";
  if (min < 60)  return `${min}m`;
  const hs = Math.floor(min / 60);
  if (hs < 24)   return `${hs}h`;
  return `${Math.floor(hs / 24)}d`;
}

export default function Navbar() {
  const { data: session, status } = useSession();
  const router   = useRouter();
  const pathname = usePathname();

  // Menú de celular: los links completos no entran en 48px de alto en una
  // pantalla angosta, así que abajo de cierto ancho se esconden detrás de
  // la flechita y aparecen en un panel desplegable. Se cierra al elegir un
  // link (ver el onClick de nav-link-m más abajo), no con un efecto.
  const [mobileOpen, setMobileOpen] = useState(false);

  // Campana de notificaciones — mismo patrón que RequestsIcon/solicitudes
  // del chat: un ícono con badge que abre un panel desplegable. Se dibuja
  // DOS veces más abajo (notifWidget): una para el layout de escritorio
  // (pegada a la derecha de AMIGOS) y otra para el de celular (a la derecha
  // de "Secciones") — comparten este mismo estado, CSS decide cuál se ve.
  const { notificaciones, noLeidas, marcarLeidas } = useNotifications({ session, status });
  const [showNotif, setShowNotif] = useState(false);

  // notifWidget se dibuja DOS veces (escritorio y celular, ver más abajo) —
  // un solo <ref> no alcanzaría para las dos instancias, así que el "click
  // afuera cierra" busca la clase en vez de comparar contra un nodo fijo.
  useEffect(() => {
    if (!showNotif) return;
    const onDown = e => { if (!e.target.closest?.(".notif-widget")) setShowNotif(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showNotif]);

  const toggleNotif = () => setShowNotif(v => {
    const next = !v;
    if (next) marcarLeidas();
    return next;
  });

  const notifPanel = (
    <div style={{ position:"absolute", top:"100%", right:0, marginTop:6, width:340, maxWidth:"calc(100vw - 32px)", border:"1px solid rgba(255,255,255,.09)", borderRadius:10, background:"rgba(0,0,0,.98)", boxShadow:"0 8px 24px rgba(0,0,0,.5)", zIndex:210, maxHeight:400, overflowY:"auto" }}>
      <div style={{ padding:"10px 14px 6px", fontSize:10, letterSpacing:".14em", color:"#555", fontFamily:"'Space Mono',monospace" }}>NOTIFICACIONES</div>
      {notificaciones.length === 0 ? (
        <div style={{ padding:"6px 14px 14px", fontSize:12, color:"rgba(255,255,255,.25)", fontFamily:"'Space Mono',monospace" }}>sin notificaciones</div>
      ) : notificaciones.map(n => {
        const foto = avatarSrc(n.generador?.imagen);
        const inicial = (displayName(n.generador) || n.generador?.username || "?")[0]?.toUpperCase();
        return (
          <button key={n.id} onClick={() => { setShowNotif(false); router.push(notifHref(n)); }}
            style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", textAlign:"left", background: n.leida ? "none" : "rgba(255,255,255,.04)", border:"none", borderBottom:"1px solid rgba(255,255,255,.06)", padding:"14px", cursor:"pointer" }}>
            {/* Foto de perfil de quién disparó la notificación (like/comentario/
                solicitud) — antes solo había un puntito rojo, sin cara. */}
            <div style={{
              width:40, height:40, borderRadius:"50%", flexShrink:0, position:"relative",
              backgroundColor:"rgba(255,255,255,.08)", backgroundImage: foto ? `url(${foto})` : "none",
              backgroundSize:"cover", backgroundPosition:"center",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:14, fontFamily:"'Cinzel',serif", color:"rgba(255,255,255,.4)",
            }}>
              {!foto && inicial}
              {!n.leida && (
                <span style={{ position:"absolute", top:-1, right:-1, width:10, height:10, borderRadius:999, background:"#cc3344", border:"2px solid #000" }} />
              )}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, color:"#e8e4d9", fontFamily:"'Inter',sans-serif", lineHeight:1.45 }}>{notifTexto(n)}</div>
              {/* Contenido puntual de la notificación — el comentario en sí,
                  citado aparte (mismo criterio que la vista previa de
                  comentarios del Muro: mostrar la cita, no solo avisar que
                  existe). Otros tipos (like, solicitud) no traen `mensaje`. */}
              {n.mensaje && (
                <div style={{ marginTop:6, padding:"7px 10px", borderRadius:8, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.06)", fontSize:12, color:"rgba(242,240,248,.6)", fontFamily:"'Inter',sans-serif", lineHeight:1.5, wordBreak:"break-word" }}>
                  {`"${n.mensaje}"`}
                </div>
              )}
              <div style={{ fontSize:10, color:"rgba(255,255,255,.25)", fontFamily:"'Space Mono',monospace", marginTop:6 }}>{notifTiempo(n.creadoEn)}</div>
            </div>
          </button>
        );
      })}
    </div>
  );

  const notifWidget = (
    <div className="notif-widget" style={{ position:"relative" }}>
      <NotificationBell count={noLeidas} active={showNotif} onClick={toggleNotif} />
      {showNotif && notifPanel}
    </div>
  );

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
        .notif-mobile { display:none; }
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
          .notif-mobile { display:flex; align-items:center; }
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
          {/* Campana de escritorio: pegada a la derecha de AMIGOS, adentro
              del mismo flex que los links (mismo gap:24 que separa al resto). */}
          {notifWidget}
        </div>

        <span className="nav-spotify" style={{ display:"flex", alignItems:"center" }}><SpotifyNavWidget userId={session?.user?.dbId} /></span>

        {/* Título + flechita de celular, juntos en un solo botón clickeable:
            abre/cierra el panel con los links de arriba. Es su propio ítem
            del flex de .nav (ya no comparte div con spotify) para poder
            quedar en el MEDIO de la barra en celular, con la campana
            (notif-mobile, más abajo) sola a la derecha. */}
        <button
          className={`nav-burger${mobileOpen ? " open" : ""}`}
          onClick={() => setMobileOpen(o => !o)}
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={mobileOpen}
        >
          <span className="nav-burger-label">Secciones</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
        </button>

        {/* Campana de celular: oculta en escritorio (la de arriba ya se ve
            junto a AMIGOS), visible solo bajo los 760px, a la derecha del todo. */}
        <div className="notif-mobile">{notifWidget}</div>

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
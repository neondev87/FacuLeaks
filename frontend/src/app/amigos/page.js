"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

// ── SPOTIFY COMPACTO ──────────────────────────────────────────
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
        <div style={{ color: "#e8e4d9", fontSize: 11, letterSpacing: ".04em", marginBottom: 2, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          rotting in digital shadows
        </div>
        <div style={{ width: 80, height: 2, background: "rgba(255,255,255,.08)", borderRadius: 1 }}>
          <div style={{ height: "100%", width: `${prog}%`, background: "#1db954", borderRadius: 1, transition: "width .3s linear" }} />
        </div>
      </div>
    </div>
  );
}

// ── AMIGOS PAGE ───────────────────────────────────────────────
export default function AmigosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const ac = "#ffffff";

  const [amigos,    setAmigos]    = useState([]);
  const [recibidas, setRecibidas] = useState([]);
  const [enviadas,  setEnviadas]  = useState([]);
  const [busqueda,  setBusqueda]  = useState("");
  const [resultados,setResultados]= useState([]);
  const [buscando,  setBuscando]  = useState(false);
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth");
  }, [status, router]);

  // ── Estilos ──
  useEffect(() => {
    const s = document.createElement("style");
    s.id = "amigos-styles";
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Cinzel:wght@400;600;900&display=swap');

      @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

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

      .page-wrap {
        padding: 68px 28px 48px;
        max-width: 900px;
        margin: 0 auto;
        animation: fadeIn .5s ease;
      }

      .search-input {
        width: 100%;
        background: rgba(255,255,255,.04);
        border: 1px solid rgba(255,255,255,.1);
        color: #e8e4d9;
        font-family: 'Space Mono', monospace;
        font-size: 13px;
        padding: 12px 16px;
        outline: none;
        letter-spacing: .04em;
        transition: border-color .2s;
      }
      .search-input:focus { border-color: rgba(255,255,255,.3); }
      .search-input::placeholder { color: rgba(255,255,255,.2); }

      .user-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border: 1px solid rgba(255,255,255,.06);
        margin-bottom: 8px;
        transition: border-color .2s;
      }
      .user-card:hover { border-color: rgba(255,255,255,.15); }

      .btn-action {
        font-family: 'Space Mono', monospace;
        font-size: 10px;
        letter-spacing: .15em;
        padding: 5px 14px;
        cursor: pointer;
        transition: all .2s;
        border: 1px solid;
        background: transparent;
      }
      .btn-add      { color: rgba(255,255,255,.6);  border-color: rgba(255,255,255,.2);  }
      .btn-add:hover{ color: #fff; border-color: rgba(255,255,255,.5); background: rgba(255,255,255,.05); }
      .btn-accept   { color: rgba(100,220,120,.8);  border-color: rgba(100,220,120,.3);  }
      .btn-accept:hover { color: #fff; border-color: rgba(100,220,120,.7); background: rgba(100,220,120,.08); }
      .btn-reject   { color: rgba(220,80,80,.7);    border-color: rgba(220,80,80,.2);    }
      .btn-reject:hover { color: #fff; border-color: rgba(220,80,80,.5); background: rgba(220,80,80,.08); }
      .btn-remove   { color: rgba(255,255,255,.3);  border-color: rgba(255,255,255,.08); }
      .btn-remove:hover { color: rgba(220,80,80,.8); border-color: rgba(220,80,80,.3); }

      .section-header {
        font-family: 'Cinzel', serif;
        font-size: 14px;
        letter-spacing: .2em;
        color: #fff;
        margin-bottom: 16px;
        padding-bottom: 10px;
        border-bottom: 1px solid rgba(255,255,255,.08);
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .badge {
        background: #cc3344;
        color: #fff;
        font-family: 'Space Mono', monospace;
        font-size: 9px;
        padding: 1px 6px;
        min-width: 18px;
        text-align: center;
      }

      .spinner {
        width: 12px; height: 12px;
        border: 1px solid rgba(255,255,255,.15);
        border-top-color: rgba(255,255,255,.5);
        border-radius: 50%;
        animation: spin .7s linear infinite;
        display: inline-block;
      }

      .empty-state {
        text-align: center;
        padding: 32px 0;
        color: #333;
        font-size: 12px;
        letter-spacing: .1em;
      }

      .pending-badge {
        font-size: 9px;
        letter-spacing: .1em;
        color: #f0a500;
        border: 1px solid rgba(240,165,0,.3);
        padding: 2px 6px;
      }
      .sent-badge {
        font-size: 9px;
        letter-spacing: .1em;
        color: rgba(255,255,255,.3);
        border: 1px solid rgba(255,255,255,.1);
        padding: 2px 6px;
      }
    `;
    document.head.appendChild(s);
    return () => document.getElementById("amigos-styles")?.remove();
  }, []);

  // ── Cargar amigos ──
  const loadAmigos = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("http://localhost:4000/api/amigos", { credentials: "include" });
      const data = await res.json();
      setAmigos(data.amigos     || []);
      setRecibidas(data.recibidas || []);
      setEnviadas(data.enviadas   || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "authenticated") loadAmigos();
  }, [status, loadAmigos]);

  // ── Buscar usuarios ──
  useEffect(() => {
    if (busqueda.length < 2) { setResultados([]); return; }
    const t = setTimeout(async () => {
      setBuscando(true);
      try {
        const res  = await fetch(`http://localhost:4000/api/amigos/buscar?q=${busqueda}`, { credentials: "include" });
        const data = await res.json();
        setResultados(data.usuarios || []);
      } catch {}
      setBuscando(false);
    }, 400);
    return () => clearTimeout(t);
  }, [busqueda]);

  // ── Acciones ──
  const enviarSolicitud = async (userId) => {
    await fetch(`http://localhost:4000/api/amigos/solicitud/${userId}`, { method: "POST", credentials: "include" });
    setBusqueda("");
    loadAmigos();
  };

  const aceptar = async (amistadId) => {
    await fetch(`http://localhost:4000/api/amigos/aceptar/${amistadId}`, { method: "PUT", credentials: "include" });
    loadAmigos();
  };

  const rechazar = async (amistadId) => {
    await fetch(`http://localhost:4000/api/amigos/rechazar/${amistadId}`, { method: "PUT", credentials: "include" });
    loadAmigos();
  };

  const eliminar = async (amistadId) => {
    await fetch(`http://localhost:4000/api/amigos/${amistadId}`, { method: "DELETE", credentials: "include" });
    loadAmigos();
  };

  // ── Componente usuario card ──
  const UserCard = ({ user, actions }) => (
    <div className="user-card">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, background: "#0a0a0a", border: `1px solid ${ac}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: `${ac}44`, flexShrink: 0 }}>◈</div>
        <div>
          <div style={{ fontSize: 13, color: "#e8e4d9", letterSpacing: ".04em" }}>@{user.username}</div>
          <div style={{ fontSize: 11, color: "#555" }}>{user.nombre}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {actions}
      </div>
    </div>
  );

  if (status === "loading") return null;

  return (
    <>
      {/* ── NAVBAR ── */}
      <nav className="nav">
        <span className="nav-logo">† FACULEAKS</span>
        <div style={{ display: "flex", gap: 28 }}>
          {[
            { label: "MURO",     href: "/feed"    },
            { label: "PERFIL",   href: "/perfil"  },
            { label: "FORO",     href: "/foro"    },
            { label: "MENSAJES", href: "/chat"    },
            { label: "AMIGOS",   href: "/amigos"  },
          ].map(({ label, href }) => (
            <button key={label} className={`nav-link${href === "/amigos" ? " active" : ""}`} onClick={() => router.push(href)}>
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

      <div className="page-wrap">

        {/* ── BUSCADOR ── */}
        <div style={{ marginBottom: 40 }}>
          <div className="section-header">† BUSCAR USUARIOS</div>
          <div style={{ position: "relative" }}>
            <input
              className="search-input"
              placeholder="buscar por username..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
            {buscando && (
              <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }}>
                <span className="spinner" />
              </div>
            )}
          </div>

          {/* Resultados de búsqueda */}
          {resultados.length > 0 && (
            <div style={{ marginTop: 8, border: "1px solid rgba(255,255,255,.08)", padding: 8 }}>
              {resultados.map(u => (
                <UserCard
                  key={u.id}
                  user={u}
                  actions={
                    u.estadoAmistad === 'ACEPTADO' ? (
                      <span style={{ fontSize: 10, color: "#3ddc84", letterSpacing: ".1em" }}>✓ amigos</span>
                    ) : u.estadoAmistad === 'PENDIENTE' && u.esSolicitante ? (
                      <span className="sent-badge">enviada</span>
                    ) : u.estadoAmistad === 'PENDIENTE' && !u.esSolicitante ? (
                      <span className="pending-badge">pendiente</span>
                    ) : (
                      <button className="btn-action btn-add" onClick={() => enviarSolicitud(u.id)}>
                        + AGREGAR
                      </button>
                    )
                  }
                />
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>

          {/* ── SOLICITUDES RECIBIDAS ── */}
          <div>
            <div className="section-header">
              † SOLICITUDES
              {recibidas.length > 0 && <span className="badge">{recibidas.length}</span>}
            </div>
            {loading ? (
              <div className="empty-state"><span className="spinner" /></div>
            ) : recibidas.length === 0 ? (
              <div className="empty-state">sin solicitudes pendientes</div>
            ) : (
              recibidas.map(({ amistadId, user }) => (
                <UserCard
                  key={amistadId}
                  user={user}
                  actions={
                    <>
                      <button className="btn-action btn-accept" onClick={() => aceptar(amistadId)}>ACEPTAR</button>
                      <button className="btn-action btn-reject" onClick={() => rechazar(amistadId)}>✕</button>
                    </>
                  }
                />
              ))
            )}
          </div>

          {/* ── ENVIADAS ── */}
          <div>
            <div className="section-header">† ENVIADAS</div>
            {enviadas.length === 0 ? (
              <div className="empty-state">sin solicitudes enviadas</div>
            ) : (
              enviadas.map(({ amistadId, user }) => (
                <UserCard
                  key={amistadId}
                  user={user}
                  actions={<span className="sent-badge">pendiente</span>}
                />
              ))
            )}
          </div>
        </div>

        {/* ── AMIGOS ── */}
        <div style={{ marginTop: 40 }}>
          <div className="section-header">
            † MIS AMIGOS
            <span style={{ fontSize: 11, color: "#555", letterSpacing: ".1em" }}>{amigos.length}</span>
          </div>
          {loading ? (
            <div className="empty-state"><span className="spinner" /></div>
          ) : amigos.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 24, marginBottom: 8 }}>◈</div>
              <div>aún no tienes amigos — busca usuarios arriba</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {amigos.map(({ amistadId, user }) => (
                <UserCard
                  key={amistadId}
                  user={user}
                  actions={
                    <button className="btn-action btn-remove" onClick={() => eliminar(amistadId)}>
                      ELIMINAR
                    </button>
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

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

export default function Navbar() {
  const { data: session } = useSession();
  const router   = useRouter();
  const pathname = usePathname();

  const links = [
    { label: "MURO",     href: "/feed"   },
    { label: "PERFIL",   href: "/perfil" },
    { label: "FORO",     href: "/foro"   },
    { label: "MENSAJES", href: "/chat"   },
    { label: "AMIGOS",   href: "/amigos" },
  ];

  return (
    <>
      <style>{`
        .nav {
          position:fixed; top:0; left:0; right:0; height:48px;
          border-bottom:1px solid rgba(255,255,255,.08);
          background:rgba(0,0,0,.94);
          display:flex; align-items:center; justify-content:space-between;
          padding:0 28px; z-index:200; backdrop-filter:blur(4px);
        }
        .nav-logo { font-family:'Cinzel',serif; font-size:15px; letter-spacing:.3em; color:#fff; cursor:pointer; opacity:.9; background:none; border:none; }
        .nav-logo:hover { opacity:1; }
        .nav-link { font-size:12px; letter-spacing:.2em; color:#555; cursor:pointer; transition:color .2s; text-transform:uppercase; background:none; border:none; font-family:'Space Mono',monospace; }
        .nav-link:hover, .nav-link.active { color:#fff; }
        .nav-logout { background:none; border:none; cursor:pointer; color:#555; font-family:'Space Mono',monospace; font-size:11px; letter-spacing:.12em; transition:color .2s; }
        .nav-logout:hover { color:#e8e4d9; }
      `}</style>

      <nav className="nav">
        <button className="nav-logo" onClick={() => router.push("/feed")}>† FACULEAKS</button>
        <div style={{ display: "flex", gap: 28 }}>
          {links.map(({ label, href }) => (
            <button
              key={label}
              className={`nav-link${pathname === href ? " active" : ""}`}
              onClick={() => router.push(href)}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <SpotifyWidgetCompact />
          <span style={{ fontSize: 11, color: "#3ddc84", letterSpacing: ".12em" }}>● ONLINE</span>
          <button className="nav-logout" onClick={() => signOut({ callbackUrl: "/auth" })}>
            logout
          </button>
        </div>
      </nav>
    </>
  );
}
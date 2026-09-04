"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import AvatarMenu from "@/components/AvatarMenu";
import PicturesGrid from "@/components/PicturesGrid";
import PostCard from "@/components/PostCard";
import useInjectedStyles from "@/hooks/useInjectedStyles";
import usePublicProfile from "@/hooks/usePublicProfile";
import TerminalCounter from "@/components/perfil/TerminalCounter";
import Lightbox from "@/components/Lightbox";
import { publicStyles } from "./publicStyles";

export default function PerfilPublicoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const userId = params?.id;

  const {
    perfil, loading, notFound, photos,
    lightboxSrc, setLightboxSrc,
  } = usePublicProfile({ userId, status, session, router });

  const border = "1px solid rgba(255,255,255,.07)";
  const card   = { border, padding:16, background:"#050505" };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth");
  }, [status, router]);

  useInjectedStyles("perfil-pub-styles", publicStyles);

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
      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} dim="rgba(0,0,0,.95)" />}

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
                    viewerId={session?.user?.dbId}
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

"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import SpotifyWidget from "@/components/SpotifyWidget";
import AvatarMenu from "@/components/AvatarMenu";
import PicturesGrid from "@/components/PicturesGrid";
import PostCard from "@/components/PostCard";
import { API } from "@/lib/api";
import useInjectedStyles from "@/hooks/useInjectedStyles";
import useOwnProfile from "@/hooks/useOwnProfile";
import TerminalCounter from "@/components/perfil/TerminalCounter";
import EditModal from "@/components/perfil/EditModal";
import Lightbox from "@/components/Lightbox";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: app/perfil/page.js — TU perfil (propio, editable)
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: muestra tu perfil completo y permite editarlo — avatar, bio,
// intereses, links, galería de fotos, tus posts, tu widget de Spotify. Usa
// hooks/useOwnProfile.js para todo el estado y datos.
//
// PARA QUÉ SIRVE / OJO IMPORTANTE: esta página es la del perfil PROPIO —
// para ver el perfil de OTRO usuario existe una página hermana,
// app/perfil/[id]/page.js (con su propio hook, usePublicProfile). En algún
// momento (Fase 2, bug B1) estas dos páginas estuvieron con el contenido
// literalmente intercambiado — si algo del perfil se ve raro, lo primero es
// confirmar que estás editando la página correcta.
//
// CON QUÉ SE CONECTA: hooks/useOwnProfile.js, components/{SpotifyWidget,
// AvatarMenu, PicturesGrid, PostCard}.js, components/perfil/*. Protegida
// por proxy.js.
// ════════════════════════════════════════════════════════════════════════
import { profileStyles } from "./profileStyles";

// ════════════════════════════════════════════════════════════════
// ── PÁGINA PRINCIPAL DE PERFIL (perfil propio, /perfil) ──
// ════════════════════════════════════════════════════════════════

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router  = useRouter();

  const {
    perfil, setPerfil, loading, showEdit, setShowEdit, saveMsg,
    posts, lightboxSrc, setLightboxSrc, photos, handleSave, handleDeletePost,
  } = useOwnProfile({ status, session });

  // ── Estilos ──
  const border = "1px solid rgba(255,255,255,.07)";
  const card   = { border, padding: 16, background: "#050505" };

  useInjectedStyles("profile-styles", profileStyles);

  // ── Redirect si no está autenticado ──
  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth");
  }, [status, router]);

  // ── Loading ──
  if (status === "loading" || loading) return null;
  if (!perfil) return null;

  const { user, profile, stats } = perfil;

  // ── Parsear intereses y links (pueden venir como JSON o array) ──
  const intereses = Array.isArray(profile.intereses) ? profile.intereses
    : profile.intereses ? Object.values(profile.intereses) : [];
  const links = Array.isArray(profile.links) ? profile.links
    : profile.links ? Object.values(profile.links) : [];

  return (
    <>
      <Navbar />

      {/* Modal de editar perfil */}
      {showEdit && <EditModal profile={profile} user={user} onClose={() => setShowEdit(false)} onSave={handleSave} />}

      {/* Lightbox para posts */}
      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} dim="rgba(0,0,0,.95)" />}

      {/* Toast de guardado */}
      {saveMsg && (
        <div style={{ position:"fixed", bottom:28, left:"50%", transform:"translateX(-50%)", background:"#fff", color:"#000", padding:"8px 20px", fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:500, zIndex:2000, animation:"savePop 2.5s ease forwards", borderRadius:4 }}>
          {saveMsg}
        </div>
      )}

      <div className="profile-wrap">

        {/* ── Header ── */}
        <div style={{ borderBottom:"1px solid rgba(255,255,255,.06)", paddingBottom:18, marginBottom:24 }}>
          <div style={{ fontFamily:"'Cinzel',serif", fontSize:30, color:"#e8e4d9", letterSpacing:".06em", lineHeight:1.1 }}>
            {user.nombre || user.username}
          </div>
          {profile.statusText && (
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:"#555", marginTop:5, fontStyle:"italic" }}>
              {profile.statusText}
            </div>
          )}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"210px 1fr 230px", gap:12 }}>

          {/* ════════════════════════════════════════════════ */}
          {/* ── COLUMNA IZQUIERDA ── */}
          {/* ════════════════════════════════════════════════ */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

            {/* ── Avatar con menú contextual ── */}
            <AvatarMenu
              currentAvatar={user.imagen}
              canEdit={true}
              onAvatarChange={(url) => {
                setPerfil(p => ({
                  ...p,
                  user: { ...p.user, imagen: url },
                  posts: (p.posts || []).map(post =>
                    post.autor ? { ...post, autor: { ...post.autor, imagen: url } } : post
                  ),
                }));
              }}
            />

            {/* ── Spotify Widget ── */}
            <SpotifyWidget userId={user.id}
              onConnect={() => window.location.href = `${API}/api/spotify/auth`}
              onDisconnect={() => fetchPerfil()} />

            {/* ── Stats ── */}
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

          {/* ════════════════════════════════════════════════ */}
          {/* ── COLUMNA CENTRAL ── */}
          {/* ════════════════════════════════════════════════ */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

            {/* ── Sobre mí ── */}
            <div style={card}>
              <div className="sec-title">† Sobre mí</div>
              {profile.bio
                ? <div style={{ fontSize:13, color:"rgba(232,228,217,.65)", lineHeight:1.75, fontFamily:"'Inter',sans-serif" }}>{profile.bio}</div>
                : <div style={{ fontSize:12, color:"#222", cursor:"pointer" }} onClick={() => setShowEdit(true)}>+ agregar bio...</div>
              }
            </div>

            {/* ── Posts ── */}
            <div style={card}>
              <div className="sec-title">† Posts</div>
              {posts.length > 0
                ? posts.map(p => (
                    <PostCard
                      key={p.id}
                      post={p}
                      currentUser={user}
                      viewerId={session?.user?.dbId}
                      canDelete={true}
                      onDelete={() => handleDeletePost(p.id)}
                      onImageClick={(src) => setLightboxSrc(src)}
                    />
                  ))
                : <div style={{ fontSize:12, color:"#222" }}>no hay posts aún</div>
              }
            </div>
          </div>

          {/* ════════════════════════════════════════════════ */}
          {/* ── COLUMNA DERECHA ── */}
          {/* ════════════════════════════════════════════════ */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

            {/* ── Pictures (Grid de fotos) ── */}
            <div style={card}>
              <div className="sec-title">† Pictures</div>
              <PicturesGrid
                userId={user.id}
                initialPhotos={photos}
                canEdit={true}
              />
            </div>

            {/* ── Links ── */}
            <div style={card}>
              <div className="sec-title">† Links</div>
              {links.length > 0
                ? links.map((l, i) => {
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
                })
                : <div style={{ fontSize:12, color:"#222" }}>+ agregar links...</div>
              }
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
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
import FriendsModal from "@/components/perfil/FriendsModal";
import Lightbox from "@/components/Lightbox";
import { escudoUrl } from "@/lib/facultades";
import SocialLinks from "@/components/perfil/SocialLinks";
import FacultadTag from "@/components/perfil/FacultadTag";

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
import { HOLO_THEME } from "@/lib/theme";

// ════════════════════════════════════════════════════════════════
// ── PÁGINA PRINCIPAL DE PERFIL (perfil propio, /perfil) ──
// ════════════════════════════════════════════════════════════════

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router  = useRouter();

  const {
    perfil, setPerfil, loading, showEdit, setShowEdit, saveMsg,
    posts, lightboxSrc, setLightboxSrc, photos, handleSave, handleDeletePost, handleUnshare, toggleReaction,
    fetchPerfil,
  } = useOwnProfile({ status, session });

  // "Recopilación" de amigos — modal que abre el contador "amigos" de acá
  // abajo (ver components/perfil/FriendsModal.js).
  const [showFriends, setShowFriends] = useState(false);

  // ── Estilos ──
  const card = { border: `1px solid ${HOLO_THEME.hairlineSoft}`, borderRadius: 12, padding: 24, background: HOLO_THEME.panel };

  useInjectedStyles("profile-styles", profileStyles);

  // ── Redirect si no está autenticado ──
  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth");
  }, [status, router]);

  // ── Loading ──
  if (status === "loading" || loading) return null;
  if (!perfil) return null;

  const { user, profile, stats } = perfil;

  // Nombre a mostrar arriba de todo — respeta la elección de "Información"
  // (mostrarNombreCompleto, default true). Si eligió @usuario, se muestra
  // ESO tal cual lo va a ver cualquiera que entre a tu perfil público.
  const displayName = profile.mostrarNombreCompleto === false
    ? user.username
    : (user.nombre || user.username);

  return (
    <>
      <Navbar />

      {/* Modal de editar perfil */}
      {showEdit && <EditModal profile={profile} user={user} onClose={() => setShowEdit(false)} onSave={handleSave} />}

      {/* Modal de amigos — abre desde el contador "amigos" de Información */}
      {showFriends && <FriendsModal onClose={() => setShowFriends(false)} />}

      {/* Lightbox para posts */}
      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} dim="rgba(0,0,0,.95)" />}

      {/* Toast de guardado */}
      {saveMsg && (
        <div style={{ position:"fixed", bottom:28, left:"50%", transform:"translateX(-50%)", background:"#fff", color:"#000", padding:"8px 20px", fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:500, zIndex:2000, animation:"savePop 2.5s ease forwards", borderRadius:4 }}>
          {saveMsg}
        </div>
      )}

      <div className="profile-wrap">

        {/* ── Header — el nombre respeta "Información › nombre a mostrar"
            (nombre completo o @usuario, ver más abajo). Spotify vive acá al
            lado del nombre, NO al lado de la foto — así el avatar no se
            tiene que achicar para hacerle lugar. ── */}
        <div className="profile-header" style={{ borderBottom:`1px solid ${HOLO_THEME.hairlineSoft}`, paddingBottom:20, marginBottom:26, display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:24 }}>
          <div style={{ minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div className="profile-name" style={{ fontFamily:"'Cinzel',serif", fontSize:30, fontWeight:600, color:HOLO_THEME.text, letterSpacing:".06em", lineHeight:1.1 }}>
                {displayName}
              </div>
              <div className="profile-social-icons"><SocialLinks links={profile.links} /></div>
            </div>
            {/* Facultad bajo el nombre — SOLO PC. En celular se muestra al
                lado de la foto de perfil en vez de acá (ver profile-avatar-side
                más abajo) — pedido explícito de Erick (2026-09-11, con
                mockup). Misma etiqueta (FacultadTag), dos lugares, uno de
                los dos siempre está en display:none según el ancho. */}
            <div className="profile-header-facultad" style={{ marginTop:8 }}>
              <FacultadTag facultad={user.facultad} />
            </div>
            {/* Situación sentimental: oculta acá por default — solo se ve
                si prendiste el switch de "Editar perfil" (2026-09-11). Si
                está apagado, no se muestra en NINGÚN lado del perfil propio
                (ya la elegiste vos, no hace falta un panel de "ver info"
                para vos mismo — ese existe en el perfil público). Se
                mantiene igual en PC y celular. */}
            {profile.mostrarSituacion === true && profile.statusText && (
              <div style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:HOLO_THEME.textDim, marginTop:8, fontStyle:"italic" }}>
                {profile.statusText}
              </div>
            )}
          </div>
          <div className="profile-spotify-box">
            <SpotifyWidget userId={user.id}
              onConnect={() => window.location.href = `${API}/api/spotify/auth`}
              onDisconnect={fetchPerfil} />
          </div>
        </div>

        <div className="profile-grid">

          {/* ════════════════════════════════════════════════ */}
          {/* ── COLUMNA IZQUIERDA ── */}
          {/* ════════════════════════════════════════════════ */}
          <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

            {/* ── Avatar — mismo tamaño (165) que el recuadro de perfil del
                muro; ya no comparte fila con Spotify (ver header, arriba),
                así no se achica para hacerle lugar. En celular, al lado
                (profile-avatar-side) van la facultad y el ícono de
                Instagram — en PC ese bloque queda en display:none, ahí
                viven arriba en el header en vez de acá. ── */}
            <div className="profile-avatar-row">
              <AvatarMenu
                className="profile-avatar-box"
                currentAvatar={user.imagen}
                escudoUrl={escudoUrl(user.facultad)}
                canEdit={true}
                size={165}
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
              <div className="profile-avatar-side">
                <FacultadTag facultad={user.facultad} size="lg" />
                <div className="profile-social-icons-side"><SocialLinks links={profile.links} variant="expanded" /></div>
              </div>
            </div>

            {/* ── Información (antes "Stats") — el "Sobre mí" vive plegado
                atrás del ícono de info, para ver o (si está vacío) agregarlo. ──
                2026-09-11: el lápiz ya no despliega nada acá — abre directo
                el EditModal, que es donde vive TODO lo editable (nombre a
                mostrar, bio, links, intereses, facultad...). Esta tarjeta
                solo muestra los contadores, nada más. ── */}
            <div style={card}>
              <div className="sec-title" style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                Información
                <button onClick={() => setShowEdit(true)} title="editar información"
                  style={{ background:"none", border:"none", padding:2, cursor:"pointer", color:HOLO_THEME.textDim, transition:"color .15s", display:"flex" }}
                  onMouseEnter={e => e.currentTarget.style.color = HOLO_THEME.text}
                  onMouseLeave={e => e.currentTarget.style.color = HOLO_THEME.textDim}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                </button>
              </div>
              <TerminalCounter label="visitas" value={stats?.visitas || 0} />
              <TerminalCounter label="vlogs"   value={stats?.vlogs   || 0} />
              <TerminalCounter label="amigos"  value={stats?.amigos  || 0} onClick={() => setShowFriends(true)} />
              <TerminalCounter label="desde"   value={null} text={
                user.creadoEn ? new Date(user.creadoEn).toLocaleDateString("es-MX", { month:"short", year:"numeric" }) : "—"
              } />
            </div>

            {/* ── Pictures, debajo de Información — miniaturas un poco más
                grandes (72x94) para que llenen el ancho de la columna sin
                dejar franja vacía. ── */}
            <div style={card}>
              <div className="sec-title">Pictures</div>
              <PicturesGrid
                initialPhotos={photos}
                canEdit={true}
              />
            </div>
          </div>

          {/* ════════════════════════════════════════════════ */}
          {/* ── COLUMNA CENTRAL ── */}
          {/* ════════════════════════════════════════════════ */}
          <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

            {/* ── Posts ── */}
            <div style={card}>
              <div className="sec-title">Posts</div>
              {posts.length > 0
                ? posts.map(p => (
                    <PostCard
                      key={p.id}
                      post={p}
                      currentUser={{ ...user, mostrarNombreCompleto: profile.mostrarNombreCompleto }}
                      viewerId={session?.user?.dbId}
                      canDelete={true}
                      onDelete={() => p.isShared ? handleUnshare(p.id) : handleDeletePost(p.id)}
                      onImageClick={(src) => setLightboxSrc(src)}
                      onReact={toggleReaction}
                    />
                  ))
                : <div style={{ fontSize:12, color:HOLO_THEME.textDim }}>no hay posts aún</div>
              }
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

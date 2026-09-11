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

  // El "Sobre mí" ya no es una tarjeta propia — vive plegado adentro de
  // "Información" (antes "Stats"), atrás del ícono de info. Acá, a
  // diferencia del perfil público, el ícono siempre está aunque no haya
  // bio todavía: es también la puerta para agregarla (abre el modal).
  const [showBio, setShowBio] = useState(false);

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

  // ── Parsear intereses y links (pueden venir como JSON o array) ──
  const intereses = Array.isArray(profile.intereses) ? profile.intereses
    : profile.intereses ? Object.values(profile.intereses) : [];
  const links = Array.isArray(profile.links) ? profile.links
    : profile.links ? Object.values(profile.links) : [];

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
        <div style={{ borderBottom:`1px solid ${HOLO_THEME.hairlineSoft}`, paddingBottom:20, marginBottom:26, display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:24 }}>
          <div>
            <div style={{ fontFamily:"'Cinzel',serif", fontSize:30, fontWeight:600, color:HOLO_THEME.text, letterSpacing:".06em", lineHeight:1.1 }}>
              {displayName}
            </div>
            {profile.statusText && (
              <div style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:HOLO_THEME.textDim, marginTop:6, fontStyle:"italic" }}>
                {profile.statusText}
              </div>
            )}
          </div>
          <div style={{ width:230, flexShrink:0 }}>
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
                así no se achica para hacerle lugar. ── */}
            <AvatarMenu
              currentAvatar={user.imagen}
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

            {/* ── Información (antes "Stats") — el "Sobre mí" vive plegado
                atrás del ícono de info, para ver o (si está vacío) agregarlo. ── */}
            <div style={card}>
              <div className="sec-title" style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                Información
                <button onClick={() => setShowBio(v => !v)} title={showBio ? "ocultar sobre mí" : "editar sobre mí"}
                  style={{ background:"none", border:"none", padding:2, cursor:"pointer", color: showBio ? HOLO_THEME.text : HOLO_THEME.textDim, transition:"color .15s", display:"flex" }}
                  onMouseEnter={e => e.currentTarget.style.color = HOLO_THEME.text}
                  onMouseLeave={e => e.currentTarget.style.color = showBio ? HOLO_THEME.text : HOLO_THEME.textDim}>
                  {/* Acá es TU perfil: un lápiz (editar), no la flechita que
                      usa el perfil público (ver "espectadores" en [id]/page.js). */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                </button>
              </div>
              <TerminalCounter label="visitas" value={stats?.visitas || 0} />
              <TerminalCounter label="vlogs"   value={stats?.vlogs   || 0} />
              <TerminalCounter label="amigos"  value={stats?.amigos  || 0} />
              <TerminalCounter label="desde"   value={null} text={
                user.creadoEn ? new Date(user.creadoEn).toLocaleDateString("es-MX", { month:"short", year:"numeric" }) : "—"
              } />
              {showBio && (
                <div style={{ marginTop:10, paddingTop:10, borderTop:`1px solid ${HOLO_THEME.hairlineSoft}` }}>
                  {/* Nombre a mostrar — varios amigos de Erick pidieron
                      poder elegir esto (algunos no querían que se viera el
                      nombre completo). Guarda al toque, sin pasar por el
                      modal grande. */}
                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontSize:11, fontWeight:500, color:HOLO_THEME.textDim, letterSpacing:".04em", marginBottom:7, fontFamily:"'Inter',sans-serif" }}>Nombre a mostrar</div>
                    <div style={{ display:"flex", gap:8 }}>
                      {[
                        { label:"Nombre completo", val:true },
                        { label:"Usuario",         val:false },
                      ].map(({ label, val }) => {
                        const active = (profile.mostrarNombreCompleto !== false) === val;
                        return (
                          <button key={label} onClick={() => handleSave({ mostrarNombreCompleto: val })}
                            style={{
                              background: active ? HOLO_THEME.text : "rgba(255,255,255,.05)",
                              border: `1px solid ${active ? HOLO_THEME.text : HOLO_THEME.hairline}`,
                              borderRadius: 999,
                              color: active ? HOLO_THEME.bg : HOLO_THEME.textDim,
                              fontFamily: "'Inter',sans-serif",
                              fontSize: 11.5,
                              fontWeight: active ? 500 : 400,
                              padding: "6px 13px",
                              cursor: "pointer",
                              transition: "all .15s",
                            }}>
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {profile.bio
                    ? <div style={{ fontSize:13, color:"rgba(242,240,248,.65)", lineHeight:1.9, fontFamily:"'Inter',sans-serif" }}>{profile.bio}</div>
                    : <div style={{ fontSize:12, color:HOLO_THEME.textDim, cursor:"pointer" }} onClick={() => setShowEdit(true)}>+ agregar bio...</div>
                  }
                  {/* Links — ya no es una tarjeta aparte, vive acá adentro
                      (se edita en el mismo modal que la bio). */}
                  {links.length > 0
                    ? (
                      <div style={{ marginTop:10, display:"flex", flexDirection:"column" }}>
                        {links.map((l, i) => {
                          const lbl = typeof l === "string" ? l : l.label;
                          const url = typeof l === "string" ? "#" : (l.url || "#");
                          return (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                              style={{ display:"flex", gap:8, padding:"5px 0", fontSize:12, color:HOLO_THEME.textDim, cursor:"pointer", transition:"color .2s", textDecoration:"none", fontFamily:"'Inter',sans-serif" }}
                              onMouseEnter={e => e.currentTarget.style.color = HOLO_THEME.text}
                              onMouseLeave={e => e.currentTarget.style.color = HOLO_THEME.textDim}>
                              <span style={{ color:"rgba(159,224,255,.5)" }}>→</span> {lbl}
                            </a>
                          );
                        })}
                      </div>
                    )
                    : <div style={{ marginTop:10, fontSize:12, color:HOLO_THEME.textDim, cursor:"pointer" }} onClick={() => setShowEdit(true)}>+ agregar links...</div>
                  }
                </div>
              )}
            </div>

            {/* ── Pictures, debajo de Información — miniaturas un poco más
                grandes (72x94) para que llenen el ancho de la columna sin
                dejar franja vacía. ── */}
            <div style={card}>
              <div className="sec-title">Pictures</div>
              <PicturesGrid
                userId={user.id}
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
                      currentUser={user}
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

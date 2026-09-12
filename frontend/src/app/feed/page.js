"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Uploader from "@/components/Uploader";
import DownloadBar from "@/components/DownloadBar";
import BgCross from "@/components/BgCross";
import AvatarMenu from "@/components/AvatarMenu";
import { API } from "@/lib/api";
import useInjectedStyles from "@/hooks/useInjectedStyles";
import useFeedPosts from "@/hooks/useFeedPosts";
import usePostComposer from "@/hooks/usePostComposer";
import LinkPreview from "@/components/feed/LinkPreview";
import EmptyState from "@/components/feed/EmptyState";
import PostCard from "@/components/feed/PostCard";
import AvatarBadge from "@/components/feed/AvatarBadge";
import { feedStyles } from "./feedStyles";
import { HOLO_THEME } from "@/lib/theme";
import { escudoUrl } from "@/lib/facultades";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: app/feed/page.js — el MURO (feed principal)
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: es la página en sí, pero casi sin lógica propia — junta el
// composer (usePostComposer), la lista de posts con reacciones en vivo
// (useFeedPosts) y los estilos de la página (feedStyles.js vía
// useInjectedStyles), y arma el JSX. Toda la lógica pesada vive en los hooks.
//
// PARA QUÉ SIRVE: es la primera pantalla que ve un usuario logueado — el
// "home" de la red social.
//
// CON QUÉ SE CONECTA: hooks/useFeedPosts.js, hooks/usePostComposer.js,
// components/feed/* (PostCard, EmptyState, LinkPreview),
// components/Uploader.js, components/DownloadBar.js. Protegida por
// proxy.js (redirige a /auth si no hay sesión).
// ════════════════════════════════════════════════════════════════════════

export default function FeedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab,  setActiveTab]  = useState("RECIENTES");
  const [dlTrigger,  setDlTrigger]  = useState(0);
  const [dlFilename, setDlFilename] = useState("");

  const { posts, loading, newCount, resetNewCount, removePost, toggleReaction, toggleShare, ownImagen, ownFacultad } =
    useFeedPosts({ activeTab, status, session });

  const {
    postContent, postTitle, setPostTitle,
    postImagen, setPostImagen, clearImagen,
    linkPreview, setLinkPreview,
    publishing, uploaderKey,
    handleContentChange, handlePublish,
  } = usePostComposer();

  useInjectedStyles("feed-styles", feedStyles);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth");
  }, [status, router]);

  if (status === "loading") return null;

  return (
    <>
      <Navbar />
      <BgCross />
      <div className="feed-page">

      {/* Recuadro de tu perfil — EXACTAMENTE el mismo AvatarMenu y tamaño (165)
          que la columna izquierda de /perfil, sticky. */}
      <div className="feed-sidebar">
        <AvatarMenu currentAvatar={ownImagen} canEdit={false} size={165} onViewClick={() => router.push("/perfil")} escudoUrl={escudoUrl(ownFacultad)} />
      </div>

      <div className="feed-wrap">

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontFamily:"'Cinzel',serif", fontSize:16, color:HOLO_THEME.text, letterSpacing:".2em" }}>MURO · {activeTab}</div>
          <div style={{ display:"flex", gap:20, fontSize:12, fontFamily:"'Inter',sans-serif" }}>
            {["RECIENTES", "TRENDING", "SIGUIENDO"].map(t => (
              <span key={t} onClick={() => setActiveTab(t)} className={`feed-tab${activeTab === t ? " active" : ""}`}>{t}</span>
            ))}
          </div>
        </div>

        {activeTab === "TRENDING" ? (
          /* TRENDING es solo lectura — nada de escribir un post acá (no
             aplica: es un ranking del día, no un lugar de publicar). El
             composer se reemplaza por esta etiqueta informativa. */
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"13px 16px", marginBottom:28, background:HOLO_THEME.panel, borderRadius:10, border:`1px solid ${HOLO_THEME.hairlineSoft}` }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={HOLO_THEME.textDim} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
              <path d="M3 17l6-6 4 4 8-8" /><path d="M15 6h6v6" />
            </svg>
            <span style={{ fontSize:12, color:HOLO_THEME.textDim, fontFamily:"'Inter',sans-serif", letterSpacing:".02em" }}>
              Las publicaciones más populares del día
            </span>
          </div>
        ) : (
          <div style={{ padding:16, marginBottom:28, background:HOLO_THEME.panel, borderRadius:10, border:`1px solid ${HOLO_THEME.hairlineSoft}` }}>
            <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
              {/* Se agranda y se empuja hacia la esquina superior-izquierda del
                  recuadro (padding 16px), con un colchón de 10px para que el
                  escudo que sobresale del avatar (ver AvatarBadge.js) no se
                  pase del borde del recuadro. */}
              <AvatarBadge imagen={ownImagen} size={53} escudoUrl={escudoUrl(ownFacultad)} style={{ marginTop:-6, marginLeft:-6 }} />
              <div style={{ flex:1 }}>
                <input className="post-title-input" placeholder="Título (opcional)" value={postTitle} onChange={e => setPostTitle(e.target.value)} />
                <textarea className="post-body-input" placeholder="¿Qué está pasando en tu realidad?" value={postContent} onChange={handleContentChange} rows={2} />
                <LinkPreview data={linkPreview} onRemove={() => setLinkPreview(null)} />
                {postImagen && (
                  <div className="imagen-preview">
                    <img src={`${API}${postImagen}`} alt="adjunto" />
                    <div className="imagen-preview-remove" onClick={clearImagen}>✕</div>
                  </div>
                )}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  {!postImagen ? (
                    <Uploader resetKey={uploaderKey} tipo="imagen" compact label="imagen"
                      onSuccess={({ url }) => { setPostImagen(url); setDlFilename(url.split('/').pop()); setDlTrigger(t => t+1); }}
                      onError={msg => console.error(msg)}
                    />
                  ) : <div />}
                  <button className="publish-btn" onClick={handlePublish} disabled={publishing || (!postContent.trim() && !postImagen)}>
                    {publishing ? <span className="spinner" /> : "PUBLICAR"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {newCount > 0 && activeTab === "RECIENTES" && (
          <button className="new-badge" onClick={() => { resetNewCount(); window.scrollTo({ top:0, behavior:"smooth" }); }}>
            ↑ {newCount} nuevo{newCount > 1 ? "s" : ""} post{newCount > 1 ? "s" : ""}
          </button>
        )}

        {loading ? (
          <div style={{ textAlign:"center", padding:"48px 0" }}><span className="spinner" /></div>
        ) : posts.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          posts.map((p, i) => (
            <PostCard
              key={p.id || i}
              post={p}
              currentUserId={session?.user?.dbId}
              onDelete={removePost}
              onReact={toggleReaction}
              onShare={toggleShare}
              hideComments={activeTab === "TRENDING"}
            />
          ))
        )}
      </div>

      </div>

      <DownloadBar filename={dlFilename} trigger={dlTrigger} />
    </>
  );
}

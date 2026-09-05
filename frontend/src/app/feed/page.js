"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Uploader from "@/components/Uploader";
import DownloadBar from "@/components/DownloadBar";
import BgCross from "@/components/BgCross";
import { API, avatarSrc } from "@/lib/api";
import useInjectedStyles from "@/hooks/useInjectedStyles";
import useFeedPosts from "@/hooks/useFeedPosts";
import usePostComposer from "@/hooks/usePostComposer";
import LinkPreview from "@/components/feed/LinkPreview";
import EmptyState from "@/components/feed/EmptyState";
import PostCard from "@/components/feed/PostCard";
import { feedStyles } from "./feedStyles";
import { FEED_HOLO } from "@/lib/theme";

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

  const { posts, loading, newCount, resetNewCount, removePost, toggleReaction, ownImagen } =
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
      <div className="feed-wrap">

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, borderBottom:`1px solid ${FEED_HOLO.hairlineSoft}`, paddingBottom:14 }}>
          <div style={{ fontFamily:"'Cinzel',serif", fontSize:16, color:FEED_HOLO.text, letterSpacing:".2em" }}>† MURO · {activeTab}</div>
          <div style={{ display:"flex", gap:20, fontSize:12, fontFamily:"'Inter',sans-serif" }}>
            {["RECIENTES", "TRENDING", "SIGUIENDO"].map(t => (
              <span key={t} onClick={() => setActiveTab(t)} className={`feed-tab${activeTab === t ? " active" : ""}`}>{t}</span>
            ))}
          </div>
        </div>

        <div style={{ padding:16, marginBottom:28, background:FEED_HOLO.panel, borderRadius:10, border:`1px solid ${FEED_HOLO.hairlineSoft}` }}>
          <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
            <div className="composer-avatar" style={{ width:34, height:34, backgroundImage: avatarSrc(ownImagen) ? `url(${avatarSrc(ownImagen)})` : "none", backgroundSize:"cover", backgroundPosition:"center", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:FEED_HOLO.textDim }}>{!avatarSrc(ownImagen) && "◈"}</div>
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
                  <Uploader resetKey={uploaderKey} tipo="imagen" compact label="+ imagen"
                    onSuccess={({ url }) => { setPostImagen(url); setDlFilename(url.split('/').pop()); setDlTrigger(t => t+1); }}
                    onError={msg => console.error(msg)}
                  />
                ) : <div />}
                <button className="publish-btn" onClick={handlePublish} disabled={publishing || (!postContent.trim() && !postImagen)}>
                  {publishing ? <span className="spinner" /> : "PUBLICAR †"}
                </button>
              </div>
            </div>
          </div>
        </div>

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
            />
          ))
        )}
      </div>

      <DownloadBar filename={dlFilename} trigger={dlTrigger} />
    </>
  );
}

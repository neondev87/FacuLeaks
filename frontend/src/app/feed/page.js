"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Uploader from "@/components/Uploader";
import DownloadBar from "@/components/DownloadBar";
import BgCross from "@/components/BgCross";
import { API } from "@/lib/api";
import useInjectedStyles from "@/hooks/useInjectedStyles";
import useFeedPosts from "@/hooks/useFeedPosts";
import usePostComposer from "@/hooks/usePostComposer";
import LinkPreview from "@/components/feed/LinkPreview";
import EmptyState from "@/components/feed/EmptyState";
import PostCard from "@/components/feed/PostCard";
import { feedStyles } from "./feedStyles";

export default function FeedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const ac = "#ffffff";

  const [activeTab,  setActiveTab]  = useState("RECIENTES");
  const [dlTrigger,  setDlTrigger]  = useState(0);
  const [dlFilename, setDlFilename] = useState("");

  const { posts, loading, newCount, resetNewCount, removePost } =
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

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, borderBottom:`1px solid ${ac}22`, paddingBottom:14 }}>
          <div style={{ fontFamily:"'Cinzel',serif", fontSize:16, color:ac, letterSpacing:".2em" }}>† MURO · {activeTab}</div>
          <div style={{ display:"flex", gap:20, fontSize:12, color:"#444", fontFamily:"'Inter',sans-serif" }}>
            {["RECIENTES", "TRENDING", "SIGUIENDO"].map(t => (
              <span key={t} onClick={() => setActiveTab(t)}
                style={{ cursor:"pointer", transition:"color .2s", color: activeTab === t ? "#fff" : "#444", fontWeight: activeTab === t ? 500 : 400 }}
                onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                onMouseLeave={e => e.currentTarget.style.color = activeTab === t ? "#fff" : "#444"}
              >{t}</span>
            ))}
          </div>
        </div>

        <div style={{ border:`1px solid ${ac}18`, padding:16, marginBottom:28, background:`${ac}03` }}>
          <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
            <div style={{ width:34, height:34, background:"#0a0a0a", border:`1px solid ${ac}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:`${ac}44`, flexShrink:0 }}>◈</div>
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
              accent={ac}
              currentUserId={session?.user?.dbId}
              onDelete={removePost}
            />
          ))
        )}
      </div>

      <DownloadBar filename={dlFilename} trigger={dlTrigger} />
    </>
  );
}

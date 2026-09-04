"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API } from "@/lib/api";
import Lightbox from "@/components/Lightbox";
import { REACTIONS } from "./reactions";
import TrashIcon from "./TrashIcon";

// ── POST CARD ──
export default function PostCard({ post, currentUserId, onDelete, onReact, accent = "#ffffff" }) {
  const [lightbox, setLightbox] = useState(false);
  const [removing, setRemoving] = useState(false);
  const router = useRouter();
  const ac = accent;

  const username = post.autor?.username || post.user || "unknown";
  const tiempo   = post.creadoEn
    ? new Date(post.creadoEn).toLocaleString("es-MX", { hour:"2-digit", minute:"2-digit", month:"short", day:"numeric" })
    : "";
  const titulo   = post.titulo || post.title || "";
  const cuerpo   = post.contenido || post.body || "";
  const likes    = post.totalLikes ?? post._count?.post_likes ?? 0;
  const dislikes = post.totalDislikes ?? 0;
  const comments = post.totalComentarios ?? post._count?.comments ?? 0;
  const counts   = { LIKE: likes, DISLIKE: dislikes };
  const vistas   = post.totalVistas ?? 0;
  const isOwner  = currentUserId && post.autor?.id === currentUserId;
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  const handleDelete = async () => {
    setRemoving(true);
    try {
      await fetch(`${API}/api/posts/${post.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      // Animación de salida → luego remove
      setTimeout(() => onDelete(post.id), 400);
    } catch {
      setRemoving(false);
    }
  };

  return (
    <>
      {lightbox && post.imagen && <Lightbox src={post.imagen} onClose={() => setLightbox(false)} />}
      <div style={{
        border: "1px solid rgba(255,255,255,.08)", marginBottom: 16,
        transition: "all .4s ease",
        animation: "fadeIn .3s ease",
        opacity: removing ? 0 : 1,
        transform: removing ? "translateY(-8px) scale(.98)" : "none",
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,.18)"}
        onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,.08)"}
      >
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", borderBottom:"1px solid rgba(255,255,255,.04)" }}>
          <div style={{ display:"flex", gap:10, alignItems:"center", cursor: post.autor?.id ? "pointer" : "default" }}
            onClick={() => post.autor?.id && router.push(`/perfil/${post.autor.id}`)}>
            <div style={{ width:30, height:30, background:"#0a0a0a", border:`1px solid ${ac}33`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:`${ac}55`, transition:"border-color .2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = `${ac}88`}
              onMouseLeave={e => e.currentTarget.style.borderColor = `${ac}33`}>◈</div>
            <div>
              <div style={{ fontSize:13, color:"#e8e4d9", fontFamily:"'Inter',sans-serif", fontWeight:500, transition:"color .15s" }}
                onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                onMouseLeave={e => e.currentTarget.style.color = "#e8e4d9"}>{username}</div>
              <div style={{ fontSize:11, color:"#444", fontFamily:"'Inter',sans-serif" }}>{tiempo}</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ fontSize:11, color:`${ac}55`, fontFamily:"'Inter',sans-serif" }}>
              {post.privacidad === "PUBLICA" ? "#público" : post.privacidad === "AMIGOS" ? "#amigos" : "#privado"}
            </div>
            {isOwner && <TrashIcon onDelete={handleDelete} />}
          </div>
        </div>

        {/* Imagen */}
        {post.imagen && (
          <div onClick={() => setLightbox(true)} style={{ borderBottom:"1px solid rgba(255,255,255,.04)", background:"#050505", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", maxHeight:480, overflow:"hidden" }}>
            <img src={`${API}${post.imagen}`} alt="post" style={{ width:"100%", maxHeight:480, objectFit:"contain", display:"block" }} />
          </div>
        )}

        {/* Contenido */}
        <div style={{ padding:"12px 14px" }}>
          {titulo && <div style={{ fontFamily:"'Inter',sans-serif", fontWeight:600, fontSize:15, color:"#e8e4d9", marginBottom:6, lineHeight:1.4 }}>{titulo}</div>}
          <div style={{ fontSize:13, color:"rgba(232,228,217,.6)", lineHeight:1.75, whiteSpace:"pre-wrap", fontFamily:"'Inter',sans-serif" }}>
            {cuerpo.split(urlRegex).map((part, i) =>
              urlRegex.test(part)
                ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color:"rgba(255,255,255,.55)", textDecoration:"underline", textUnderlineOffset:3 }}>{part}</a>
                : part
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:"8px 14px", borderTop:"1px solid rgba(255,255,255,.04)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", gap:4, alignItems:"center" }}>
            {REACTIONS.map(({ key, Icon }) => (
              <Icon
                key={key}
                active={post.myReaction === key}
                count={counts[key] ?? 0}
                onToggle={() => onReact?.(post.id, key)}
              />
            ))}
            <span style={{ cursor:"pointer", letterSpacing:".1em", color:`${ac}66`, fontSize:11, marginLeft:8, fontFamily:"'Space Mono',monospace" }}>† {comments} replies</span>
          </div>
          <span style={{ color:"rgba(255,255,255,.2)", fontSize:11, fontFamily:"'Inter',sans-serif" }}>{vistas}v</span>
        </div>
      </div>
    </>
  );
}

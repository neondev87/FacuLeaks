"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { API } from "@/lib/api";
import { HOLO_THEME } from "@/lib/theme";
import Lightbox from "@/components/Lightbox";
import { REACTIONS } from "./reactions";
import PostComments from "./PostComments";
import TrashIcon from "./TrashIcon";
import ShareIcon from "./ShareIcon";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: components/feed/PostCard.js — la tarjeta de un post en el MURO
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: dibuja un post del feed completo — autor, imagen, texto (con
// links detectados y convertidos en <a>), reacciones, y el hilo de
// comentarios desplegable. El borrado tiene una animación de salida antes
// de sacarlo de la lista.
//
// PARA QUÉ SIRVE: es LA tarjeta de post del muro. Ojo: hay OTRA tarjeta de
// post distinta, components/PostCard.js (sin carpeta feed/), que se usa en
// el perfil — son dos diseños separados a propósito (deuda técnica conocida,
// pendiente de unificar), pero las dos comparten el mismo hook de
// comentarios (hooks/usePostComments.js).
//
// CON QUÉ SE CONECTA:
//   - backend: DELETE /api/posts/:id (borrar, directo desde acá).
//   - components/feed/reactions.js → qué botones de reacción dibujar.
//   - components/feed/PostComments.js → el hilo de comentarios.
//   - Recibe `onReact` y `onDelete` de su padre — no le habla directo al
//     backend para reaccionar ni conoce el estado global, eso lo maneja
//     hooks/useFeedPosts.js en app/feed/page.js.
// ════════════════════════════════════════════════════════════════════════
export default function PostCard({ post, currentUserId, onDelete, onReact, onShare }) {
  const [lightbox, setLightbox] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const router = useRouter();

  const username = post.autor?.username || post.user || "unknown";
  const tiempo   = post.creadoEn
    ? new Date(post.creadoEn).toLocaleString("es-MX", { hour:"2-digit", minute:"2-digit", month:"short", day:"numeric" })
    : "";
  const titulo   = post.titulo || post.title || "";
  const cuerpo   = post.contenido || post.body || "";
  const likes    = post.totalLikes ?? post._count?.post_likes ?? 0;
  const dislikes = post.totalDislikes ?? 0;
  const comments = post.totalComentarios ?? post._count?.comments ?? 0;
  const compartidos = post.totalCompartidos ?? 0;
  const esPublico = post.privacidad === "PUBLICA";
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
        marginBottom: 16, borderRadius:10,
        border: `1px solid ${HOLO_THEME.hairlineSoft}`,
        transition: "all .4s ease",
        animation: "fadeIn .3s ease",
        opacity: removing ? 0 : 1,
        transform: removing ? "translateY(-8px) scale(.98)" : "none",
        background: HOLO_THEME.panel,
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = HOLO_THEME.hairline}
        onMouseLeave={e => e.currentTarget.style.borderColor = HOLO_THEME.hairlineSoft}
      >
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 18px", borderBottom:`1px solid ${HOLO_THEME.hairlineSoft}` }}>
          <div style={{ display:"flex", gap:10, alignItems:"center", cursor: post.autor?.id ? "pointer" : "default" }}
            onClick={() => post.autor?.id && router.push(`/perfil/${post.autor.id}`)}>
            <div style={{ width:30, height:30, borderRadius:"50%", backgroundColor:"#1c1c24", backgroundImage: post.autor?.imagen ? `url(${post.autor.imagen.startsWith("http") ? post.autor.imagen : `${API}${post.autor.imagen}`})` : "none", backgroundSize:"cover", backgroundPosition:"center", border:`1px solid ${HOLO_THEME.hairline}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:HOLO_THEME.textDim, transition:"border-color .2s", flexShrink:0 }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,.4)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = HOLO_THEME.hairline}>{!post.autor?.imagen && "◈"}</div>
            <div>
              <div style={{ fontSize:13, color:HOLO_THEME.text, fontFamily:"'Cinzel',serif", fontWeight:600, transition:"color .15s" }}
                onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                onMouseLeave={e => e.currentTarget.style.color = HOLO_THEME.text}>{username}</div>
              <div style={{ fontSize:11, color:HOLO_THEME.textDim, fontFamily:"'Space Mono',monospace" }}>{tiempo}</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ fontSize:11, color:HOLO_THEME.textDim, fontFamily:"'Inter',sans-serif" }}>
              {post.privacidad === "PUBLICA" ? "#público" : post.privacidad === "AMIGOS" ? "#amigos" : "#privado"}
            </div>
            {isOwner && <TrashIcon onDelete={handleDelete} />}
          </div>
        </div>

        {/* Imagen */}
        {post.imagen && (
          <div onClick={() => setLightbox(true)} style={{ borderBottom:`1px solid ${HOLO_THEME.hairlineSoft}`, background:"#0a0a0d", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", maxHeight:"85vh", overflow:"hidden" }}>
            <img src={`${API}${post.imagen}`} alt="post" style={{ width:"100%", maxHeight:"85vh", objectFit:"contain", display:"block" }} />
          </div>
        )}

        {/* Contenido */}
        <div style={{ padding:"18px 20px" }}>
          {titulo && <div style={{ fontFamily:"'Inter',sans-serif", fontWeight:600, fontSize:15, color:HOLO_THEME.text, marginBottom:6, lineHeight:1.4 }}>{titulo}</div>}
          <div style={{ fontSize:13, color:"rgba(242,240,248,.65)", lineHeight:1.75, whiteSpace:"pre-wrap", fontFamily:"'Inter',sans-serif" }}>
            {cuerpo.split(urlRegex).map((part, i) =>
              urlRegex.test(part)
                ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color:"rgba(159,224,255,.85)", textDecoration:"underline", textUnderlineOffset:3 }}>{part}</a>
                : part
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:"12px 18px", borderTop:`1px solid ${HOLO_THEME.hairlineSoft}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", gap:4, alignItems:"center" }}>
            {REACTIONS.map(({ key, Icon }) => (
              <Icon
                key={key}
                active={post.myReaction === key}
                count={counts[key] ?? 0}
                onToggle={() => onReact?.(post.id, key)}
              />
            ))}
            {esPublico && (
              <ShareIcon
                active={!!post.myShared}
                count={compartidos}
                onToggle={() => onShare?.(post.id)}
              />
            )}
          </div>
          <span style={{ color:"rgba(242,240,248,.3)", fontSize:11, fontFamily:"'Inter',sans-serif" }}>{vistas}v</span>
        </div>

        {/* Vista previa: primeros 2 comentarios, siempre visibles (no hace falta
            desplegar el hilo). Se oculta si el hilo completo ya está abierto,
            para no mostrar los mismos dos comentarios dos veces. */}
        {!showComments && post.previewComments?.length > 0 && (
          <div style={{ padding:"10px 18px", borderTop:`1px solid ${HOLO_THEME.hairlineSoft}`, display:"flex", flexDirection:"column", gap:8 }}>
            {post.previewComments.map((c, i) => (
              <div key={c.id} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                <div style={{ width:20, height:20, borderRadius:"50%", flexShrink:0, backgroundColor:"#1c1c24", backgroundImage: c.autor?.imagen ? `url(${c.autor.imagen.startsWith("http") ? c.autor.imagen : `${API}${c.autor.imagen}`})` : "none", backgroundSize:"cover", backgroundPosition:"center", border:`1px solid ${HOLO_THEME.hairline}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:7, color:HOLO_THEME.textDim }}>{!c.autor?.imagen && "◈"}</div>
                <div style={{ flex:1, minWidth:0, fontSize:12, lineHeight:1.5, fontFamily:"'Inter',sans-serif", color:"rgba(242,240,248,.65)", maxHeight: i === 1 ? "4.5em" : "none", overflowY: i === 1 ? "auto" : "visible", paddingRight: i === 1 ? 4 : 0 }}>
                  <span style={{ color:HOLO_THEME.text, fontWeight:500 }}>{c.autor?.username || "unknown"}</span>{" "}
                  {c.contenido}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Barrita: click para desplegar el hilo de comentarios con animación */}
        <div
          onClick={() => setShowComments(v => !v)}
          style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"6px 14px", borderTop:`1px solid ${HOLO_THEME.hairlineSoft}`, cursor:"pointer", transition:"background .15s" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.03)"}
          onMouseLeave={e => e.currentTarget.style.background = "none"}
        >
          <span style={{ fontSize:11, letterSpacing:".1em", color: showComments ? HOLO_THEME.text : HOLO_THEME.textDim, fontFamily:"'Space Mono',monospace" }}>
            † {comments} comentario{comments === 1 ? "" : "s"}
          </span>
          <motion.span
            animate={{ rotate: showComments ? 180 : 0 }}
            transition={{ duration: .25, ease: "easeOut" }}
            style={{ fontSize:10, color: showComments ? HOLO_THEME.text : HOLO_THEME.textDim, display:"inline-block" }}
          >▾</motion.span>
        </div>

        <AnimatePresence initial={false}>
          {showComments && (
            <motion.div
              key="comments"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: .3, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
            >
              <PostComments postId={post.id} currentUserId={currentUserId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

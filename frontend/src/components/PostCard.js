'use client';
// ════════════════════════════════════════════════════════════════════════
// MÓDULO: components/PostCard.js — tarjeta de post (diseño PERFIL)
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: dibuja un post en la sección "Posts" del perfil (propio o
// ajeno) — autor, título, contenido, imagen, y comentarios desplegables.
// Tiene su propio botón de borrar con animación (TrashBtn, definido en este
// mismo archivo) para los posts que sí podés borrar (`canDelete`).
//
// PARA QUÉ SIRVE / OJO IMPORTANTE: este es un diseño de tarjeta DISTINTO al
// del muro (components/feed/PostCard.js) — deuda técnica conocida, pendiente
// de unificar en algún momento. Las dos comparten la misma lógica de
// comentarios (hooks/usePostComments.js), pero el diseño visual es
// independiente. Si agregás una funcionalidad nueva a los posts (por
// ejemplo reacciones), hoy hay que agregarla en LAS DOS tarjetas.
//
// CON QUÉ SE CONECTA:
//   - hooks/usePostComments.js → comentarios (recibe `viewerId`, el id de
//     quien está mirando, NO `currentUser` — ese es el dueño del perfil
//     cuando el perfil es ajeno, son cosas distintas a propósito).
//   - Lo consume: app/perfil/page.js y app/perfil/[id]/page.js.
// ════════════════════════════════════════════════════════════════════════
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import usePostComments from '@/hooks/usePostComments';
import { API } from '@/lib/api';
import { HOLO_THEME } from '@/lib/theme';
import { REACTIONS } from '@/components/feed/reactions';
import TrashGlyph from '@/components/TrashGlyph';

// Botón de borrar (post del perfil) — misma animación de tres fases y el
// mismo ícono de papelera (components/TrashGlyph.js) que el resto de la app.
function TrashBtn({ onDelete }) {
  const [phase, setPhase] = useState("idle");
  const [busy,  setBusy]  = useState(false);
  const ref = useRef();
  const handleClick = async () => {
    if (busy) return;
    setPhase("open");
    ref.current = setTimeout(() => {
      setPhase("shrink");
      setTimeout(async () => { setPhase("gone"); setBusy(true); await onDelete(); }, 300);
    }, 320);
  };
  useEffect(() => () => clearTimeout(ref.current), []);
  return (
    <button onClick={handleClick} disabled={busy} title="Eliminar"
      style={{ background:"none", border:"none", cursor: busy ? "default" : "pointer", padding:5, borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center", opacity: busy ? .3 : 1, outline:"none", color: phase === "idle" ? "rgba(242,240,248,.35)" : "rgba(255,90,90,.95)", transition:"background .15s, color .15s" }}
      onMouseEnter={e => { if (!busy) { e.currentTarget.style.background = "rgba(255,90,90,.08)"; e.currentTarget.style.color = "rgba(255,90,90,.9)"; } }}
      onMouseLeave={e => { e.currentTarget.style.background = "none"; if (phase === "idle") e.currentTarget.style.color = "rgba(242,240,248,.35)"; }}>
      <div style={{
        transition: phase === "shrink" ? "transform .3s cubic-bezier(.4,0,.6,1), opacity .3s ease" : "transform .18s ease",
        transform: phase === "shrink" ? "scale(.05) perspective(200px) translateZ(-80px)" : phase === "open" ? "scale(1.18) rotate(-8deg)" : "scale(1)",
        opacity: phase === "gone" ? 0 : 1,
      }}>
        <TrashGlyph size={15} />
      </div>
    </button>
  );
}

// ── Componente PostCard ──
export default function PostCard({ post, currentUser, viewerId, canDelete = false, onDelete, onImageClick, onReact }) {
  // viewerId = id del usuario logueado (para "es mío"). En el perfil público
  // `currentUser` es el DUEÑO del perfil, no el que mira — por eso va aparte.
  const uid = viewerId ?? currentUser?.id;
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const commentRef = useRef(null);
  const { comments, add, remove } = usePostComments(post.id, showComments);
  const totalComs = post.totalComentarios ?? comments.length ?? 0;
  // Si no hay comentarios, la barra es solo un trigger para escribir uno
  // (sin cuenta ni chevron ni animación de altura, que ahí no revela nada).
  const comsHasMore = totalComs > 0;

  // Autocrecimiento: el textarea arranca en 1 línea y crece con lo que se
  // escribe (hasta un tope), en vez de scrollear el texto de costado.
  const autoGrowComment = el => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const handleComment = async () => {
    const ok = await add(commentText);
    if (ok) { setCommentText(""); autoGrowComment(commentRef.current); }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'ahora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString("es-MX", { month: "short", day: "numeric" });
  };

  // Cuerpo del hilo de comentarios (lista + input). Se monta con animación de
  // altura si hay comentarios, o directo (sin animación) si no hay.
  const commentsBody = (
    <div style={{ marginTop: 12 }}>
      {comments.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
          {comments.map(comment => {
            const autor = comment.autor || comment.users || {};
            const avatar = autor.imagen;
            const mine = uid != null && Number(autor.id) === Number(uid);
            return (
              <div key={comment.id} style={{ display: "flex", gap: 8, fontSize: 13 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,.1)",
                  backgroundImage: avatar ? `url(${avatar.startsWith('http') ? avatar : `${API}${avatar}`})` : "none",
                  backgroundSize: "cover", backgroundPosition: "center",
                  flexShrink: 0, border: "1px solid rgba(255,255,255,.08)"
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 12, padding: "8px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,.8)" }}>
                        {autor.username || "unknown"}
                      </span>
                      {mine && (
                        <button
                          onClick={() => remove(comment.id)}
                          title="Eliminar comentario"
                          style={{ marginLeft: "auto", background: "none", border: "none", padding: 2, cursor: "pointer", color: "rgba(255,255,255,.25)", display: "flex", transition: "color .15s" }}
                          onMouseEnter={e => e.currentTarget.style.color = "rgba(255,90,90,.85)"}
                          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.25)"}
                        ><TrashGlyph size={13} /></button>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: "rgba(232,228,217,.7)", lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word", overflowWrap: "anywhere" }}>
                      {comment.contenido}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.25)", marginTop: 4, marginLeft: 12 }}>
                    {formatDate(comment.creadoEn)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          backgroundColor: "rgba(255,255,255,.1)",
          backgroundImage: currentUser.imagen ? `url(${currentUser.imagen.startsWith('http') ? currentUser.imagen : `${API}${currentUser.imagen}`})` : "none",
          backgroundSize: "cover", backgroundPosition: "center",
          flexShrink: 0, border: "1px solid rgba(255,255,255,.08)"
        }} />
        <div style={{ flex: 1, display: "flex", gap: 8, alignItems: "flex-end" }}>
          <textarea
            ref={commentRef}
            value={commentText}
            onChange={e => { setCommentText(e.target.value); autoGrowComment(e.target); }}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleComment(); } }}
            placeholder="Escribe un comentario..."
            rows={1}
            style={{
              flex: 1, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)",
              borderRadius: 18, padding: "8px 14px", fontSize: 13, color: "rgba(255,255,255,.85)",
              fontFamily: "'Inter',sans-serif", outline: "none", resize: "none",
              overflowY: "auto", maxHeight: 120, lineHeight: 1.5, transition: "all .15s"
            }}
            onFocus={e => { e.target.style.background = "rgba(255,255,255,.07)"; e.target.style.borderColor = "rgba(255,255,255,.15)"; }}
            onBlur={e => { e.target.style.background = "rgba(255,255,255,.05)"; e.target.style.borderColor = "rgba(255,255,255,.08)"; }}
          />
          {commentText.trim() && (
            <button
              onClick={handleComment}
              style={{
                background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.2)",
                borderRadius: 18, padding: "8px 16px", fontSize: 12, fontWeight: 500,
                color: "rgba(255,255,255,.9)", cursor: "pointer", fontFamily: "'Inter',sans-serif", transition: "all .15s"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.18)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.12)"}
            >
              Comentar
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      background: HOLO_THEME.panel,
      border: `1px solid ${HOLO_THEME.hairlineSoft}`,
      borderRadius: 10,
      padding: 24,
      marginBottom: 14,
      fontFamily: "'Inter',sans-serif"
    }}>

      {/* Compartido: post ajeno que quedó fijado en ESTE perfil (nunca en el muro) */}
      {post.isShared && (
        <div style={{ fontSize: 11, color: HOLO_THEME.textDim, fontFamily: "'Space Mono',monospace", letterSpacing: ".05em", marginBottom: 10 }}>
          ↻ {currentUser?.username || currentUser?.nombre} compartió esto
        </div>
      )}

      {/* Header del post */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* Avatar */}
          <div style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            backgroundColor: "#1c1c24",
            backgroundImage: post.autor?.imagen
              ? `url(${post.autor.imagen.startsWith('http') ? post.autor.imagen : `${API}${post.autor.imagen}`})`
              : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
            border: `1px solid ${HOLO_THEME.hairline}`
          }} />

          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: HOLO_THEME.text, fontFamily: "'Cinzel',serif" }}>
              {post.autor?.nombre || post.autor?.username || currentUser.username}
            </div>
            <div style={{ fontSize: 11, color: HOLO_THEME.textDim, fontFamily: "'Space Mono',monospace" }}>
              {formatDate(post.creadoEn)}
            </div>
          </div>
        </div>

        {/* Botón eliminar (solo si canDelete) */}
        {canDelete && onDelete && (
          <TrashBtn onDelete={onDelete} />
        )}
      </div>

      {/* Título (opcional) */}
      {post.titulo && (
        <div style={{
          fontSize: 15,
          fontWeight: 600,
          color: HOLO_THEME.text,
          marginBottom: 8,
          lineHeight: 1.4
        }}>
          {post.titulo}
        </div>
      )}

      {/* Contenido */}
      {post.contenido && (
        <div style={{
          fontSize: 14,
          color: "rgba(242,240,248,.7)",
          lineHeight: 1.7,
          marginBottom: post.imagen ? 14 : 0,
          whiteSpace: "pre-wrap"
        }}>
          {post.contenido}
        </div>
      )}

      {/* Imagen — sin límite chico de alto: se muestra grande, solo se
          achica si de verdad no entra en la pantalla del usuario. */}
      {post.imagen && (
        <div
          onClick={() => onImageClick && onImageClick(post.imagen)}
          style={{
            marginTop: 14,
            borderRadius: 8,
            overflow: "hidden",
            cursor: onImageClick ? "pointer" : "default",
            border: `1px solid ${HOLO_THEME.hairlineSoft}`
          }}
        >
          <img
            src={post.imagen.startsWith("http") ? post.imagen : `${API}${post.imagen}`}
            alt=""
            style={{
              width: "100%",
              maxHeight: "85vh",
              objectFit: "contain",
              background: HOLO_THEME.bg,
              display: "block"
            }}
          />
        </div>
      )}

      {/* Separador */}
      <div style={{
        height: 1,
        background: HOLO_THEME.hairlineSoft,
        margin: "14px 0"
      }} />

      {/* Reacciones (LIKE/DISLIKE) — mismos íconos y mismo endpoint que el muro */}
      <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:8 }}>
        {REACTIONS.map(({ key, Icon }) => (
          <Icon
            key={key}
            active={post.myReaction === key}
            count={key === "LIKE" ? (post.totalLikes ?? 0) : (post.totalDislikes ?? 0)}
            onToggle={() => onReact?.(post.id, key)}
          />
        ))}
      </div>

      {/* Barrita de comentarios: con comentarios → cuenta + chevron + hilo
          animado; sin comentarios → trigger quieto para escribir uno. */}
      <div
        onClick={() => setShowComments(v => !v)}
        style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"6px 0", cursor:"pointer", transition:"background .15s", borderRadius:6 }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.03)"}
        onMouseLeave={e => e.currentTarget.style.background = "none"}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={showComments ? "rgba(255,255,255,.7)" : "rgba(255,255,255,.4)"} strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span style={{ fontSize:12, color: showComments ? "rgba(255,255,255,.7)" : "rgba(255,255,255,.4)", fontFamily:"'Inter',sans-serif" }}>
          {comsHasMore
            ? `${showComments ? comments.length : totalComs} comentario${(showComments ? comments.length : totalComs) === 1 ? "" : "s"}`
            : (showComments ? "ocultar" : "comentar")}
        </span>
        {comsHasMore && (
          <motion.span
            animate={{ rotate: showComments ? 180 : 0 }}
            transition={{ duration: .25, ease: "easeOut" }}
            style={{ fontSize:10, color: showComments ? "rgba(255,255,255,.7)" : "rgba(255,255,255,.4)", display:"inline-block" }}
          >▾</motion.span>
        )}
      </div>

      {/* Sección de comentarios. Con comentarios → hilo animado; sin
          comentarios → el mismo cuerpo pero sin animación de altura. */}
      {comsHasMore ? (
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
              {commentsBody}
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        showComments && <div style={{ marginTop: 4 }}>{commentsBody}</div>
      )}
    </div>
  );
}

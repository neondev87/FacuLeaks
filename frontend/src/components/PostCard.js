'use client';
import { useState, useRef, useEffect } from 'react';

const API = "http://localhost:4000";

// ── Pixel Trash (ícono de basura pixel art) ──
const TRASH_LID_C = [[0,0,1,1,1,0,0],[0,1,1,1,1,1,0],[0,0,1,1,1,0,0]];
const TRASH_LID_O = [[0,0,0,1,1,0,0],[0,1,1,1,1,1,0],[0,0,1,1,1,1,0]];
const TRASH_BODY  = [
  [0,1,1,1,1,1,0],
  [0,1,0,1,0,1,0],
  [0,1,0,1,0,1,0],
  [0,1,0,1,0,1,0],
  [0,1,1,1,1,1,0],
];

function PixelTrash({ s = 2, phase = "idle" }) {
  const lid = phase === "open" || phase === "shrink" ? TRASH_LID_O : TRASH_LID_C;
  const col = phase === "idle" ? "rgba(255,255,255,.28)" : phase === "open" ? "rgba(255,80,80,.85)" : "rgba(255,80,80,.5)";
  return (
    <svg width={7*s} height={8*s} viewBox={`0 0 ${7*s} ${8*s}`} style={{ display:"block" }}>
      {lid.map((row, r) => row.map((c, ci) => c ? <rect key={`l${r}${ci}`} x={ci*s} y={r*s} width={s} height={s} fill={col}/> : null))}
      {TRASH_BODY.map((row, r) => row.map((c, ci) => c ? <rect key={`b${r}${ci}`} x={ci*s} y={(r+3)*s} width={s} height={s} fill={col}/> : null))}
    </svg>
  );
}

function TrashBtn({ onDelete, s = 2 }) {
  const [phase, setPhase] = useState("idle");
  const [busy,  setBusy]  = useState(false);
  const ref = useRef();
  const handleClick = async () => {
    if (busy) return;
    setPhase("open");
    ref.current = setTimeout(() => {
      setPhase("shrink");
      setTimeout(async () => { setPhase("gone"); setBusy(true); await onDelete(); }, 300);
    }, 350);
  };
  useEffect(() => () => clearTimeout(ref.current), []);
  return (
    <button onClick={handleClick} disabled={busy} title="Eliminar"
      style={{ background:"none", border:"none", cursor: busy ? "default" : "pointer", padding:"2px 4px", display:"flex", alignItems:"center", opacity: busy ? .3 : 1, outline:"none" }}>
      <div style={{
        transition: phase === "shrink" ? "all .3s cubic-bezier(.4,0,.6,1)" : "none",
        transform: phase === "shrink" ? "scale(.05) perspective(200px) translateZ(-80px)" : phase === "open" ? "scale(1.15)" : "scale(1)",
        opacity: phase === "gone" ? 0 : 1,
        filter: phase === "open" || phase === "shrink" ? "brightness(1.4)" : "none",
      }}>
        <PixelTrash s={s} phase={phase} />
      </div>
    </button>
  );
}

// ── Componente PostCard ──
export default function PostCard({ post, currentUser, canDelete = false, onDelete, onImageClick }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]); // TODO: cargar del backend

  const handleComment = async () => {
    if (!commentText.trim()) return;
    
    // TODO: Enviar al backend POST /api/posts/:postId/comments
    console.log('Comentario:', commentText);
    
    // Placeholder: agregar localmente
    const newComment = {
      id: Date.now(),
      userId: currentUser.id,
      username: currentUser.username,
      avatar: currentUser.imagen,
      contenido: commentText,
      creadoEn: new Date().toISOString()
    };
    
    setComments([...comments, newComment]);
    setCommentText("");
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

  return (
    <div style={{
      background: "#050505",
      border: "1px solid rgba(255,255,255,.07)",
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
      fontFamily: "'Inter',sans-serif"
    }}>
      
      {/* Header del post */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* Avatar */}
          <div style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: post.autor?.imagen 
              ? `url(${post.autor.imagen.startsWith('http') ? post.autor.imagen : `${API}${post.autor.imagen}`})` 
              : "rgba(255,255,255,.1)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            border: "1px solid rgba(255,255,255,.08)"
          }} />
          
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,.85)" }}>
              {post.autor?.nombre || post.autor?.username || currentUser.username}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)" }}>
              {formatDate(post.creadoEn)}
            </div>
          </div>
        </div>

        {/* Botón eliminar (solo si canDelete) */}
        {canDelete && onDelete && (
          <TrashBtn s={2} onDelete={onDelete} />
        )}
      </div>

      {/* Título (opcional) */}
      {post.titulo && (
        <div style={{
          fontSize: 15,
          fontWeight: 500,
          color: "rgba(255,255,255,.9)",
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
          color: "rgba(232,228,217,.75)",
          lineHeight: 1.6,
          marginBottom: post.imagen ? 12 : 0,
          whiteSpace: "pre-wrap"
        }}>
          {post.contenido}
        </div>
      )}

      {/* Imagen */}
      {post.imagen && (
        <div
          onClick={() => onImageClick && onImageClick(post.imagen)}
          style={{
            marginTop: 12,
            borderRadius: 6,
            overflow: "hidden",
            cursor: onImageClick ? "pointer" : "default",
            border: "1px solid rgba(255,255,255,.05)"
          }}
        >
          <img
            src={post.imagen.startsWith("http") ? post.imagen : `${API}${post.imagen}`}
            alt=""
            style={{
              width: "100%",
              maxHeight: 480,
              objectFit: "contain",
              background: "#000",
              display: "block"
            }}
          />
        </div>
      )}

      {/* Separador */}
      <div style={{
        height: 1,
        background: "rgba(255,255,255,.04)",
        margin: "12px 0"
      }} />

      {/* Barra de acciones */}
      <div style={{
        display: "flex",
        gap: 16,
        fontSize: 12,
        color: "rgba(255,255,255,.4)"
      }}>
        {/* Botón comentarios */}
        <button
          onClick={() => setShowComments(!showComments)}
          style={{
            background: "none",
            border: "none",
            color: "rgba(255,255,255,.4)",
            cursor: "pointer",
            fontSize: 12,
            fontFamily: "'Inter',sans-serif",
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 8px",
            borderRadius: 4,
            transition: "all .15s"
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(255,255,255,.05)";
            e.currentTarget.style.color = "rgba(255,255,255,.7)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "none";
            e.currentTarget.style.color = "rgba(255,255,255,.4)";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>{comments.length || 0} comentarios</span>
        </button>
      </div>

      {/* Sección de comentarios */}
      {showComments && (
        <div style={{ marginTop: 12 }}>
          
          {/* Lista de comentarios */}
          {comments.length > 0 && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginBottom: 12
            }}>
              {comments.map(comment => (
                <div key={comment.id} style={{
                  display: "flex",
                  gap: 8,
                  fontSize: 13
                }}>
                  {/* Avatar del comentario */}
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: comment.avatar
                      ? `url(${comment.avatar.startsWith('http') ? comment.avatar : `${API}${comment.avatar}`})`
                      : "rgba(255,255,255,.1)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    flexShrink: 0,
                    border: "1px solid rgba(255,255,255,.08)"
                  }} />

                  {/* Contenido del comentario */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      background: "rgba(255,255,255,.03)",
                      border: "1px solid rgba(255,255,255,.06)",
                      borderRadius: 12,
                      padding: "8px 12px"
                    }}>
                      <div style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: "rgba(255,255,255,.8)",
                        marginBottom: 4
                      }}>
                        {comment.username}
                      </div>
                      <div style={{
                        fontSize: 13,
                        color: "rgba(232,228,217,.7)",
                        lineHeight: 1.5
                      }}>
                        {comment.contenido}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,.25)",
                      marginTop: 4,
                      marginLeft: 12
                    }}>
                      {formatDate(comment.creadoEn)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Input para nuevo comentario */}
          <div style={{
            display: "flex",
            gap: 8,
            alignItems: "flex-start"
          }}>
            {/* Avatar del usuario actual */}
            <div style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: currentUser.imagen
                ? `url(${currentUser.imagen.startsWith('http') ? currentUser.imagen : `${API}${currentUser.imagen}`})`
                : "rgba(255,255,255,.1)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              flexShrink: 0,
              border: "1px solid rgba(255,255,255,.08)"
            }} />

            {/* Input */}
            <div style={{ flex: 1, display: "flex", gap: 8 }}>
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleComment()}
                placeholder="Escribe un comentario..."
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,.05)",
                  border: "1px solid rgba(255,255,255,.08)",
                  borderRadius: 18,
                  padding: "8px 14px",
                  fontSize: 13,
                  color: "rgba(255,255,255,.85)",
                  fontFamily: "'Inter',sans-serif",
                  outline: "none",
                  transition: "all .15s"
                }}
                onFocus={e => {
                  e.target.style.background = "rgba(255,255,255,.07)";
                  e.target.style.borderColor = "rgba(255,255,255,.15)";
                }}
                onBlur={e => {
                  e.target.style.background = "rgba(255,255,255,.05)";
                  e.target.style.borderColor = "rgba(255,255,255,.08)";
                }}
              />
              
              {commentText.trim() && (
                <button
                  onClick={handleComment}
                  style={{
                    background: "rgba(255,255,255,.12)",
                    border: "1px solid rgba(255,255,255,.2)",
                    borderRadius: 18,
                    padding: "8px 16px",
                    fontSize: 12,
                    fontWeight: 500,
                    color: "rgba(255,255,255,.9)",
                    cursor: "pointer",
                    fontFamily: "'Inter',sans-serif",
                    transition: "all .15s"
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
      )}
    </div>
  );
}
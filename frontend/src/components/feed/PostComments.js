"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import usePostComments from "@/hooks/usePostComments";
import { buildCommentTree } from "@/lib/commentTree";
import { HOLO_THEME } from "@/lib/theme";
import TrashGlyph from "@/components/TrashGlyph";
import HeartIcon from "./HeartIcon";
import { displayName } from "@/lib/displayName";
import AvatarBadge from "./AvatarBadge";
import { escudoUrl } from "@/lib/facultades";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: components/feed/PostComments.js — hilo de comentarios (diseño feed)
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: la lista de comentarios de un post + el input para escribir
// uno nuevo. Se monta recién cuando el usuario despliega los replies en
// PostCard.js (no antes — así no se piden comentarios de posts que nadie
// abrió). TODA la lógica de datos (cargar, mandar, borrar, likear, tiempo
// real) vive en el hook — este archivo es solo el dibujo con el estilo
// visual del feed (hairlines, Space Mono). La cruz gótica que tenía antes
// se sacó (2026-09-10).
//
// RESPUESTAS + LIKES (2026-09-17): cada comentario puede tener
// "sub-comentarios" (respuestas a ESE comentario en particular, no al post)
// y puede likearse con contador — mismo HeartIcon pixel-art que ya usan las
// reacciones de post (components/feed/HeartIcon.js), reutilizado acá para
// que se vea como una sola familia visual. El hilo llega FLAT del hook y
// lib/commentTree.js lo arma en árbol acá adentro. Solo un comentario a la
// vez puede tener el cuadro de "responder" abierto (`replyingTo`, estado de
// este componente).
//
// CON QUÉ SE CONECTA:
//   - hooks/usePostComments.js → toda la lógica real (compartida con la
//     otra tarjeta de post, components/PostCard.js, del perfil).
//   - Lo consume: components/feed/PostCard.js.
// ════════════════════════════════════════════════════════════════════════

const fmt = (d) => d
  ? new Date(d).toLocaleString("es-MX", { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })
  : "";

// Un comentario + sus respuestas, recursivo (una respuesta puede tener sus
// propias respuestas, sin límite de profundidad).
function CommentNode({ c, depth, currentUserId, replyingTo, setReplyingTo, onReply, onDelete, onLike, sending }) {
  const router = useRouter();
  const autor = c.autor || c.users || {};
  const mine  = currentUserId != null && Number(autor.id) === Number(currentUserId);
  const isReplying = replyingTo === c.id;
  const [replyText, setReplyText] = useState("");
  const replyRef = useRef(null);

  const goToAutor = autor.id ? () => router.push(`/perfil/${autor.id}`) : undefined;

  const submitReply = async () => {
    const ok = await onReply(replyText, c.id);
    if (ok) { setReplyText(""); setReplyingTo(null); }
  };

  return (
    <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
      <AvatarBadge imagen={autor.imagen} size={depth === 0 ? 26 : 22} escudoUrl={escudoUrl(autor.facultad)} onClick={goToAutor} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ background:HOLO_THEME.panel, border:`1px solid ${HOLO_THEME.hairlineSoft}`, borderRadius:10, padding:"8px 12px" }}>
          <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:3 }}>
            <span
              onClick={goToAutor}
              style={{ fontSize:12, color:HOLO_THEME.text, fontFamily:"'Inter',sans-serif", fontWeight:500, cursor: autor.id ? "pointer" : "default" }}
              onMouseEnter={e => { if (autor.id) e.currentTarget.style.textDecoration = "underline"; }}
              onMouseLeave={e => { e.currentTarget.style.textDecoration = "none"; }}
            >{displayName(autor) || "unknown"}</span>
            <span style={{ fontSize:10, color:HOLO_THEME.textDim, fontFamily:"'Space Mono',monospace" }}>{fmt(c.creadoEn)}</span>
            {mine && (
              <button onClick={() => onDelete(c.id)} title="Eliminar comentario"
                style={{ marginLeft:"auto", background:"none", border:"none", padding:2, cursor:"pointer", color:HOLO_THEME.textDim, display:"flex", transition:"color .15s" }}
                onMouseEnter={e => e.currentTarget.style.color = "#c0524a"}
                onMouseLeave={e => e.currentTarget.style.color = HOLO_THEME.textDim}><TrashGlyph size={13} /></button>
            )}
          </div>
          <div style={{ fontSize:13, color:"rgba(242,240,248,.65)", lineHeight:1.6, fontFamily:"'Inter',sans-serif", whiteSpace:"pre-wrap", wordBreak:"break-word", overflowWrap:"anywhere" }}>
            {c.contenido}
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:2 }}>
          <HeartIcon active={!!c.myLiked} count={c.totalLikes || 0} onToggle={() => onLike(c.id)} />
          <button onClick={() => { setReplyingTo(isReplying ? null : c.id); setReplyText(""); }}
            style={{ background:"none", border:"none", padding:0, cursor:"pointer", fontSize:11, color: isReplying ? HOLO_THEME.text : HOLO_THEME.textDim, fontFamily:"'Space Mono',monospace", letterSpacing:".04em", transition:"color .15s" }}
            onMouseEnter={e => e.currentTarget.style.color = HOLO_THEME.text}
            onMouseLeave={e => e.currentTarget.style.color = isReplying ? HOLO_THEME.text : HOLO_THEME.textDim}>
            responder
          </button>
        </div>

        {isReplying && (
          <div style={{ display:"flex", gap:8, alignItems:"flex-end", marginTop:6 }}>
            <textarea
              ref={replyRef}
              className="no-scrollbar"
              autoFocus
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitReply(); } }}
              placeholder={`responder a ${displayName(autor) || "este comentario"}...`}
              maxLength={500}
              rows={1}
              style={{
                flex:1, background:"rgba(255,255,255,.05)", border:`1px solid ${HOLO_THEME.hairline}`,
                borderRadius:14, padding:"6px 12px", fontSize:16, color:HOLO_THEME.text, fontFamily:"'Inter',sans-serif",
                outline:"none", resize:"none", overflowY:"auto", maxHeight:100, lineHeight:1.5, transition:"background .15s, border-color .15s",
              }}
              onFocus={e => { e.target.style.background = "rgba(255,255,255,.07)"; e.target.style.borderColor = "rgba(255,255,255,.2)"; }}
              onBlur={e => { e.target.style.background = "rgba(255,255,255,.05)"; e.target.style.borderColor = HOLO_THEME.hairline; }}
            />
            {replyText.trim() && (
              <button onClick={submitReply} disabled={sending}
                style={{
                  background:"rgba(255,255,255,.12)", border:`1px solid ${HOLO_THEME.hairline}`, borderRadius:14,
                  color:HOLO_THEME.text, fontFamily:"'Inter',sans-serif", fontSize:11, fontWeight:500,
                  padding:"6px 14px", cursor: sending ? "default" : "pointer",
                  transition:"all .15s", opacity: sending ? .5 : 1,
                }}
                onMouseEnter={e => { if (!sending) e.currentTarget.style.background = "rgba(255,255,255,.18)"; }}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.12)"}
              >{sending ? "..." : "responder"}</button>
            )}
          </div>
        )}

        {c.replies?.length > 0 && (
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:10, paddingLeft:14, borderLeft:`1px solid ${HOLO_THEME.hairlineSoft}` }}>
            {c.replies.map(r => (
              <CommentNode key={r.id} c={r} depth={depth + 1} currentUserId={currentUserId}
                replyingTo={replyingTo} setReplyingTo={setReplyingTo}
                onReply={onReply} onDelete={onDelete} onLike={onLike} sending={sending} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// `initialReplyTo`: cuando este hilo se abre porque alguien picó "responder"
// desde la vista previa del muro (sin abrir el hilo antes, ver PostCard.js),
// arranca con el cuadro de respuesta de ESE comentario ya abierto — así no
// hace falta un segundo click para encontrarlo adentro del hilo completo.
//
// `currentUserImagen`: el avatar de quien escribe, al lado del composer
// principal — mismo criterio que components/PostCard.js (perfil), que ya
// lo tenía. Viene de session.user.imagen (ver app/feed/page.js), no hace
// falta pedirlo de nuevo acá.
export default function PostComments({ postId, currentUserId, currentUserImagen, initialReplyTo }) {
  const { comments, loading, sending, add, remove, toggleLike } = usePostComments(postId, true);
  const [text, setText] = useState("");
  const [replyingTo, setReplyingTo] = useState(initialReplyTo ?? null);
  const textareaRef = useRef(null);
  const tree = buildCommentTree(comments);

  // Autocrecimiento: el textarea arranca en 1 línea y crece con lo que se
  // escribe (hasta un tope), en vez de scrollear el texto de costado.
  const autoGrow = el => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const submit = async () => {
    const ok = await add(text);
    if (ok) { setText(""); autoGrow(textareaRef.current); }
  };

  return (
    <div style={{ borderTop:`1px solid ${HOLO_THEME.hairlineSoft}`, padding:"10px 14px", background:"rgba(10,10,13,.4)" }}>

      {loading ? (
        <div style={{ textAlign:"center", padding:"12px 0" }}><span className="spinner" /></div>
      ) : tree.length === 0 ? (
        <div style={{ fontSize:11, color:HOLO_THEME.textDim, fontFamily:"'Space Mono',monospace", letterSpacing:".08em", padding:"4px 0 10px" }}>
          sin comentarios todavía
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:12 }}>
          {tree.map(c => (
            <CommentNode key={c.id} c={c} depth={0} currentUserId={currentUserId}
              replyingTo={replyingTo} setReplyingTo={setReplyingTo}
              onReply={add} onDelete={remove} onLike={toggleLike} sending={sending} />
          ))}
        </div>
      )}

      <div style={{ display:"flex", gap:10, alignItems:"flex-end" }}>
        <AvatarBadge imagen={currentUserImagen} size={28} style={{ marginBottom:1 }} />
        <textarea
          ref={textareaRef}
          className="no-scrollbar"
          value={text}
          onChange={e => { setText(e.target.value); autoGrow(e.target); }}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
          placeholder="escribir un comentario..."
          maxLength={500}
          rows={1}
          style={{
            flex:1, background:"rgba(255,255,255,.05)", border:`1px solid ${HOLO_THEME.hairline}`,
            borderRadius:18, padding:"8px 14px", fontSize:16, color:HOLO_THEME.text, fontFamily:"'Inter',sans-serif",
            outline:"none", resize:"none", overflowY:"auto", maxHeight:120, lineHeight:1.5, transition:"background .15s, border-color .15s",
          }}
          onFocus={e => { e.target.style.background = "rgba(255,255,255,.07)"; e.target.style.borderColor = "rgba(255,255,255,.2)"; }}
          onBlur={e => { e.target.style.background = "rgba(255,255,255,.05)"; e.target.style.borderColor = HOLO_THEME.hairline; }}
        />
        {text.trim() && (
          <button
            onClick={submit}
            disabled={sending}
            style={{
              background:"rgba(255,255,255,.12)", border:`1px solid ${HOLO_THEME.hairline}`, borderRadius:18,
              color:HOLO_THEME.text, fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:500,
              padding:"8px 16px", cursor: sending ? "default" : "pointer",
              transition:"all .15s", opacity: sending ? .5 : 1,
            }}
            onMouseEnter={e => { if (!sending) e.currentTarget.style.background = "rgba(255,255,255,.18)"; }}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.12)"}
          >{sending ? "..." : "comentar"}</button>
        )}
      </div>
    </div>
  );
}

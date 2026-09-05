"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import usePostComments from "@/hooks/usePostComments";
import { API } from "@/lib/api";
import { FEED_MIX } from "@/lib/theme";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: components/feed/PostComments.js — hilo de comentarios (diseño feed)
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: la lista de comentarios de un post + el input para escribir
// uno nuevo. Se monta recién cuando el usuario despliega los replies en
// PostCard.js (no antes — así no se piden comentarios de posts que nadie
// abrió). TODA la lógica de datos (cargar, mandar, borrar, tiempo real) vive
// en el hook — este archivo es solo el dibujo con el estilo visual del feed
// (hairlines, Space Mono, el símbolo †).
//
// CON QUÉ SE CONECTA:
//   - hooks/usePostComments.js → toda la lógica real (compartida con la
//     otra tarjeta de post, components/PostCard.js, del perfil).
//   - Lo consume: components/feed/PostCard.js.
// ════════════════════════════════════════════════════════════════════════
export default function PostComments({ postId, currentUserId }) {
  const router = useRouter();
  const { comments, loading, sending, add, remove } = usePostComments(postId, true);
  const [text, setText] = useState("");

  const submit = async () => {
    const ok = await add(text);
    if (ok) setText("");
  };

  const fmt = (d) => d
    ? new Date(d).toLocaleString("es-MX", { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })
    : "";

  return (
    <div style={{ borderTop:`1px dashed ${FEED_MIX.dashed}`, padding:"10px 14px", background:"rgba(16,11,6,.4)" }}>

      {loading ? (
        <div style={{ textAlign:"center", padding:"12px 0" }}><span className="spinner" /></div>
      ) : comments.length === 0 ? (
        <div style={{ fontSize:11, color:FEED_MIX.textDim, fontFamily:"'Space Mono',monospace", letterSpacing:".08em", padding:"4px 0 10px" }}>
          † sin comentarios todavía
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:12 }}>
          {comments.map(c => {
            const autor = c.autor || c.users || {};
            const mine  = currentUserId != null && Number(autor.id) === Number(currentUserId);
            return (
              <div key={c.id} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                <div
                  onClick={() => autor.id && router.push(`/perfil/${autor.id}`)}
                  style={{ width:24, height:24, borderRadius:4, flexShrink:0, backgroundColor:"#241a10", backgroundImage: autor.imagen ? `url(${autor.imagen.startsWith("http") ? autor.imagen : `${API}${autor.imagen}`})` : "none", backgroundSize:"cover", backgroundPosition:"center", border:`1px solid ${FEED_MIX.hairline}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, color:FEED_MIX.textDim, cursor: autor.id ? "pointer" : "default" }}>{!autor.imagen && "◈"}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
                    <span style={{ fontSize:12, color:FEED_MIX.text, fontFamily:"'Inter',sans-serif", fontWeight:500 }}>{autor.username || "unknown"}</span>
                    <span style={{ fontSize:10, color:FEED_MIX.textDim, fontFamily:"'Space Mono',monospace" }}>{fmt(c.creadoEn)}</span>
                    {mine && (
                      <span onClick={() => remove(c.id)}
                        style={{ marginLeft:"auto", fontSize:10, color:FEED_MIX.textDim, cursor:"pointer", fontFamily:"'Space Mono',monospace", transition:"color .15s" }}
                        onMouseEnter={e => e.currentTarget.style.color = "#c0524a"}
                        onMouseLeave={e => e.currentTarget.style.color = FEED_MIX.textDim}>✕</span>
                    )}
                  </div>
                  <div style={{ fontSize:13, color:"rgba(243,230,200,.65)", lineHeight:1.6, fontFamily:"'Inter',sans-serif", whiteSpace:"pre-wrap", marginTop:2 }}>
                    {c.contenido}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
          placeholder="escribir un comentario..."
          maxLength={500}
          style={{
            flex:1, background:"#100b06", border:`1px solid ${FEED_MIX.hairline}`,
            padding:"7px 10px", fontSize:12, color:FEED_MIX.text, fontFamily:"'Inter',sans-serif",
            outline:"none",
          }}
          onFocus={e => e.target.style.borderColor = "rgba(255,207,159,.5)"}
          onBlur={e => e.target.style.borderColor = FEED_MIX.hairline}
        />
        <button
          onClick={submit}
          disabled={sending || !text.trim()}
          style={{
            background:"none", border:`1px solid ${FEED_MIX.hairline}`, color: text.trim() ? FEED_MIX.text : FEED_MIX.textDim,
            fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:".1em",
            padding:"7px 14px", cursor: sending || !text.trim() ? "default" : "pointer",
            transition:"all .15s", opacity: sending ? .5 : 1,
          }}
          onMouseEnter={e => { if (text.trim()) e.currentTarget.style.borderColor = "rgba(255,207,159,.6)"; }}
          onMouseLeave={e => e.currentTarget.style.borderColor = FEED_MIX.hairline}
        >{sending ? "..." : "† enviar"}</button>
      </div>
    </div>
  );
}

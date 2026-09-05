"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { avatarSrc } from "@/lib/api";
import Navbar from "@/components/Navbar";
import useInjectedStyles from "@/hooks/useInjectedStyles";
import useChat from "@/hooks/useChat";
import useChatSearch from "@/hooks/useChatSearch";
import useAudioRecorder from "@/hooks/useAudioRecorder";
import useChatImage from "@/hooks/useChatImage";
import { BARS } from "@/components/chat/constants";
import StreakC from "@/components/chat/StreakC";
import MicIcon from "@/components/chat/MicIcon";
import IconBtn from "@/components/chat/IconBtn";
import RequestsIcon from "@/components/chat/RequestsIcon";
import Bubble from "@/components/chat/Bubble";
import AudioIndicator from "@/components/chat/AudioIndicator";
import TypingIndicator from "@/components/chat/TypingIndicator";
import AudioReplyPreview from "@/components/chat/AudioReplyPreview";
import { chatStyles } from "./chatStyles";
import { HOLO_THEME } from "@/lib/theme";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: app/chat/page.js — mensajería (chat)
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: es la página que junta TODOS los hooks del chat — useChat (el
// grande: conversaciones, mensajes, socket), useChatSearch (buscar gente),
// useAudioRecorder (grabar audio) y useChatImage (mandar fotos) — y los
// componentes visuales (Bubble para cada mensaje, indicadores de
// escribiendo/grabando, la racha). El archivo en sí es sobre todo el JSX
// que combina todo eso; la lógica real está repartida en los hooks.
//
// CON QUÉ SE CONECTA: hooks/{useChat,useChatSearch,useAudioRecorder,
// useChatImage}.js, components/chat/*. Protegida por proxy.js.
// ════════════════════════════════════════════════════════════════════════

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const fileInputRef   = useRef(null);

  const [showSolicitudes, setShowSolicitudes] = useState(false);

  const search = useChatSearch();
  const chat   = useChat({ session, status, inputRef });
  const rec    = useAudioRecorder({ activeChat: chat.activeChat, socketRef: chat.socketRef, onAudioSent: chat.addMensaje });
  const img    = useChatImage({ activeChat: chat.activeChat, onImageSent: chat.addMensaje });

  useInjectedStyles("chat-styles", chatStyles);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth");
  }, [status, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [chat.mensajes, chat.showTypingIndicator, chat.showAudioIndicator]);

  const handleOpenChat = user => { search.closeSearch(); setShowSolicitudes(false); chat.openChat(user); };
  const totalSolicitudes = chat.solicitudes.reduce((acc, s) => acc + (s.unread || 0), 0) || chat.solicitudes.length;

  if (status === "loading") return null;

  const { activeChat, streak } = chat;

  return (
    <>
      <Navbar />
      <div style={{ display:"flex", height:"calc(100vh - 48px)", marginTop:48 }}>

        <div style={{ width:300, borderRight:`1px solid ${HOLO_THEME.hairlineSoft}`, display:"flex", flexDirection:"column", background:HOLO_THEME.panel, flexShrink:0 }}>
          <div style={{ padding:"20px 22px 18px", borderBottom:`1px solid ${HOLO_THEME.hairlineSoft}`, display:"flex", justifyContent:"space-between", alignItems:"flex-start", position:"relative" }}>
            <div>
              <div style={{ fontFamily:"'Cinzel',serif", fontSize:20, color:HOLO_THEME.text, letterSpacing:".02em" }}>Mensajes</div>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:"rgba(255,255,255,.25)", letterSpacing:".18em", marginTop:4 }}>// FacuLeaks</div>
            </div>

            <RequestsIcon count={totalSolicitudes} active={showSolicitudes} onClick={() => setShowSolicitudes(v => !v)} />

            {/* Panel desplegable de solicitudes de mensaje (gente que no es tu amigo y no le respondiste todavía) */}
            {showSolicitudes && (
              <div style={{ position:"absolute", top:"100%", right:14, marginTop:6, width:260, border:`1px solid ${HOLO_THEME.hairline}`, borderRadius:10, background:HOLO_THEME.panel, boxShadow:"0 8px 24px rgba(0,0,0,.5)", zIndex:10, maxHeight:280, overflowY:"auto" }}>
                <div style={{ fontSize:11, letterSpacing:".14em", color:"rgba(255,255,255,.3)", padding:"10px 14px 6px", fontFamily:"'Space Mono',monospace" }}>SOLICITUDES</div>
                {chat.solicitudes.length === 0 ? (
                  <div style={{ padding:"6px 14px 14px", fontSize:12, color:"rgba(255,255,255,.2)", fontFamily:"'Space Mono',monospace" }}>sin solicitudes pendientes</div>
                ) : chat.solicitudes.map(s => (
                  <div key={s.userId} className="conv-item" onClick={() => handleOpenChat(s)}>
                    <div className="avatar" style={avatarSrc(s.imagen) ? { backgroundImage:`url(${avatarSrc(s.imagen)})`, backgroundSize:"cover", backgroundPosition:"center" } : undefined}>
                      {!avatarSrc(s.imagen) && "◈"}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                        <span style={{ fontSize:14, fontFamily:"'Inter',sans-serif", color:HOLO_THEME.text }}>{s.username}</span>
                        {s.unread > 0 && <span style={{ background:"#cc3344", color:"#fff", fontSize:10, padding:"2px 7px", borderRadius:999, fontFamily:"'Space Mono',monospace", fontWeight:600 }}>{s.unread}</span>}
                      </div>
                      <div style={{ fontSize:12, color:"rgba(255,255,255,.22)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:"'Space Mono',monospace" }}>{s.lastMsg}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dividido en 2 mitades independientes, cada una con su propio scroll — RECIENTES arriba, AMIGOS abajo */}
          <div style={{ flex:1, display:"flex", flexDirection:"column", minHeight:0 }}>

            <div className="conv-half">
              <div style={{ fontSize:11, letterSpacing:".18em", color:"rgba(255,255,255,.22)", padding:"10px 18px 4px", fontFamily:"'Space Mono',monospace" }}>RECIENTES</div>
              {chat.recientes.length > 0 ? chat.recientes.map(c => (
                <div key={c.userId} className={`conv-item${chat.isActive(c.userId) ? " active" : ""}`} onClick={() => handleOpenChat(c)}>
                  <div className="avatar" style={avatarSrc(c.imagen) ? { backgroundImage:`url(${avatarSrc(c.imagen)})`, backgroundSize:"cover", backgroundPosition:"center" } : undefined}>
                    {!avatarSrc(c.imagen) && "◈"}<div className="status-dot" style={{ background: chat.isOnline(c.userId) ? "#3ddc84" : "#2a2a2a" }} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                      <span style={{ fontSize:14, fontFamily:"'Inter',sans-serif", color: chat.isActive(c.userId) ? HOLO_THEME.text : "rgba(255,255,255,.65)" }}>{c.username}</span>
                      {c.unread > 0 && <span style={{ background:HOLO_THEME.text, color:HOLO_THEME.bg, fontSize:10, padding:"2px 7px", borderRadius:999, fontFamily:"'Space Mono',monospace", fontWeight:600 }}>{c.unread}</span>}
                    </div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,.22)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:"'Space Mono',monospace" }}>{c.lastMsg}</div>
                  </div>
                </div>
              )) : (
                <div style={{ padding:"6px 18px", fontSize:12, color:"rgba(255,255,255,.2)", fontFamily:"'Space Mono',monospace" }}>sin conversaciones recientes</div>
              )}
            </div>

            <div className="conv-half" style={{ borderTop:`1px solid ${HOLO_THEME.hairlineSoft}` }}>
              <div style={{ fontSize:11, letterSpacing:".18em", color:"rgba(255,255,255,.22)", padding:"10px 18px 4px", fontFamily:"'Space Mono',monospace" }}>AMIGOS</div>
              {chat.amigos.length > 0 ? chat.amigos.map(a => (
                <div key={a.userId} className={`conv-item${chat.isActive(a.userId) ? " active" : ""}`} onClick={() => handleOpenChat(a)}>
                  <div className="avatar" style={avatarSrc(a.imagen) ? { backgroundImage:`url(${avatarSrc(a.imagen)})`, backgroundSize:"cover", backgroundPosition:"center" } : undefined}>
                    {!avatarSrc(a.imagen) && "◈"}<div className="status-dot" style={{ background: chat.isOnline(a.userId) ? "#3ddc84" : "#2a2a2a" }} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <span style={{ fontSize:14, fontFamily:"'Inter',sans-serif", color: chat.isActive(a.userId) ? HOLO_THEME.text : "rgba(255,255,255,.65)" }}>{a.username}</span>
                  </div>
                </div>
              )) : (
                <div style={{ padding:"6px 18px", fontSize:12, color:"rgba(255,255,255,.2)", fontFamily:"'Space Mono',monospace" }}>
                  sin amigos aún —{" "}
                  <span style={{ color:"rgba(255,255,255,.6)", cursor:"pointer", textDecoration:"underline" }} onClick={() => router.push("/amigos")}>ir a amigos</span>
                </div>
              )}
            </div>

          </div>
        </div>

        {activeChat ? (
          <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, background:HOLO_THEME.bg }}>

            <div style={{ padding:"14px 24px", background:HOLO_THEME.bg, borderBottom:`1px solid ${HOLO_THEME.hairlineSoft}`, display:"flex", alignItems:"center", gap:16 }}>
              <div className="avatar" style={{ width:46, height:46, ...(avatarSrc(activeChat.imagen) ? { backgroundImage:`url(${avatarSrc(activeChat.imagen)})`, backgroundSize:"cover", backgroundPosition:"center" } : {}) }}>
                {!avatarSrc(activeChat.imagen) && "◈"}<div className="status-dot-hdr" style={{ background: chat.isOnline(activeChat.userId) ? "#3ddc84" : "#2a2a2a" }} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'Cinzel',serif", fontSize:20, color:HOLO_THEME.text, lineHeight:1 }}>{activeChat.username}</div>
                <div style={{ fontFamily:"'Space Mono',monospace", fontSize:12, color: chat.isOnline(activeChat.userId) ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.2)", letterSpacing:".08em", marginTop:4 }}>
                  {chat.isOnline(activeChat.userId) ? "en línea ahora" : "desconectado"}
                </div>
              </div>
              {streak.loaded && <StreakC count={streak.count} dying={streak.dying} progress={streak.progress} />}
            </div>

            <div style={{ flex:1, overflowY:"auto", padding:"22px 26px", display:"flex", flexDirection:"column" }}>
              {chat.loading ? (
                <div style={{ textAlign:"center", paddingTop:60 }}><span className="spinner" /></div>
              ) : chat.mensajes.length === 0 ? (
                <div style={{ textAlign:"center", padding:"80px 0", color:"rgba(255,255,255,.18)" }}>
                  <div style={{ fontFamily:"'Cinzel',serif", fontSize:24, marginBottom:10 }}>{activeChat.username}</div>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:13, letterSpacing:".1em" }}>inicio de la conversación</div>
                </div>
              ) : (
                chat.mensajes.map((msg, i) => {
                  const esPropio = msg.emisorId === parseInt(session?.user?.dbId) || msg.emisor?.id === parseInt(session?.user?.dbId);
                  const prevMsg  = chat.mensajes[i - 1];
                  const showDate = !prevMsg || chat.formatDate(msg.creadoEn) !== chat.formatDate(prevMsg.creadoEn);
                  const prevSame = prevMsg && prevMsg.emisorId === msg.emisorId && (new Date(msg.creadoEn) - new Date(prevMsg.creadoEn)) < 60000;
                  const replyMsg = msg.replyToId ? chat.mensajes.find(m => m.id === msg.replyToId) || null : null;
                  return (
                    <div key={msg.id || i} style={{ marginBottom: prevSame ? 3 : 14 }}>
                      {showDate && <div className="date-pill"><span>{chat.formatDate(msg.creadoEn)}</span></div>}
                      <div style={{ display:"flex", gap:10, flexDirection: esPropio ? "row-reverse" : "row", alignItems:"flex-end" }}>
                        <div style={{ width:36, flexShrink:0 }}>
                          {!prevSame ? (
                            <div className="avatar-sm" style={avatarSrc(esPropio ? chat.ownImagen : activeChat.imagen) ? { backgroundImage:`url(${avatarSrc(esPropio ? chat.ownImagen : activeChat.imagen)})`, backgroundSize:"cover", backgroundPosition:"center" } : undefined}>
                              {!avatarSrc(esPropio ? chat.ownImagen : activeChat.imagen) && (esPropio ? "◎" : "◈")}
                            </div>
                          ) : <div style={{ width:36 }} />}
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", alignItems: esPropio ? "flex-end" : "flex-start", maxWidth: msg.tipo === "audio" ? "620px" : "65%" }}>
                          {!prevSame && (
                            <div style={{ fontSize:14, fontFamily:"'Cinzel',serif", color:"rgba(255,255,255,.48)", marginBottom:5, paddingLeft: esPropio ? 0 : 2, paddingRight: esPropio ? 2 : 0 }}>
                              {esPropio ? "Tú" : msg.emisor?.username}
                            </div>
                          )}
                          <Bubble msg={msg} esPropio={esPropio} replyMsg={replyMsg}
                            onReply={m => { chat.setReplyingTo(m); inputRef.current?.focus(); }}
                            onDelete={chat.handleDeleteMsg} />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {chat.showAudioIndicator  && <AudioIndicator  username={activeChat.username} label="mandando audio" />}
              {chat.showTypingIndicator && !chat.showAudioIndicator && <TypingIndicator username={activeChat.username} />}
              <div ref={messagesEndRef} />
            </div>

            {chat.replyingTo && (
              <div style={{ padding:"10px 22px", background:"rgba(255,255,255,.03)", borderTop:`1px solid ${HOLO_THEME.hairlineSoft}`, display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:3, borderRadius:2, height:32, background:"rgba(255,255,255,.45)", flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontFamily:"'Space Mono',monospace", color:"rgba(255,255,255,.42)", marginBottom:3 }}>
                    Respondiendo a{" "}
                    <span style={{ color:"rgba(255,255,255,.72)" }}>
                      {chat.replyingTo.emisorId === parseInt(session?.user?.dbId) ? "ti mismo" : chat.replyingTo.emisor?.username}
                    </span>
                  </div>
                  <div style={{ fontSize:14, fontFamily:"'Inter',sans-serif", color:"rgba(255,255,255,.28)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {chat.replyingTo.tipo === "audio" && chat.replyingTo.audioUrl
                      ? <AudioReplyPreview src={chat.replyingTo.audioUrl} />
                      : chat.replyingTo.contenido}
                  </div>
                </div>
                <span onClick={() => chat.setReplyingTo(null)}
                  style={{ fontSize:19, color:"rgba(255,255,255,.22)", cursor:"pointer", transition:"color .15s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,.8)"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.22)"}
                >✕</span>
              </div>
            )}

            <div style={{ padding:"12px 20px 16px", background:HOLO_THEME.bg, borderTop:`1px solid ${HOLO_THEME.hairlineSoft}`, display:"flex", gap:7, alignItems:"center" }}>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display:"none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) img.sendImage(f); e.target.value = ""; }} />

              <IconBtn title={img.sending ? "Enviando imagen..." : "Adjuntar imagen"} onClick={() => fileInputRef.current?.click()} disabled={!activeChat || img.sending}>
                <svg width="21" height="21" viewBox="0 0 18 18" fill="none">
                  <rect x="8.3" y="2" width="1.4" height="14" rx=".7" fill="rgba(255,255,255,.6)"/>
                  <rect x="2" y="8.3" width="14" height="1.4" rx=".7" fill="rgba(255,255,255,.6)"/>
                  <rect x="8.1" y="8.1" width="1.8" height="1.8" rx=".4" fill="rgba(255,255,255,.6)" transform="rotate(45 9 9)"/>
                  <rect x="3.8" y="3.2" width="1" height="3.2" rx=".5" fill="rgba(255,255,255,.6)" opacity=".35" transform="rotate(45 4.3 4.8)"/>
                  <rect x="13.2" y="3.2" width="1" height="3.2" rx=".5" fill="rgba(255,255,255,.6)" opacity=".35" transform="rotate(-45 13.7 4.8)"/>
                  <rect x="3.8" y="11.6" width="1" height="3.2" rx=".5" fill="rgba(255,255,255,.6)" opacity=".35" transform="rotate(-45 4.3 13.2)"/>
                  <rect x="13.2" y="11.6" width="1" height="3.2" rx=".5" fill="rgba(255,255,255,.6)" opacity=".35" transform="rotate(45 13.7 13.2)"/>
                </svg>
              </IconBtn>

              <IconBtn title="Stickers" onClick={() => {}} disabled={!activeChat}>
                <svg width="21" height="21" viewBox="0 0 18 18" fill="none">
                  <path d="M2.5 3.5 Q2.5 2 4 2 L11.2 2 L16 6.8 L16 14.5 Q16 16 14.5 16 L4 16 Q2.5 16 2.5 14.5 Z" stroke="rgba(255,255,255,.6)" strokeWidth="1.1" fill="none"/>
                  <path d="M11.2 2 L11.2 6.8 L16 6.8" stroke="rgba(255,255,255,.28)" strokeWidth="1" fill="none"/>
                  <circle cx="7.2" cy="10" r=".85" fill="rgba(255,255,255,.6)"/>
                  <circle cx="10.8" cy="10" r=".85" fill="rgba(255,255,255,.6)"/>
                  <path d="M6.8 12.4 Q9 13.8 11.2 12.4" stroke="rgba(255,255,255,.6)" strokeWidth=".9" strokeLinecap="round" fill="none"/>
                </svg>
              </IconBtn>

              <IconBtn title={rec.recording ? "Detener audio" : "Grabar audio"} onClick={rec.handleMicClick} disabled={!activeChat}>
                <div className={rec.recording ? "mic-recording" : ""}>
                  <MicIcon size={21} recording={rec.recording} />
                </div>
              </IconBtn>

              {rec.recording ? (
                <div style={{ flex:1, background:"rgba(61,220,132,.04)", border:"1px solid rgba(61,220,132,.2)", borderRadius:26, padding:"0 16px", display:"flex", alignItems:"center", gap:8, height:46 }}>
                  <span style={{ fontFamily:"'Space Mono',monospace", fontSize:12, color:"rgba(61,220,132,.7)", letterSpacing:".1em" }}>grabando</span>
                  {BARS.map((h, i) => (
                    <div key={i} style={{ width:2, borderRadius:2, background:"rgba(61,220,132,.7)", height:`${h*14}px`, animation:`wave 0.9s ease ${i*0.06}s infinite`, transformOrigin:"center" }}/>
                  ))}
                  <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
                    <button onClick={() => rec.stopRecording(false)}
                      style={{ background:"none", border:"1px solid rgba(255,80,80,.3)", color:"rgba(255,80,80,.6)", fontFamily:"'Space Mono',monospace", fontSize:11, padding:"4px 12px", cursor:"pointer", letterSpacing:".1em", transition:"all .15s" }}
                      onMouseEnter={e => { e.currentTarget.style.background="rgba(255,80,80,.1)"; e.currentTarget.style.color="#ff5050"; }}
                      onMouseLeave={e => { e.currentTarget.style.background="none"; e.currentTarget.style.color="rgba(255,80,80,.6)"; }}>
                      ✕
                    </button>
                    <button onClick={() => rec.stopRecording(true)}
                      style={{ background:"rgba(61,220,132,.15)", border:"1px solid rgba(61,220,132,.4)", color:"#3ddc84", fontFamily:"'Space Mono',monospace", fontSize:11, padding:"4px 14px", cursor:"pointer", letterSpacing:".1em", transition:"all .15s" }}
                      onMouseEnter={e => e.currentTarget.style.background="rgba(61,220,132,.25)"}
                      onMouseLeave={e => e.currentTarget.style.background="rgba(61,220,132,.15)"}>
                      ↑ enviar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="input-wrap">
                  <input ref={inputRef} className="chat-input"
                    placeholder={chat.replyingTo ? "↩ responder..." : "Escribe un mensaje..."}
                    value={chat.input} onChange={chat.handleInputChange}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); chat.sendMessage(); } }}
                  />
                  <button className="send-arrow" onClick={chat.sendMessage} disabled={!chat.input.trim()}>↑</button>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Recuadro limpio de "nueva conversación" — sin chat abierto, solo
          // el buscador arriba a la izquierda. El resto queda vacío a propósito:
          // ahí va la función de video en ASCII (pendiente, se hace mañana).
          <div style={{ flex:1, background:HOLO_THEME.bg, position:"relative" }}>
            <div style={{ padding:"20px 24px", width:420 }}>
              <div style={{ position:"relative" }}>
                <input className="buscar-input" placeholder="buscar usuario para nueva conversación..." value={search.busqueda}
                  onChange={e => search.setBusqueda(e.target.value)} />
                {search.buscando && <span className="spinner" style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)" }} />}
              </div>
              {search.resultados.length > 0 && (
                <div style={{ marginTop:6, border:`1px solid ${HOLO_THEME.hairlineSoft}`, borderRadius:10, maxHeight:220, overflowY:"auto", background:HOLO_THEME.panel }}>
                  {search.resultados.map(u => (
                    <div key={u.id} className="resultado-item" onClick={() => handleOpenChat(u)}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div className="avatar-sm" style={avatarSrc(u.imagen) ? { backgroundImage:`url(${avatarSrc(u.imagen)})`, backgroundSize:"cover", backgroundPosition:"center" } : undefined}>
                          {!avatarSrc(u.imagen) && "◈"}
                        </div>
                        <div>
                          <div style={{ fontSize:14, color:HOLO_THEME.text, fontFamily:"'Inter',sans-serif" }}>@{u.username}</div>
                          <div style={{ fontSize:12, color:"rgba(255,255,255,.35)", fontFamily:"'Space Mono',monospace" }}>{u.nombre}</div>
                        </div>
                      </div>
                      <span style={{ fontSize:14, color:"rgba(255,255,255,.25)" }}>→</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

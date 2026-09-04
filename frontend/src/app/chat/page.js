"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import BgCross from "@/components/BgCross";
import useInjectedStyles from "@/hooks/useInjectedStyles";
import useChat from "@/hooks/useChat";
import useChatSearch from "@/hooks/useChatSearch";
import useAudioRecorder from "@/hooks/useAudioRecorder";
import useChatImage from "@/hooks/useChatImage";
import { BARS } from "@/components/chat/constants";
import StreakC from "@/components/chat/StreakC";
import MicIcon from "@/components/chat/MicIcon";
import IconBtn from "@/components/chat/IconBtn";
import Bubble from "@/components/chat/Bubble";
import AudioIndicator from "@/components/chat/AudioIndicator";
import TypingIndicator from "@/components/chat/TypingIndicator";
import AudioReplyPreview from "@/components/chat/AudioReplyPreview";
import { chatStyles } from "./chatStyles";

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const fileInputRef   = useRef(null);

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

  const handleOpenChat = user => { search.closeSearch(); chat.openChat(user); };

  if (status === "loading") return null;

  const { activeChat, streak } = chat;

  return (
    <>
      <Navbar />
      <BgCross />
      <div style={{ display:"flex", height:"calc(100vh - 48px)", marginTop:48 }}>

        <div style={{ width:220, borderRight:"1px solid rgba(255,255,255,.07)", display:"flex", flexDirection:"column", background:"#050505", flexShrink:0 }}>
          <div style={{ padding:"16px 18px 14px", borderBottom:"1px solid rgba(255,255,255,.06)" }}>
            <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:16, color:"#fff", letterSpacing:".02em" }}>Mensajes</div>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, color:"rgba(255,255,255,.25)", letterSpacing:".18em", marginTop:3 }}>// FacuLeaks</div>
          </div>

          {search.showBuscar && (
            <div style={{ padding:"9px 12px", borderBottom:"1px solid rgba(255,255,255,.05)" }}>
              <div style={{ position:"relative" }}>
                <input className="buscar-input" placeholder="buscar usuario..." value={search.busqueda}
                  onChange={e => search.setBusqueda(e.target.value)} autoFocus />
                {search.buscando && <span className="spinner" style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)" }} />}
              </div>
              {search.resultados.length > 0 && (
                <div style={{ marginTop:4, border:"1px solid rgba(255,255,255,.08)", maxHeight:150, overflowY:"auto", background:"#0a0a0a" }}>
                  {search.resultados.map(u => (
                    <div key={u.id} className="resultado-item" onClick={() => handleOpenChat(u)}>
                      <div>
                        <div style={{ fontSize:11, color:"#fff", fontFamily:"'IBM Plex Sans',sans-serif" }}>@{u.username}</div>
                        <div style={{ fontSize:9, color:"rgba(255,255,255,.35)", fontFamily:"'IBM Plex Mono',monospace" }}>{u.nombre}</div>
                      </div>
                      <span style={{ fontSize:11, color:"rgba(255,255,255,.25)" }}>→</span>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={search.closeSearch}
                style={{ marginTop:5, fontSize:8, color:"rgba(255,255,255,.3)", background:"none", border:"none", cursor:"pointer", letterSpacing:".1em", fontFamily:"'IBM Plex Mono',monospace" }}>
                ✕ cancelar
              </button>
            </div>
          )}

          <div style={{ flex:1, overflowY:"auto", padding:"6px 0" }}>
            {chat.recientes.length > 0 && (
              <>
                <div style={{ fontSize:8, letterSpacing:".2em", color:"rgba(255,255,255,.22)", padding:"8px 15px 3px", fontFamily:"'IBM Plex Mono',monospace" }}>RECIENTES</div>
                {chat.recientes.map(c => (
                  <div key={c.userId} className={`conv-item${chat.isActive(c.userId) ? " active" : ""}`} onClick={() => handleOpenChat(c)}>
                    <div className="avatar">◈<div className="status-dot" style={{ background: chat.isOnline(c.userId) ? "#3ddc84" : "#2a2a2a" }} /></div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                        <span style={{ fontSize:10, fontFamily:"'IBM Plex Sans',sans-serif", color: chat.isActive(c.userId) ? "#fff" : "rgba(255,255,255,.65)" }}>{c.username}</span>
                        {c.unread > 0 && <span style={{ background:"#fff", color:"#000", fontSize:7, padding:"1px 5px", borderRadius:999, fontFamily:"'IBM Plex Mono',monospace", fontWeight:600 }}>{c.unread}</span>}
                      </div>
                      <div style={{ fontSize:9, color:"rgba(255,255,255,.22)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:"'IBM Plex Mono',monospace" }}>{c.lastMsg}</div>
                    </div>
                  </div>
                ))}
              </>
            )}
            {chat.amigos.length > 0 && (
              <>
                <div style={{ fontSize:8, letterSpacing:".2em", color:"rgba(255,255,255,.22)", padding:"8px 15px 3px", marginTop: chat.recientes.length > 0 ? 4 : 0, fontFamily:"'IBM Plex Mono',monospace" }}>AMIGOS</div>
                {chat.amigos.map(a => (
                  <div key={a.userId} className={`conv-item${chat.isActive(a.userId) ? " active" : ""}`} onClick={() => handleOpenChat(a)}>
                    <div className="avatar">◈<div className="status-dot" style={{ background: chat.isOnline(a.userId) ? "#3ddc84" : "#2a2a2a" }} /></div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <span style={{ fontSize:10, fontFamily:"'IBM Plex Sans',sans-serif", color: chat.isActive(a.userId) ? "#fff" : "rgba(255,255,255,.65)" }}>{a.username}</span>
                    </div>
                  </div>
                ))}
              </>
            )}
            {chat.amigos.length === 0 && chat.recientes.length === 0 && (
              <div style={{ padding:"14px 15px", fontSize:10, color:"rgba(255,255,255,.25)", fontFamily:"'IBM Plex Mono',monospace", lineHeight:1.7 }}>
                sin amigos aún —{" "}
                <span style={{ color:"rgba(255,255,255,.6)", cursor:"pointer", textDecoration:"underline" }} onClick={() => router.push("/amigos")}>ir a amigos</span>
              </div>
            )}
          </div>

          <div onClick={search.toggleSearch}
            style={{ padding:"10px 15px", borderTop:"1px solid rgba(255,255,255,.05)", display:"flex", gap:8, alignItems:"center", cursor:"pointer", transition:"background .15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.02)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <div style={{ width:22, height:22, borderRadius:"50%", background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:"rgba(255,255,255,.3)", lineHeight:1 }}>+</div>
            <span style={{ fontSize:9, color:"rgba(255,255,255,.28)", fontFamily:"'IBM Plex Mono',monospace", letterSpacing:".06em" }}>nueva conversación</span>
          </div>
        </div>

        {activeChat ? (
          <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, background:"#000" }}>

            <div style={{ padding:"12px 22px", background:"#000", borderBottom:"1px solid rgba(255,255,255,.07)", display:"flex", alignItems:"center", gap:14 }}>
              <div className="avatar" style={{ width:36, height:36 }}>
                ◈<div className="status-dot-hdr" style={{ background: chat.isOnline(activeChat.userId) ? "#3ddc84" : "#2a2a2a" }} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:17, color:"#fff", lineHeight:1 }}>{activeChat.username}</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color: chat.isOnline(activeChat.userId) ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.2)", letterSpacing:".1em", marginTop:3 }}>
                  {chat.isOnline(activeChat.userId) ? "en línea ahora" : "desconectado"}
                </div>
              </div>
              {streak.loaded && <StreakC count={streak.count} dying={streak.dying} progress={streak.progress} />}
            </div>

            <div style={{ flex:1, overflowY:"auto", padding:"18px 22px", display:"flex", flexDirection:"column" }}>
              {chat.loading ? (
                <div style={{ textAlign:"center", paddingTop:60 }}><span className="spinner" /></div>
              ) : chat.mensajes.length === 0 ? (
                <div style={{ textAlign:"center", padding:"80px 0", color:"rgba(255,255,255,.18)" }}>
                  <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:20, marginBottom:8 }}>{activeChat.username}</div>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, letterSpacing:".1em" }}>inicio de la conversación</div>
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
                      <div style={{ display:"flex", gap:8, flexDirection: esPropio ? "row-reverse" : "row", alignItems:"flex-end" }}>
                        <div style={{ width:30, flexShrink:0 }}>
                          {!prevSame ? <div className="avatar-sm">{esPropio ? "◎" : "◈"}</div> : <div style={{ width:30 }} />}
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", alignItems: esPropio ? "flex-end" : "flex-start", maxWidth: msg.tipo === "audio" ? "620px" : "60%" }}>
                          {!prevSame && (
                            <div style={{ fontSize:11, fontFamily:"'DM Serif Display',serif", color:"rgba(255,255,255,.48)", marginBottom:4, paddingLeft: esPropio ? 0 : 2, paddingRight: esPropio ? 2 : 0 }}>
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
              <div style={{ padding:"8px 20px", background:"rgba(255,255,255,.03)", borderTop:"1px solid rgba(255,255,255,.06)", display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:3, borderRadius:2, height:28, background:"rgba(255,255,255,.45)", flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:9, fontFamily:"'IBM Plex Mono',monospace", color:"rgba(255,255,255,.42)", marginBottom:2 }}>
                    Respondiendo a{" "}
                    <span style={{ color:"rgba(255,255,255,.72)" }}>
                      {chat.replyingTo.emisorId === parseInt(session?.user?.dbId) ? "ti mismo" : chat.replyingTo.emisor?.username}
                    </span>
                  </div>
                  <div style={{ fontSize:11, fontFamily:"'IBM Plex Sans',sans-serif", color:"rgba(255,255,255,.28)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {chat.replyingTo.tipo === "audio" && chat.replyingTo.audioUrl
                      ? <AudioReplyPreview src={chat.replyingTo.audioUrl} />
                      : chat.replyingTo.contenido}
                  </div>
                </div>
                <span onClick={() => chat.setReplyingTo(null)}
                  style={{ fontSize:16, color:"rgba(255,255,255,.22)", cursor:"pointer", transition:"color .15s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,.8)"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.22)"}
                >✕</span>
              </div>
            )}

            <div style={{ padding:"10px 18px 14px", background:"#000", borderTop:"1px solid rgba(255,255,255,.07)", display:"flex", gap:5, alignItems:"center" }}>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display:"none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) img.sendImage(f); e.target.value = ""; }} />

              <IconBtn title={img.sending ? "Enviando imagen..." : "Adjuntar imagen"} onClick={() => fileInputRef.current?.click()} disabled={!activeChat || img.sending}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
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
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2.5 3.5 Q2.5 2 4 2 L11.2 2 L16 6.8 L16 14.5 Q16 16 14.5 16 L4 16 Q2.5 16 2.5 14.5 Z" stroke="rgba(255,255,255,.6)" strokeWidth="1.1" fill="none"/>
                  <path d="M11.2 2 L11.2 6.8 L16 6.8" stroke="rgba(255,255,255,.28)" strokeWidth="1" fill="none"/>
                  <circle cx="7.2" cy="10" r=".85" fill="rgba(255,255,255,.6)"/>
                  <circle cx="10.8" cy="10" r=".85" fill="rgba(255,255,255,.6)"/>
                  <path d="M6.8 12.4 Q9 13.8 11.2 12.4" stroke="rgba(255,255,255,.6)" strokeWidth=".9" strokeLinecap="round" fill="none"/>
                </svg>
              </IconBtn>

              <IconBtn title={rec.recording ? "Detener audio" : "Grabar audio"} onClick={rec.handleMicClick} disabled={!activeChat}>
                <div className={rec.recording ? "mic-recording" : ""}>
                  <MicIcon size={18} recording={rec.recording} />
                </div>
              </IconBtn>

              {rec.recording ? (
                <div style={{ flex:1, background:"rgba(61,220,132,.04)", border:"1px solid rgba(61,220,132,.2)", borderRadius:2, padding:"0 14px", display:"flex", alignItems:"center", gap:8, height:40 }}>
                  <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:"rgba(61,220,132,.7)", letterSpacing:".1em" }}>grabando</span>
                  {BARS.map((h, i) => (
                    <div key={i} style={{ width:2, borderRadius:2, background:"rgba(61,220,132,.7)", height:`${h*14}px`, animation:`wave 0.9s ease ${i*0.06}s infinite`, transformOrigin:"center" }}/>
                  ))}
                  <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
                    <button onClick={() => rec.stopRecording(false)}
                      style={{ background:"none", border:"1px solid rgba(255,80,80,.3)", color:"rgba(255,80,80,.6)", fontFamily:"'IBM Plex Mono',monospace", fontSize:8, padding:"3px 10px", cursor:"pointer", letterSpacing:".1em", transition:"all .15s" }}
                      onMouseEnter={e => { e.currentTarget.style.background="rgba(255,80,80,.1)"; e.currentTarget.style.color="#ff5050"; }}
                      onMouseLeave={e => { e.currentTarget.style.background="none"; e.currentTarget.style.color="rgba(255,80,80,.6)"; }}>
                      ✕
                    </button>
                    <button onClick={() => rec.stopRecording(true)}
                      style={{ background:"rgba(61,220,132,.15)", border:"1px solid rgba(61,220,132,.4)", color:"#3ddc84", fontFamily:"'IBM Plex Mono',monospace", fontSize:8, padding:"3px 12px", cursor:"pointer", letterSpacing:".1em", transition:"all .15s" }}
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
          <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16, background:"#000" }}>
            <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:24, color:"rgba(255,255,255,.12)" }}>Mensajes</div>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, letterSpacing:".15em", color:"rgba(255,255,255,.2)" }}>selecciona una conversación</div>
            <button onClick={search.openSearch}
              style={{ marginTop:6, background:"transparent", border:"1px solid rgba(255,255,255,.15)", color:"rgba(255,255,255,.5)", fontFamily:"'IBM Plex Mono',monospace", fontSize:9, letterSpacing:".2em", padding:"9px 22px", cursor:"pointer", transition:"all .2s", borderRadius:2 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(255,255,255,.4)"; e.currentTarget.style.color="#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(255,255,255,.15)"; e.currentTarget.style.color="rgba(255,255,255,.5)"; }}>
              + nueva conversación
            </button>
          </div>
        )}
      </div>
    </>
  );
}

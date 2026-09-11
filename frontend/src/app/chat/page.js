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
import StreakC from "@/components/chat/StreakC";
import RequestsIcon from "@/components/chat/RequestsIcon";
import EmptyStateBg from "@/components/chat/EmptyStateBg";
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
  const solicitudesRef = useRef(null);

  // "Deslizá para cancelar" el audio: el arrastre se maneja con refs + rAF y se
  // aplica directo al DOM (recBarRef.style.transform), NO con estado de React —
  // así no se re-renderiza toda la página de chat en cada pointermove y el
  // gesto va fluido. Lo único que sí es estado es `recArmed` (cruzó el umbral),
  // que cambia una o dos veces por gesto.
  const recBarRef     = useRef(null);
  const recStartXRef  = useRef(null);
  const recDragXRef   = useRef(0);
  const recRafRef     = useRef(0);

  const [showSolicitudes, setShowSolicitudes] = useState(false);
  const [recSecs, setRecSecs] = useState(0);
  const [recArmed, setRecArmed] = useState(false);

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

  // Cronómetro del estado "grabando audio" (solo visual — la lógica de grabar
  // vive en useAudioRecorder). Se calcula desde el instante en que arrancó.
  useEffect(() => {
    if (!rec.recording) return undefined;
    const started = Date.now();
    const t = setInterval(() => setRecSecs(Math.floor((Date.now() - started) / 1000)), 250);
    return () => { clearInterval(t); setRecSecs(0); recDragXRef.current = 0; setRecArmed(false); };
  }, [rec.recording]);
  const fmtRec = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // El panel de solicitudes se cierra al hacer click en cualquier lado (no hace
  // falta volver a picar el avioncito).
  useEffect(() => {
    if (!showSolicitudes) return undefined;
    const onDown = e => { if (!solicitudesRef.current?.contains(e.target)) setShowSolicitudes(false); };
    const onEsc  = e => { if (e.key === "Escape") setShowSolicitudes(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onEsc); };
  }, [showSolicitudes]);

  // Deslizar para cancelar el audio: se arrastra la barra hacia la izquierda;
  // pasado el umbral se descarta la grabación al soltar. El movimiento se
  // pinta en un rAF directo sobre el nodo (sin setState) para que sea suave.
  const REC_CANCEL_AT = -96;

  const paintRecDrag = () => {
    recRafRef.current = 0;
    const el = recBarRef.current;
    if (el) el.style.transform = `translateX(${recDragXRef.current}px)`;
    const armed = recDragXRef.current <= REC_CANCEL_AT;
    setRecArmed(prev => (prev === armed ? prev : armed));
  };
  const onRecPointerDown = e => {
    if (e.target.closest(".cx-rec__send")) return;
    recStartXRef.current = e.clientX;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    if (recBarRef.current) recBarRef.current.style.transition = "none";
  };
  const onRecPointerMove = e => {
    if (recStartXRef.current == null) return;
    recDragXRef.current = Math.max(-150, Math.min(0, e.clientX - recStartXRef.current));
    if (!recRafRef.current) recRafRef.current = requestAnimationFrame(paintRecDrag);
  };
  const onRecPointerUp = () => {
    if (recStartXRef.current == null) return;
    const cancel = recDragXRef.current <= REC_CANCEL_AT;
    recStartXRef.current = null;
    if (recRafRef.current) { cancelAnimationFrame(recRafRef.current); recRafRef.current = 0; }
    recDragXRef.current = 0;
    setRecArmed(false);
    const el = recBarRef.current;
    if (el) { el.style.transition = ""; el.style.transform = "translateX(0px)"; }
    if (cancel) rec.stopRecording(false);
  };

  // Onda continua del estado "grabando". Período 12 sobre un viewBox de 120 de
  // ancho con el <svg> a 200%: cuando recDrift lo desplaza -50% el patrón calza
  // exacto (5 ciclos por vuelta), sin el salto que se veía antes cada 3s.
  const REC_WAVE_D = (() => {
    let d = "M0 13 q 3 -7 6 0";
    for (let x = 6; x < 240; x += 6) d += " t 6 0";
    return d;
  })();

  const handleOpenChat = user => { search.closeSearch(); setShowSolicitudes(false); chat.openChat(user); };
  const goToProfile = () => { if (chat.activeChat?.userId) router.push(`/perfil/${chat.activeChat.userId}`); };
  const totalSolicitudes = chat.solicitudes.reduce((acc, s) => acc + (s.unread || 0), 0) || chat.solicitudes.length;

  // Inicial para el avatar cuadrado (cuando el usuario no tiene foto) — dirección
  // "Vitral editorial · Tinta". Toma la primera letra útil del nombre.
  const initial = name => (String(name || "").match(/[a-z0-9]/i)?.[0] || "?").toUpperCase();

  if (status === "loading") return null;

  const { activeChat, streak } = chat;

  // Estos tres bloques se arman UNA vez y se usan en dos lugares distintos
  // del JSX de abajo: la barra angosta de siempre (cuando hay un chat
  // abierto, para poder cambiar de conversación) y la tarjeta grande
  // centrada (cuando no hay ninguno — ver "chat-landing" más abajo). Son
  // mutuamente excluyentes (activeChat ? uno : el otro), así que reusar el
  // mismo JSX acá no duplica nada montado — solo evita copiar y pegar el
  // mapeo de Recientes/Amigos/solicitudes dos veces.
  const solicitudesPanel = (
    <div ref={solicitudesRef} style={{ position:"relative" }}>
      <RequestsIcon count={totalSolicitudes} active={showSolicitudes} onClick={() => setShowSolicitudes(v => !v)} />
      {/* Panel desplegable de solicitudes de mensaje (gente que no es tu amigo y no le respondiste todavía).
          Se cierra clickeando en cualquier lado o con Escape (ver useEffect). */}
      {showSolicitudes && (
        // zIndex 30: tiene que ganarle al buscador de nueva conversación
        // (.empty-search, zIndex 20 en chatStyles.js) — si no, el panel de
        // solicitudes se abre TAPADO por la caja de búsqueda que está
        // justo debajo en "chat-landing" (bug reportado 2026-09-11).
        <div style={{ position:"absolute", top:"100%", right:0, marginTop:6, width:260, border:`1px solid ${HOLO_THEME.hairline}`, borderRadius:10, background:HOLO_THEME.panel, boxShadow:"0 8px 24px rgba(0,0,0,.5)", zIndex:30, maxHeight:280, overflowY:"auto" }}>
          <div className="conv-sec conv-sec--sm">SOLICITUDES</div>
          {chat.solicitudes.length === 0 ? (
            <div style={{ padding:"6px 14px 14px", fontSize:12, color:"rgba(255,255,255,.2)", fontFamily:"'Space Mono',monospace" }}>sin solicitudes pendientes</div>
          ) : chat.solicitudes.map(s => (
            <div key={s.userId} className="conv-item" onClick={() => handleOpenChat(s)}>
              <div className="avatar" style={avatarSrc(s.imagen) ? { backgroundImage:`url(${avatarSrc(s.imagen)})`, backgroundSize:"100% 100%", backgroundPosition:"center" } : undefined}>
                {!avatarSrc(s.imagen) && initial(s.username)}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                  <span className="conv-name" style={{ color:HOLO_THEME.text }}>{s.username}</span>
                  {s.unread > 0 && <span style={{ background:"#cc3344", color:"#fff", fontSize:10, padding:"2px 7px", borderRadius:999, fontFamily:"'Space Mono',monospace", fontWeight:600 }}>{s.unread}</span>}
                </div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,.22)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:"'Space Mono',monospace" }}>{s.lastMsg}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const recientesList = (
    <div className="conv-half">
      <div className="conv-sec">RECIENTES</div>
      {chat.recientes.length > 0 ? chat.recientes.map(c => (
        <div key={c.userId} className={`conv-item${chat.isActive(c.userId) ? " active" : ""}`} onClick={() => handleOpenChat(c)}>
          <div className="avatar" style={avatarSrc(c.imagen) ? { backgroundImage:`url(${avatarSrc(c.imagen)})`, backgroundSize:"100% 100%", backgroundPosition:"center" } : undefined}>
            {!avatarSrc(c.imagen) && initial(c.username)}<div className="status-dot" style={{ background: chat.isOnline(c.userId) ? "#3ddc84" : "#2a2a2a" }} />
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
              <span className="conv-name" style={{ color: chat.isActive(c.userId) ? HOLO_THEME.text : "rgba(255,255,255,.65)" }}>{c.username}</span>
              {c.unread > 0 && <span style={{ background:"#b8b3c2", color:"#151318", fontSize:10, padding:"2px 7px", borderRadius:999, fontFamily:"'Space Mono',monospace", fontWeight:600 }}>{c.unread}</span>}
            </div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,.22)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:"'Space Mono',monospace" }}>{c.lastMsg}</div>
          </div>
        </div>
      )) : (
        <div style={{ padding:"6px 18px", fontSize:12, color:"rgba(255,255,255,.2)", fontFamily:"'Space Mono',monospace" }}>sin conversaciones recientes</div>
      )}
    </div>
  );

  const amigosList = (
    <div className="conv-half" style={{ borderTop:`1px solid ${HOLO_THEME.hairlineSoft}` }}>
      <div className="conv-sec">AMIGOS</div>
      {chat.amigos.length > 0 ? chat.amigos.map(a => (
        <div key={a.userId} className={`conv-item${chat.isActive(a.userId) ? " active" : ""}`} onClick={() => handleOpenChat(a)}>
          <div className="avatar" style={avatarSrc(a.imagen) ? { backgroundImage:`url(${avatarSrc(a.imagen)})`, backgroundSize:"100% 100%", backgroundPosition:"center" } : undefined}>
            {!avatarSrc(a.imagen) && initial(a.username)}<div className="status-dot" style={{ background: chat.isOnline(a.userId) ? "#3ddc84" : "#2a2a2a" }} />
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <span className="conv-name" style={{ color: chat.isActive(a.userId) ? HOLO_THEME.text : "rgba(255,255,255,.65)" }}>{a.username}</span>
          </div>
        </div>
      )) : (
        <div style={{ padding:"6px 18px", fontSize:12, color:"rgba(255,255,255,.2)", fontFamily:"'Space Mono',monospace" }}>
          sin amigos aún —{" "}
          <span style={{ color:"rgba(255,255,255,.6)", cursor:"pointer", textDecoration:"underline" }} onClick={() => router.push("/amigos")}>ir a amigos</span>
        </div>
      )}
    </div>
  );

  // El buscador de "nueva conversación" — antes vivía en el panel vacío de
  // la derecha, ahora va adentro de la tarjeta "chat-landing", debajo del
  // título y la campanita.
  const buscarUsuarioBox = (
    <div className="empty-search">
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
                <div className="avatar-sm" style={avatarSrc(u.imagen) ? { backgroundImage:`url(${avatarSrc(u.imagen)})`, backgroundSize:"100% 100%", backgroundPosition:"center" } : undefined}>
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
  );

  return (
    <>
      <Navbar />
      {/* "chat-shell--open" (con conversación activa) es lo que la media query
          de celular usa para decidir qué panel mostrar — ver chatStyles.js. */}
      <div className={`chat-shell${activeChat ? " chat-shell--open" : ""}`} style={{ display:"flex", height:"calc(100vh - 58px)", marginTop:58 }}>

        {/* La barra angosta de siempre — solo mientras hay un chat abierto,
            para poder cambiar de conversación sin volver a la pantalla de
            inicio. Sin chat abierto, Recientes/Amigos viven en "chat-landing"
            más abajo (mismo JSX, ver los const de arriba). */}
        {activeChat && (
          <div className="chat-side">
            <div className="chat-side__hdr" style={{ padding:"20px 22px 18px", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div className="side-title">Mensajes</div>
                <div className="side-kicker">{"// FacuLeaks"}</div>
              </div>
              {solicitudesPanel}
            </div>

            {/* Dividido en 2 mitades independientes, cada una con su propio scroll — RECIENTES arriba, AMIGOS abajo */}
            <div style={{ flex:1, display:"flex", flexDirection:"column", minHeight:0 }}>
              {recientesList}
              {amigosList}
            </div>
          </div>
        )}

        {activeChat ? (
          <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, background:HOLO_THEME.bg }}>

            <div style={{ padding:"14px 24px", background:HOLO_THEME.bg, borderBottom:`1px solid ${HOLO_THEME.hairlineSoft}`, display:"flex", alignItems:"center", gap:16 }}>
              {/* Solo visible en celular (chatStyles.js) — la lista y la
                  conversación no entran juntas, esto vuelve a la lista. */}
              <button className="chat-back" onClick={chat.closeChat} aria-label="Volver a la lista">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              </button>
              <button className="chat-hdr-id" onClick={goToProfile} title={`Ver perfil de @${activeChat.username}`}>
                <div className="avatar" style={{ width:46, height:46, ...(avatarSrc(activeChat.imagen) ? { backgroundImage:`url(${avatarSrc(activeChat.imagen)})`, backgroundSize:"100% 100%", backgroundPosition:"center" } : {}) }}>
                  {!avatarSrc(activeChat.imagen) && initial(activeChat.username)}<div className="status-dot-hdr" style={{ background: chat.isOnline(activeChat.userId) ? "#3ddc84" : "#2a2a2a" }} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div className="chat-hdr-name" style={{ fontFamily:"'Cinzel',serif", fontSize:20, color:HOLO_THEME.text, lineHeight:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{activeChat.username}</div>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:12, color: chat.isOnline(activeChat.userId) ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.2)", letterSpacing:".08em", marginTop:4 }}>
                    {chat.isOnline(activeChat.userId) ? "en línea ahora" : "desconectado"}
                  </div>
                </div>
              </button>
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
                            <div className="avatar-sm" style={avatarSrc(esPropio ? chat.ownImagen : activeChat.imagen) ? { backgroundImage:`url(${avatarSrc(esPropio ? chat.ownImagen : activeChat.imagen)})`, backgroundSize:"100% 100%", backgroundPosition:"center" } : undefined}>
                              {!avatarSrc(esPropio ? chat.ownImagen : activeChat.imagen) && (esPropio ? "◎" : "◈")}
                            </div>
                          ) : <div style={{ width:36 }} />}
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", alignItems: esPropio ? "flex-end" : "flex-start", maxWidth: msg.tipo === "audio" ? "360px" : "65%" }}>
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

            <div className="composer-bar">
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display:"none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) img.sendImage(f); e.target.value = ""; }} />

              {rec.recording ? (
                // Estado "grabando": punto latiendo, cronómetro, onda que se
                // desplaza, y "deslizá para cancelar" — se arrastra la barra a
                // la izquierda y al soltar pasado el umbral se descarta.
                <div
                  ref={recBarRef}
                  className={`cx-rec${recArmed ? " cx-rec--armed" : ""}`}
                  onPointerDown={onRecPointerDown}
                  onPointerMove={onRecPointerMove}
                  onPointerUp={onRecPointerUp}
                  onPointerCancel={onRecPointerUp}
                >
                  <span className="cx-rec__dot" />
                  <span className="cx-rec__t">{fmtRec(recSecs)}</span>
                  <span className="cx-rec__wave">
                    <svg viewBox="0 0 120 26" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                      <path d={REC_WAVE_D} opacity=".9" />
                    </svg>
                  </span>
                  <button className="cx-rec__cancel" onClick={() => rec.stopRecording(false)} title="Cancelar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><polyline points="15 6 9 12 15 18" /></svg>
                    {recArmed ? "soltá para cancelar" : "deslizá para cancelar"}
                  </button>
                  <button className="cx-rec__send" onClick={() => rec.stopRecording(true)} title="Enviar audio">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M3.4 20.4l17.6-8.4a1 1 0 0 0 0-1.8L3.4 1.8a1 1 0 0 0-1.4 1.1L4 10l10 2-10 2-2 7.1a1 1 0 0 0 1.4 1.3z" /></svg>
                  </button>
                </div>
              ) : (
                <>
                  <button className="cx-btn" title={img.sending ? "Enviando imagen..." : "Adjuntar"} onClick={() => fileInputRef.current?.click()} disabled={!activeChat || img.sending}>
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5l-8.5 8.5a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-3-3l8-8" /></svg>
                  </button>
                  <button className="cx-btn" title="Grabar audio" onClick={rec.handleMicClick} disabled={!activeChat}>
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M6 11a6 6 0 0 0 12 0" /><line x1="12" y1="17" x2="12" y2="21" /><line x1="9" y1="21" x2="15" y2="21" /></svg>
                  </button>
                  <div className="input-wrap">
                    <input ref={inputRef} className="chat-input"
                      placeholder={chat.replyingTo ? "↩ responder..." : "Escribí un mensaje..."}
                      value={chat.input} onChange={chat.handleInputChange}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); chat.sendMessage(); } }}
                    />
                    <button className="send-plane" onClick={chat.sendMessage} disabled={!chat.input.trim()} title="Enviar">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3.4 20.4l17.6-8.4a1 1 0 0 0 0-1.8L3.4 1.8a1 1 0 0 0-1.4 1.1L4 10l10 2-10 2-2 7.1a1 1 0 0 0 1.4 1.3z" /></svg>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          // Pantalla de "elegí con quién hablar" — sin chat abierto. Una
          // tarjeta centrada (título + campanita, buscador, Recientes y
          // Amigos mitad y mitad) flotando sobre el fondo decorativo grande
          // — ver components/chat/EmptyStateBg.js: ya no es el texto bíblico
          // + 3 figuras, ahora son solo 2 (la "monita de anime" del login y
          // el ángel del centro), más grandes, fondo transparente.
          <div className="chat-landing">
            <EmptyStateBg />
            <div className="chat-landing-card">
              <div className="chat-side__hdr" style={{ padding:"22px 24px 16px", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div className="side-title">Mensajes</div>
                  <div className="side-kicker">{"// FacuLeaks"}</div>
                </div>
                {solicitudesPanel}
              </div>

              {buscarUsuarioBox}

              <div className="chat-landing-lists">
                {recientesList}
                {amigosList}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import Navbar from "@/components/Navbar";

let socket = null;

// ── TYPING INDICATOR ──
function TypingIndicator({ username }) {
  const frames = ["_", "._", ".._", "..._"];
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setFrame(f => (f + 1) % frames.length), 380);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      display: "flex", gap: 10, alignItems: "flex-end",
      marginBottom: 10, animation: "fadeUp .18s ease"
    }}>
      <div className="avatar-sm">◈</div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        <div style={{
          fontSize: 9, fontFamily: "'IBM Plex Mono',monospace",
          color: "rgba(255,255,255,.28)", marginBottom: 3,
          letterSpacing: ".08em"
        }}>
          {username}
        </div>
        <div style={{
          background: "#0d0d0d", borderRadius: 3,
          padding: "8px 14px",
          border: "1px solid rgba(255,255,255,.08)",
          boxShadow: "0 2px 14px rgba(0,0,0,.5)",
          display: "flex", alignItems: "center", gap: 6
        }}>
          <span style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: 11, color: "rgba(255,255,255,.25)",
            letterSpacing: ".04em"
          }}>
            escribiendo
          </span>
          <span style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: 11, color: "rgba(255,255,255,.55)",
            letterSpacing: ".04em", minWidth: 28,
            display: "inline-block"
          }}>
            {frames[frame]}
          </span>
          <span style={{
            display: "inline-block", width: 7, height: 13,
            background: "rgba(255,255,255,.45)",
            animation: "blink 1s step-end infinite",
            verticalAlign: "middle", marginLeft: 1
          }} />
        </div>
      </div>
    </div>
  );
}

// ── BUBBLE ──
function Bubble({ msg, esPropio, replyMsg, onReply }) {
  const [hov, setHov] = useState(false);
  const formatTime = (d) => d ? new Date(d).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display:"flex", flexDirection:"column", alignItems: esPropio ? "flex-end" : "flex-start", gap:3 }}>
      <div className={esPropio ? "bubble-me" : "bubble-other"}>
        {replyMsg && (
          <div className={esPropio ? "reply-bar-me" : "reply-bar-other"}>
            <div style={{ width:2.5, borderRadius:2, background: esPropio ? "rgba(0,0,0,.22)" : "rgba(255,255,255,.28)", alignSelf:"stretch", flexShrink:0 }} />
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:8, fontFamily:"'IBM Plex Mono',monospace", color: esPropio ? "rgba(0,0,0,.6)" : "rgba(255,255,255,.58)", marginBottom:1, letterSpacing:".04em" }}>
                {replyMsg.emisor?.username || "Tú"}
              </div>
              <div style={{ fontSize:10, fontFamily:"'IBM Plex Sans',sans-serif", color: esPropio ? "rgba(0,0,0,.42)" : "rgba(255,255,255,.36)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:240 }}>
                {replyMsg.contenido}
              </div>
            </div>
          </div>
        )}
        <div style={{ padding:"9px 14px", display:"flex", alignItems:"flex-end", gap:10 }}>
          <div className={esPropio ? "bubble-text-me" : "bubble-text-other"}>{msg.contenido}</div>
          <div className={esPropio ? "bubble-time-me" : "bubble-time-other"}>{formatTime(msg.creadoEn)}</div>
        </div>
      </div>
      {hov && (
        <div className="reply-btn" onClick={() => onReply(msg)}>↩ responder</div>
      )}
    </div>
  );
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [recientes,   setRecientes]   = useState([]);
  const [amigos,      setAmigos]      = useState([]);
  const [activeChat,  setActiveChat]  = useState(null);
  const [mensajes,    setMensajes]    = useState([]);
  const [input,       setInput]       = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [showBuscar,  setShowBuscar]  = useState(false);
  const [busqueda,    setBusqueda]    = useState("");
  const [resultados,  setResultados]  = useState([]);
  const [buscando,    setBuscando]    = useState(false);
  const [replyingTo,  setReplyingTo]  = useState(null);
  const [isTyping,    setIsTyping]    = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const activeChatRef  = useRef(null);
  const typingTimer    = useRef(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth");
  }, [status, router]);

  // Sincronizar ref con estado
  useEffect(() => {
  activeChatRef.current = activeChat;
  // Resetear typing al cambiar de chat
  setIsTyping(false);
}, [activeChat]);
  // ── Estilos ──
  useEffect(() => {
    const s = document.createElement("style");
    s.id = "chat-styles";
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:wght@300;400;500&family=DM+Serif+Display:ital@0;1&display=swap');
      @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      @keyframes fadeIn { from{opacity:0} to{opacity:1} }
      @keyframes fadeUp { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
      @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0} }

      body {
        background:#000; color:#e8e4d9;
        font-family:'IBM Plex Mono', monospace;
        font-size:13px; overflow:hidden;
      }
      body::before {
        content:''; position:fixed; inset:0;
        background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
        opacity:.04; pointer-events:none; z-index:9998;
      }
      body::after {
        content:''; position:fixed; inset:0;
        background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.12) 2px,rgba(0,0,0,.12) 4px);
        pointer-events:none; z-index:9999;
      }
      ::-webkit-scrollbar{width:3px}
      ::-webkit-scrollbar-track{background:transparent}
      ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:2px}

      .conv-item {
        padding:9px 15px; cursor:pointer;
        border-left:2px solid transparent;
        transition:all .12s;
        display:flex; gap:10px; align-items:center;
      }
      .conv-item:hover { background:rgba(255,255,255,.03); }
      .conv-item.active { background:rgba(255,255,255,.06); border-left-color:rgba(255,255,255,.6); }

      .avatar {
        width:32px; height:32px; border-radius:50%;
        background:#1a1a1a; border:1.5px solid rgba(255,255,255,.1);
        display:flex; align-items:center; justify-content:center;
        font-size:11px; color:rgba(255,255,255,.22);
        flex-shrink:0; position:relative;
      }
      .avatar-sm {
        width:28px; height:28px; border-radius:50%;
        background:#1a1a1a; border:1.5px solid rgba(255,255,255,.08);
        display:flex; align-items:center; justify-content:center;
        font-size:9px; color:rgba(255,255,255,.2);
        flex-shrink:0; font-family:'IBM Plex Mono',monospace;
      }
      .status-dot {
        position:absolute; bottom:1px; right:1px;
        width:8px; height:8px; border-radius:50%; border:2px solid #050505;
      }
      .status-dot-hdr {
        position:absolute; bottom:1px; right:1px;
        width:9px; height:9px; border-radius:50%; border:2px solid #000;
      }

      .bubble-me {
        background:#fff; border-radius:3px;
        box-shadow:0 2px 14px rgba(0,0,0,.45);
        overflow:hidden; max-width:60%;
        animation:fadeUp .15s ease;
      }
      .bubble-other {
        background:#141414; border-radius:3px;
        box-shadow:0 2px 14px rgba(0,0,0,.45);
        overflow:hidden; max-width:60%;
        animation:fadeUp .15s ease;
      }
      .bubble-text-me    { font-family:'IBM Plex Sans',sans-serif; font-size:13px; color:#000; line-height:1.55; letter-spacing:.01em; }
      .bubble-text-other { font-family:'IBM Plex Sans',sans-serif; font-size:13px; color:#e8e4d9; line-height:1.55; letter-spacing:.01em; }
      .bubble-time-me    { font-size:8px; color:rgba(0,0,0,.28); white-space:nowrap; flex-shrink:0; font-family:'IBM Plex Mono',monospace; letter-spacing:.05em; margin-top:auto; }
      .bubble-time-other { font-size:8px; color:rgba(255,255,255,.2); white-space:nowrap; flex-shrink:0; font-family:'IBM Plex Mono',monospace; letter-spacing:.05em; margin-top:auto; }

      .reply-bar-me    { padding:7px 12px 6px; background:rgba(0,0,0,.07); border-bottom:1px solid rgba(0,0,0,.07); display:flex; gap:8px; }
      .reply-bar-other { padding:7px 12px 6px; background:rgba(255,255,255,.05); border-bottom:1px solid rgba(255,255,255,.06); display:flex; gap:8px; }

      .reply-btn {
        padding:2px 10px; background:rgba(255,255,255,.05);
        border-radius:999px; border:1px solid rgba(255,255,255,.08);
        font-size:9px; font-family:'IBM Plex Mono',monospace;
        color:rgba(255,255,255,.38); cursor:pointer;
        display:inline-flex; gap:4px; align-items:center;
        animation:fadeIn .1s ease; letter-spacing:.06em; transition:all .15s;
      }
      .reply-btn:hover { background:rgba(255,255,255,.1); color:#fff; }

      .chat-input {
        flex:1; background:transparent; border:none;
        color:#e8e4d9; font-family:'IBM Plex Sans',sans-serif;
        font-size:12px; padding:11px 16px; outline:none; letter-spacing:.02em;
      }
      .chat-input::placeholder { color:rgba(255,255,255,.22); }

      .input-wrap {
        flex:1; display:flex; background:rgba(255,255,255,.04);
        border-radius:2px; overflow:hidden;
        border:1px solid rgba(255,255,255,.08); transition:border-color .2s;
      }
      .input-wrap:focus-within { border-color:rgba(255,255,255,.25); }

      .send-arrow {
        background:transparent; border:none;
        border-left:1px solid rgba(255,255,255,.07);
        padding:0 16px; color:rgba(255,255,255,.3);
        font-size:16px; cursor:pointer; transition:color .2s;
      }
      .send-arrow:hover { color:rgba(255,255,255,.8); }
      .send-arrow:disabled { opacity:.2; cursor:not-allowed; }

      .buscar-input {
        width:100%; box-sizing:border-box;
        background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.12);
        color:#fff; font-family:'IBM Plex Mono',monospace;
        font-size:11px; padding:8px 12px; outline:none;
        transition:border-color .2s; border-radius:2px;
      }
      .buscar-input:focus { border-color:rgba(255,255,255,.3); }
      .buscar-input::placeholder { color:rgba(255,255,255,.25); }

      .resultado-item {
        display:flex; align-items:center; justify-content:space-between;
        padding:8px 12px; cursor:pointer;
        border-bottom:1px solid rgba(255,255,255,.04); transition:background .12s;
      }
      .resultado-item:hover { background:rgba(255,255,255,.06); }

      .spinner {
        width:10px; height:10px;
        border:1px solid rgba(255,255,255,.15); border-top-color:#fff;
        border-radius:50%; animation:spin .7s linear infinite; display:inline-block;
      }

      .date-pill {
        display:flex; align-items:center; gap:12px; margin:16px 0 14px;
      }
      .date-pill::before,.date-pill::after { content:''; flex:1; height:1px; background:rgba(255,255,255,.05); }
      .date-pill span {
        font-size:8px; font-family:'IBM Plex Mono',monospace;
        color:rgba(255,255,255,.22); background:rgba(255,255,255,.04);
        padding:3px 12px; border-radius:999px; letter-spacing:.12em;
      }
    `;
    document.head.appendChild(s);
    return () => document.getElementById("chat-styles")?.remove();
  }, []);

// ── Socket.io ──
useEffect(() => {
  if (status !== "authenticated" || !session?.user?.dbId) return;
  socket = io("http://localhost:4000");
  socket.emit("user:connect", session.user.dbId);

  socket.on("users:online", (users) => setOnlineUsers(users));

  socket.on("message:receive", (msg) => {
    setMensajes(prev => [...prev, msg]);
    loadConversaciones();
  });

  socket.on("message:sent", (msg) => {
    setMensajes(prev => [...prev, msg]);
  });

  socket.on("typing:start", ({ userId }) => {
    console.log("typing:start recibido — userId:", userId, "activeChatRef:", activeChatRef.current?.userId);
    setIsTyping(prev => {
      if (String(userId) === String(activeChatRef.current?.userId)) return true;
      return prev;
    });
  });

  socket.on("typing:stop", ({ userId }) => {
    setIsTyping(prev => {
      if (String(userId) === String(activeChatRef.current?.userId)) return false;
      return prev;
    });
  });

  return () => { socket?.disconnect(); socket = null; };
}, [status, session]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, isTyping]);

  const loadConversaciones = useCallback(async () => {
    try {
      const res  = await fetch("http://localhost:4000/api/chat/conversaciones", { credentials: "include" });
      const data = await res.json();
      setRecientes(data.recientes || []);
      setAmigos(data.amigos       || []);
    } catch {}
  }, []);

  useEffect(() => {
    if (status === "authenticated") loadConversaciones();
  }, [status, loadConversaciones]);

  useEffect(() => {
    if (busqueda.length < 2) { setResultados([]); return; }
    const t = setTimeout(async () => {
      setBuscando(true);
      try {
        const res  = await fetch(`http://localhost:4000/api/amigos/buscar?q=${busqueda}`, { credentials: "include" });
        const data = await res.json();
        setResultados(data.usuarios || []);
      } catch {}
      setBuscando(false);
    }, 400);
    return () => clearTimeout(t);
  }, [busqueda]);

  const openChat = async (user) => {
    setShowBuscar(false); setBusqueda(""); setResultados([]);
    setIsTyping(false); // resetear typing al cambiar de chat
    const chatUser = { userId: user.userId || user.id, username: user.username };
    setActiveChat(chatUser);
    setLoading(true); setMensajes([]); setReplyingTo(null);
    try {
      const res  = await fetch(`http://localhost:4000/api/chat/${chatUser.userId}`, { credentials: "include" });
      const data = await res.json();
      setMensajes(data.mensajes || []);
      if (socket && session?.user?.dbId)
        socket.emit("messages:read", { emisorId: chatUser.userId, receptorId: session.user.dbId });
    } catch {}
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!socket || !activeChat) return;
    socket.emit("typing:start", { receptorId: activeChat.userId });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit("typing:stop", { receptorId: activeChat.userId });
    }, 1500);
  };

  const sendMessage = () => {
    if (!input.trim() || !activeChat || !socket || !session?.user?.dbId) return;
    // Detener typing al enviar
    clearTimeout(typingTimer.current);
    socket.emit("typing:stop", { receptorId: activeChat.userId });
    socket.emit("message:send", {
      emisorId:   session.user.dbId,
      receptorId: activeChat.userId,
      contenido:  input.trim(),
    });
    setInput("");
    setReplyingTo(null);
  };

  const isOnline = (id) => onlineUsers.includes(String(id));
  const isActive = (id) => activeChat?.userId === id;

  const formatDate = (d) => {
    if (!d) return "";
    const date = new Date(d);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "HOY";
    if (date.toDateString() === yesterday.toDateString()) return "AYER";
    return date.toLocaleDateString("es-MX", { day: "numeric", month: "long" }).toUpperCase();
  };

  if (status === "loading") return null;

  return (
    <>
      <Navbar />
      <div style={{ display:"flex", height:"calc(100vh - 48px)", marginTop:48 }}>

        {/* ── SIDEBAR ── */}
        <div style={{ width:220, borderRight:"1px solid rgba(255,255,255,.07)", display:"flex", flexDirection:"column", background:"#050505", flexShrink:0 }}>

          <div style={{ padding:"16px 18px 14px", borderBottom:"1px solid rgba(255,255,255,.06)" }}>
            <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:16, color:"#fff", letterSpacing:".02em" }}>Mensajes</div>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, color:"rgba(255,255,255,.25)", letterSpacing:".18em", marginTop:3 }}>// FacuLeaks</div>
          </div>

          {showBuscar && (
            <div style={{ padding:"9px 12px", borderBottom:"1px solid rgba(255,255,255,.05)" }}>
              <div style={{ position:"relative" }}>
                <input className="buscar-input" placeholder="buscar usuario..." value={busqueda}
                  onChange={e => setBusqueda(e.target.value)} autoFocus />
                {buscando && <span className="spinner" style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)" }} />}
              </div>
              {resultados.length > 0 && (
                <div style={{ marginTop:4, border:"1px solid rgba(255,255,255,.08)", maxHeight:150, overflowY:"auto", background:"#0a0a0a" }}>
                  {resultados.map(u => (
                    <div key={u.id} className="resultado-item" onClick={() => openChat(u)}>
                      <div>
                        <div style={{ fontSize:11, color:"#fff", fontFamily:"'IBM Plex Sans',sans-serif" }}>@{u.username}</div>
                        <div style={{ fontSize:9, color:"rgba(255,255,255,.35)", fontFamily:"'IBM Plex Mono',monospace" }}>{u.nombre}</div>
                      </div>
                      <span style={{ fontSize:11, color:"rgba(255,255,255,.25)" }}>→</span>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => { setShowBuscar(false); setBusqueda(""); setResultados([]); }}
                style={{ marginTop:5, fontSize:8, color:"rgba(255,255,255,.3)", background:"none", border:"none", cursor:"pointer", letterSpacing:".1em", fontFamily:"'IBM Plex Mono',monospace" }}>
                ✕ cancelar
              </button>
            </div>
          )}

          <div style={{ flex:1, overflowY:"auto", padding:"6px 0" }}>
            {recientes.length > 0 && (
              <>
                <div style={{ fontSize:8, letterSpacing:".2em", color:"rgba(255,255,255,.22)", padding:"8px 15px 3px", fontFamily:"'IBM Plex Mono',monospace" }}>RECIENTES</div>
                {recientes.map(c => (
                  <div key={c.userId} className={`conv-item${isActive(c.userId) ? " active" : ""}`} onClick={() => openChat(c)}>
                    <div className="avatar">
                      ◈
                      <div className="status-dot" style={{ background: isOnline(c.userId) ? "#3ddc84" : "#2a2a2a" }} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                        <span style={{ fontSize:10, fontFamily:"'IBM Plex Sans',sans-serif", color: isActive(c.userId) ? "#fff" : "rgba(255,255,255,.65)" }}>{c.username}</span>
                        {c.unread > 0 && <span style={{ background:"#fff", color:"#000", fontSize:7, padding:"1px 5px", borderRadius:999, fontFamily:"'IBM Plex Mono',monospace", fontWeight:600 }}>{c.unread}</span>}
                      </div>
                      <div style={{ fontSize:9, color:"rgba(255,255,255,.22)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:"'IBM Plex Mono',monospace" }}>{c.lastMsg}</div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {amigos.length > 0 && (
              <>
                <div style={{ fontSize:8, letterSpacing:".2em", color:"rgba(255,255,255,.22)", padding:"8px 15px 3px", marginTop: recientes.length > 0 ? 4 : 0, fontFamily:"'IBM Plex Mono',monospace" }}>AMIGOS</div>
                {amigos.map(a => (
                  <div key={a.userId} className={`conv-item${isActive(a.userId) ? " active" : ""}`} onClick={() => openChat(a)}>
                    <div className="avatar">
                      ◈
                      <div className="status-dot" style={{ background: isOnline(a.userId) ? "#3ddc84" : "#2a2a2a" }} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <span style={{ fontSize:10, fontFamily:"'IBM Plex Sans',sans-serif", color: isActive(a.userId) ? "#fff" : "rgba(255,255,255,.65)" }}>{a.username}</span>
                    </div>
                  </div>
                ))}
              </>
            )}

            {amigos.length === 0 && recientes.length === 0 && (
              <div style={{ padding:"14px 15px", fontSize:10, color:"rgba(255,255,255,.25)", fontFamily:"'IBM Plex Mono',monospace", lineHeight:1.7 }}>
                sin amigos aún —{" "}
                <span style={{ color:"rgba(255,255,255,.6)", cursor:"pointer", textDecoration:"underline" }} onClick={() => router.push("/amigos")}>
                  ir a amigos
                </span>
              </div>
            )}
          </div>

          <div onClick={() => setShowBuscar(!showBuscar)}
            style={{ padding:"10px 15px", borderTop:"1px solid rgba(255,255,255,.05)", display:"flex", gap:8, alignItems:"center", cursor:"pointer", transition:"background .15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.02)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <div style={{ width:22, height:22, borderRadius:"50%", background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:"rgba(255,255,255,.3)", lineHeight:1 }}>+</div>
            <span style={{ fontSize:9, color:"rgba(255,255,255,.28)", fontFamily:"'IBM Plex Mono',monospace", letterSpacing:".06em" }}>nueva conversación</span>
          </div>
        </div>

        {/* ── ÁREA DE CHAT ── */}
        {activeChat ? (
          <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, background:"#000" }}>

            <div style={{ padding:"12px 22px", background:"#000", borderBottom:"1px solid rgba(255,255,255,.07)", display:"flex", alignItems:"center", gap:14 }}>
              <div className="avatar" style={{ width:36, height:36 }}>
                ◈
                <div className="status-dot-hdr" style={{ background: isOnline(activeChat.userId) ? "#3ddc84" : "#2a2a2a" }} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:17, color:"#fff", lineHeight:1 }}>{activeChat.username}</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color: isOnline(activeChat.userId) ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.2)", letterSpacing:".1em", marginTop:3 }}>
                  {isOnline(activeChat.userId) ? "en línea ahora" : "desconectado"}
                </div>
              </div>
            </div>

            <div style={{ flex:1, overflowY:"auto", padding:"18px 22px", display:"flex", flexDirection:"column" }}>
              {loading ? (
                <div style={{ textAlign:"center", paddingTop:60 }}><span className="spinner" /></div>
              ) : mensajes.length === 0 ? (
                <div style={{ textAlign:"center", padding:"80px 0", color:"rgba(255,255,255,.18)" }}>
                  <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:20, marginBottom:8 }}>{activeChat.username}</div>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, letterSpacing:".1em" }}>inicio de la conversación</div>
                </div>
              ) : (
                mensajes.map((msg, i) => {
                  const esPropio = msg.emisorId === parseInt(session?.user?.dbId) || msg.emisor?.id === parseInt(session?.user?.dbId);
                  const prevMsg  = mensajes[i - 1];
                  const showDate = !prevMsg || formatDate(msg.creadoEn) !== formatDate(prevMsg.creadoEn);
                  const prevSame = prevMsg && prevMsg.emisorId === msg.emisorId && (new Date(msg.creadoEn) - new Date(prevMsg.creadoEn)) < 60000;

                  return (
                    <div key={msg.id || i} style={{ marginBottom: prevSame ? 3 : 14 }}>
                      {showDate && <div className="date-pill"><span>{formatDate(msg.creadoEn)}</span></div>}
                      <div style={{ display:"flex", gap:8, flexDirection: esPropio ? "row-reverse" : "row", alignItems:"flex-end" }}>
                        <div style={{ width:30, flexShrink:0 }}>
                          {!prevSame
                            ? <div className="avatar-sm">{esPropio ? "◎" : "◈"}</div>
                            : <div style={{ width:30 }} />
                          }
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", alignItems: esPropio ? "flex-end" : "flex-start", maxWidth:"60%" }}>
                          {!prevSame && (
                            <div style={{ fontSize:11, fontFamily:"'DM Serif Display',serif", color:"rgba(255,255,255,.48)", marginBottom:4, paddingLeft: esPropio ? 0 : 2, paddingRight: esPropio ? 2 : 0 }}>
                              {esPropio ? "Tú" : msg.emisor?.username}
                            </div>
                          )}
                          <Bubble
                            msg={msg}
                            esPropio={esPropio}
                            replyMsg={null}
                            onReply={(m) => { setReplyingTo(m); inputRef.current?.focus(); }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* ── TYPING INDICATOR ── */}
              {isTyping && <TypingIndicator username={activeChat.username} />}
              <div ref={messagesEndRef} />
            </div>

            {replyingTo && (
              <div style={{ padding:"8px 20px", background:"rgba(255,255,255,.03)", borderTop:"1px solid rgba(255,255,255,.06)", display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:3, borderRadius:2, height:28, background:"rgba(255,255,255,.45)", flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:9, fontFamily:"'IBM Plex Mono',monospace", color:"rgba(255,255,255,.42)", marginBottom:2 }}>
                    Respondiendo a{" "}
                    <span style={{ color:"rgba(255,255,255,.72)" }}>
                      {replyingTo.emisorId === parseInt(session?.user?.dbId) ? "ti mismo" : replyingTo.emisor?.username}
                    </span>
                  </div>
                  <div style={{ fontSize:11, fontFamily:"'IBM Plex Sans',sans-serif", color:"rgba(255,255,255,.28)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {replyingTo.contenido}
                  </div>
                </div>
                <span onClick={() => setReplyingTo(null)}
                  style={{ fontSize:16, color:"rgba(255,255,255,.22)", cursor:"pointer", transition:"color .15s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,.8)"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.22)"}
                >✕</span>
              </div>
            )}

            <div style={{ padding:"10px 18px 14px", background:"#000", borderTop:"1px solid rgba(255,255,255,.07)", display:"flex", gap:10, alignItems:"center" }}>
              <div className="input-wrap">
                <input
                  ref={inputRef}
                  className="chat-input"
                  placeholder={replyingTo ? "↩ responder..." : "Escribe un mensaje..."}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                />
                <button className="send-arrow" onClick={sendMessage} disabled={!input.trim()}>↑</button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16, background:"#000" }}>
            <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:24, color:"rgba(255,255,255,.12)" }}>Mensajes</div>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, letterSpacing:".15em", color:"rgba(255,255,255,.2)" }}>selecciona una conversación</div>
            <button onClick={() => setShowBuscar(true)}
              style={{ marginTop:6, background:"transparent", border:"1px solid rgba(255,255,255,.15)", color:"rgba(255,255,255,.5)", fontFamily:"'IBM Plex Mono',monospace", fontSize:9, letterSpacing:".2em", padding:"9px 22px", cursor:"pointer", transition:"all .2s", borderRadius:2 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(255,255,255,.4)"; e.currentTarget.style.color="#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(255,255,255,.15)"; e.currentTarget.style.color="rgba(255,255,255,.5)"; }}
            >
              + nueva conversación
            </button>
          </div>
        )}
      </div>
    </>
  );
}
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import Navbar from "@/components/Navbar";

let socket = null;

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
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth");
  }, [status, router]);

  useEffect(() => {
    const s = document.createElement("style");
    s.id = "chat-styles";
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Cinzel:wght@400;600;900&display=swap');
      @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      @keyframes fadeIn  { from{opacity:0;transform:translateY(3px)} to{opacity:1;transform:translateY(0)} }
      @keyframes fadeInL { from{opacity:0;transform:translateX(-5px)} to{opacity:1;transform:translateX(0)} }
      @keyframes fadeInR { from{opacity:0;transform:translateX(5px)} to{opacity:1;transform:translateX(0)} }

      body { background:#000; color:#e8e4d9; font-family:'Space Mono',monospace; font-size:13px; overflow:hidden; }

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
      ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:2px}

      .conv-item {
        padding: 10px 16px; cursor: pointer;
        border-left: 2px solid transparent;
        transition: all .15s;
        border-bottom: 1px solid rgba(255,255,255,.04);
      }
      .conv-item:hover { background: rgba(255,255,255,.05); }
      .conv-item.active { background: rgba(255,255,255,.08); border-left-color: rgba(255,255,255,.6); }

      .amigo-item {
        padding: 8px 16px; cursor: pointer;
        border-bottom: 1px solid rgba(255,255,255,.03);
        display: flex; align-items: center; gap: 10px;
        transition: background .15s;
      }
      .amigo-item:hover { background: rgba(255,255,255,.04); }
      .amigo-item.active { background: rgba(255,255,255,.08); border-left: 2px solid rgba(255,255,255,.6); }

      .bubble-me {
        background: rgba(255,255,255,.1);
        border: 1px solid rgba(255,255,255,.18);
        border-bottom-right-radius: 2px;
        padding: 8px 12px;
        max-width: 72%;
        font-size: 13px;
        line-height: 1.6;
        color: #fff;
        word-break: break-word;
        animation: fadeInR .15s ease;
      }

      .bubble-other {
        background: rgba(255,255,255,.05);
        border: 1px solid rgba(255,255,255,.08);
        border-bottom-left-radius: 2px;
        padding: 8px 12px;
        max-width: 72%;
        font-size: 13px;
        line-height: 1.6;
        color: #e8e4d9;
        word-break: break-word;
        animation: fadeInL .15s ease;
      }

      .msg-time {
        font-size: 9px; color: rgba(255,255,255,.2);
        margin-top: 2px; letter-spacing: .04em;
      }

      .chat-input {
        flex: 1;
        background: rgba(255,255,255,.05);
        border: 1px solid rgba(255,255,255,.12);
        border-right: none;
        color: #fff;
        font-family: 'Space Mono', monospace;
        font-size: 12px; padding: 12px 16px; outline: none;
        transition: border-color .2s, background .2s;
      }
      .chat-input:focus { border-color: rgba(255,255,255,.3); background: rgba(255,255,255,.07); }
      .chat-input::placeholder { color: rgba(255,255,255,.25); }

      .send-btn {
        background: rgba(255,255,255,.08);
        border: 1px solid rgba(255,255,255,.12);
        color: rgba(255,255,255,.7);
        font-family: 'Space Mono', monospace;
        font-size: 10px; padding: 12px 18px;
        cursor: pointer; letter-spacing: .18em;
        transition: all .2s; white-space: nowrap;
      }
      .send-btn:hover { background: rgba(255,255,255,.16); color: #fff; border-color: rgba(255,255,255,.28); }
      .send-btn:disabled { opacity: .22; cursor: not-allowed; }

      .section-label {
        font-size: 8px; letter-spacing: .3em;
        color: rgba(255,255,255,.28);
        padding: 9px 16px 3px; text-transform: uppercase;
      }

      .online-dot  { width:6px; height:6px; border-radius:50%; background:#3ddc84; display:inline-block; flex-shrink:0; }
      .offline-dot { width:6px; height:6px; border-radius:50%; background:#444;    display:inline-block; flex-shrink:0; }

      .buscar-input {
        width: 100%; box-sizing: border-box;
        background: rgba(255,255,255,.06);
        border: 1px solid rgba(255,255,255,.14);
        color: #fff; font-family: 'Space Mono', monospace;
        font-size: 11px; padding: 8px 12px; outline: none;
        transition: border-color .2s;
      }
      .buscar-input:focus { border-color: rgba(255,255,255,.32); }
      .buscar-input::placeholder { color: rgba(255,255,255,.28); }

      .resultado-item {
        display: flex; align-items: center; justify-content: space-between;
        padding: 8px 12px; cursor: pointer;
        border-bottom: 1px solid rgba(255,255,255,.04);
        transition: background .15s;
      }
      .resultado-item:hover { background: rgba(255,255,255,.06); }

      .nuevo-btn {
        width: 100%; background: transparent; border: none;
        border-top: 1px solid rgba(255,255,255,.06);
        color: rgba(255,255,255,.4);
        font-family: 'Space Mono', monospace; font-size: 9px;
        letter-spacing: .2em; padding: 9px 16px;
        cursor: pointer; text-align: left; transition: all .2s; flex-shrink: 0;
      }
      .nuevo-btn:hover { color: #fff; background: rgba(255,255,255,.04); }

      .spinner {
        width:10px; height:10px;
        border:1px solid rgba(255,255,255,.15); border-top-color:#fff;
        border-radius:50%; animation:spin .7s linear infinite; display:inline-block;
      }

      .date-sep {
        display: flex; align-items: center; gap: 10px;
        margin: 12px 0 6px;
      }
      .date-sep::before, .date-sep::after {
        content:''; flex:1; height:1px; background:rgba(255,255,255,.05);
      }
      .date-sep span { font-size: 9px; color: rgba(255,255,255,.22); letter-spacing: .1em; }
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
    return () => { socket?.disconnect(); socket = null; };
  }, [status, session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

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
    const chatUser = { userId: user.userId || user.id, username: user.username };
    setActiveChat(chatUser);
    setLoading(true); setMensajes([]);
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

  const sendMessage = () => {
    if (!input.trim() || !activeChat || !socket || !session?.user?.dbId) return;
    socket.emit("message:send", {
      emisorId:   session.user.dbId,
      receptorId: activeChat.userId,
      contenido:  input.trim(),
    });
    setInput("");
  };

  const isOnline = (id) => onlineUsers.includes(String(id));
  const isActive = (id) => activeChat?.userId === id;

  const formatTime = (d) => d ? new Date(d).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }) : "";
  const formatDate = (d) => {
    if (!d) return "";
    const date = new Date(d);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "hoy";
    if (date.toDateString() === yesterday.toDateString()) return "ayer";
    return date.toLocaleDateString("es-MX", { day: "numeric", month: "long" });
  };

  if (status === "loading") return null;

  return (
    <>
      <Navbar />

      <div style={{ display: "flex", height: "calc(100vh - 48px)", marginTop: 48 }}>

        {/* ── SIDEBAR ── */}
        <div style={{ width: 240, borderRight: "1px solid rgba(255,255,255,.07)", background: "rgba(0,0,0,.75)", display: "flex", flexDirection: "column", flexShrink: 0 }}>

          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,.07)", fontFamily: "'Cinzel', serif", fontSize: 12, color: "#fff", letterSpacing: ".25em", flexShrink: 0 }}>
            MENSAJES
          </div>

          {showBuscar && (
            <div style={{ padding: "9px 12px", borderBottom: "1px solid rgba(255,255,255,.06)", flexShrink: 0 }}>
              <div style={{ position: "relative" }}>
                <input className="buscar-input" placeholder="buscar usuario..." value={busqueda}
                  onChange={e => setBusqueda(e.target.value)} autoFocus />
                {buscando && <span className="spinner" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }} />}
              </div>
              {resultados.length > 0 && (
                <div style={{ marginTop: 4, border: "1px solid rgba(255,255,255,.08)", maxHeight: 160, overflowY: "auto" }}>
                  {resultados.map(u => (
                    <div key={u.id} className="resultado-item" onClick={() => openChat(u)}>
                      <div>
                        <div style={{ fontSize: 12, color: "#fff" }}>@{u.username}</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,.38)" }}>{u.nombre}</div>
                      </div>
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,.3)" }}>→</span>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => { setShowBuscar(false); setBusqueda(""); setResultados([]); }}
                style={{ marginTop: 5, fontSize: 9, color: "rgba(255,255,255,.32)", background: "none", border: "none", cursor: "pointer", letterSpacing: ".1em" }}>
                ✕ cancelar
              </button>
            </div>
          )}

          <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
            {recientes.length > 0 && (
              <>
                <div className="section-label">† recientes</div>
                {recientes.map(c => (
                  <div key={c.userId} className={`conv-item${isActive(c.userId) ? " active" : ""}`} onClick={() => openChat(c)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                      <span className={isOnline(c.userId) ? "online-dot" : "offline-dot"} />
                      <span style={{ fontSize: 12, color: "#fff", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.username}</span>
                      {c.unread > 0 && (
                        <span style={{ background: "#cc3344", color: "#fff", fontSize: 8, padding: "1px 5px", minWidth: 14, textAlign: "center" }}>{c.unread}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,.38)", paddingLeft: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.lastMsg}
                    </div>
                  </div>
                ))}
              </>
            )}

            {amigos.length > 0 && (
              <>
                <div className="section-label" style={{ marginTop: recientes.length > 0 ? 3 : 0 }}>† amigos</div>
                {amigos.map(a => (
                  <div key={a.userId} className={`amigo-item${isActive(a.userId) ? " active" : ""}`} onClick={() => openChat(a)}>
                    <span className={isOnline(a.userId) ? "online-dot" : "offline-dot"} />
                    <span style={{ fontSize: 12, color: isActive(a.userId) ? "#fff" : "rgba(255,255,255,.72)" }}>{a.username}</span>
                  </div>
                ))}
              </>
            )}

            {amigos.length === 0 && recientes.length === 0 && (
              <div style={{ padding: "12px 16px", fontSize: 11, color: "rgba(255,255,255,.28)", lineHeight: 1.7 }}>
                sin amigos aún —{" "}
                <span style={{ color: "rgba(255,255,255,.6)", cursor: "pointer", textDecoration: "underline" }} onClick={() => router.push("/amigos")}>
                  ir a amigos
                </span>
              </div>
            )}
          </div>

          <button className="nuevo-btn" onClick={() => setShowBuscar(!showBuscar)}>
            + nueva conversación
          </button>

          <div style={{ padding: "9px 16px", borderTop: "1px solid rgba(255,255,255,.06)", display: "flex", gap: 9, alignItems: "center", flexShrink: 0 }}>
            <div style={{ width: 22, height: 22, background: "#0a0a0a", border: "1px solid rgba(255,255,255,.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "rgba(255,255,255,.38)", flexShrink: 0 }}>◈</div>
            <div>
              <div style={{ fontSize: 11, color: "#fff" }}>{session?.user?.name?.split(" ")[0] || "tú"}</div>
              <div style={{ fontSize: 9, color: "#3ddc84", display: "flex", alignItems: "center", gap: 3 }}>
                <span className="online-dot" style={{ width: 4, height: 4 }} /> online
              </div>
            </div>
          </div>
        </div>

        {/* ── ÁREA DE CHAT ── */}
        {activeChat ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "rgba(0,0,0,.25)" }}>

            <div style={{ padding: "11px 20px", borderBottom: "1px solid rgba(255,255,255,.07)", display: "flex", alignItems: "center", gap: 11, flexShrink: 0, background: "rgba(0,0,0,.35)" }}>
              <div style={{ width: 28, height: 28, background: "#0a0a0a", border: "1px solid rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "rgba(255,255,255,.35)" }}>◈</div>
              <div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: "#fff", letterSpacing: ".1em" }}>{activeChat.username}</div>
                <div style={{ fontSize: 9, color: isOnline(activeChat.userId) ? "#3ddc84" : "rgba(255,255,255,.28)", display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}>
                  <span className={isOnline(activeChat.userId) ? "online-dot" : "offline-dot"} style={{ width: 4, height: 4 }} />
                  {isOnline(activeChat.userId) ? "en línea" : "desconectado"}
                </div>
              </div>
            </div>

            {/* Mensajes */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", display: "flex", flexDirection: "column" }}>
              {loading ? (
                <div style={{ textAlign: "center", color: "rgba(255,255,255,.28)", fontSize: 12, paddingTop: 50 }}>
                  <span className="spinner" />
                </div>
              ) : mensajes.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,.18)" }}>
                  <div style={{ fontSize: 16, marginBottom: 8, fontFamily: "'Cinzel', serif", letterSpacing: ".1em" }}>† {activeChat.username}</div>
                  <div style={{ fontSize: 10, letterSpacing: ".1em" }}>inicio de la conversación</div>
                </div>
              ) : (
                mensajes.map((msg, i) => {
                  const esPropio = msg.emisorId === parseInt(session?.user?.dbId) ||
                                   msg.emisor?.id === parseInt(session?.user?.dbId);
                  const prevMsg  = mensajes[i - 1];
                  const showDate = !prevMsg || formatDate(msg.creadoEn) !== formatDate(prevMsg.creadoEn);
                  const prevSame = prevMsg &&
                    prevMsg.emisorId === msg.emisorId &&
                    (new Date(msg.creadoEn) - new Date(prevMsg.creadoEn)) < 60000;

                  return (
                    <div key={msg.id || i} style={{ marginTop: prevSame ? 1 : 6 }}>
                      {showDate && (
                        <div className="date-sep">
                          <span>{formatDate(msg.creadoEn)}</span>
                        </div>
                      )}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: esPropio ? "flex-end" : "flex-start" }}>
                        {!esPropio && !prevSame && (
                          <div style={{ fontSize: 9, color: "rgba(255,255,255,.35)", marginBottom: 2, paddingLeft: 2 }}>
                            {msg.emisor?.username}
                          </div>
                        )}
                        <div className={esPropio ? "bubble-me" : "bubble-other"}>
                          {msg.contenido}
                        </div>
                        <div className="msg-time" style={{ paddingLeft: esPropio ? 0 : 2, paddingRight: esPropio ? 2 : 0 }}>
                          {formatTime(msg.creadoEn)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,.07)", display: "flex", flexShrink: 0, background: "rgba(0,0,0,.35)" }}>
              <input
                ref={inputRef}
                className="chat-input"
                placeholder="escribe un mensaje..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              />
              <button className="send-btn" onClick={sendMessage} disabled={!input.trim()}>
                ENVIAR
              </button>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 22, color: "rgba(255,255,255,.12)", fontFamily: "'Cinzel', serif", letterSpacing: ".25em" }}>† MENSAJES</div>
            <div style={{ fontSize: 10, letterSpacing: ".15em", color: "rgba(255,255,255,.25)" }}>selecciona una conversación</div>
            <button
              onClick={() => setShowBuscar(true)}
              style={{ marginTop: 6, background: "transparent", border: "1px solid rgba(255,255,255,.18)", color: "rgba(255,255,255,.55)", fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: ".2em", padding: "9px 22px", cursor: "pointer", transition: "all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.45)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.18)"; e.currentTarget.style.color = "rgba(255,255,255,.55)"; }}
            >
              + nueva conversación
            </button>
          </div>
        )}
      </div>
    </>
  );
}
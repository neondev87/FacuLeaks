"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import Navbar from "@/components/Navbar";

let socket = null;

// ── CHAT PAGE ─────────────────────────────────────────────────
export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [amigos,      setAmigos]      = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [activeChat,  setActiveChat]  = useState(null); // { userId, username }
  const [mensajes,    setMensajes]    = useState([]);
  const [input,       setInput]       = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  const ac = "#ffffff";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth");
  }, [status, router]);

  // ── Estilos ──
  useEffect(() => {
    const s = document.createElement("style");
    s.id = "chat-styles";
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Cinzel:wght@400;600;900&display=swap');

      body { background:#000; color:#e8e4d9; font-family:'Space Mono',monospace; font-size:13px; overflow:hidden; }

      body::before {
        content:''; position:fixed; inset:0;
        background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
        opacity:.05; pointer-events:none; z-index:9998;
      }
      body::after {
        content:''; position:fixed; inset:0;
        background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.15) 2px,rgba(0,0,0,.15) 4px);
        pointer-events:none; z-index:9999;
      }

      ::-webkit-scrollbar{width:4px}
      ::-webkit-scrollbar-track{background:#000}
      ::-webkit-scrollbar-thumb{background:#222}

      .nav {
        position:fixed; top:0; left:0; right:0; height:48px;
        border-bottom:1px solid rgba(255,255,255,.08);
        background:rgba(0,0,0,.94);
        display:flex; align-items:center; justify-content:space-between;
        padding:0 28px; z-index:200; backdrop-filter:blur(4px);
      }
      .nav-logo { font-family:'Cinzel',serif; font-size:15px; letter-spacing:.3em; color:#fff; cursor:pointer; opacity:.9; }
      .nav-logo:hover { opacity:1; }
      .nav-link { font-size:12px; letter-spacing:.2em; color:#555; cursor:pointer; transition:color .2s; text-transform:uppercase; background:none; border:none; font-family:'Space Mono',monospace; }
      .nav-link:hover, .nav-link.active { color:#fff; }

      .conv-item {
        padding: 10px 14px;
        cursor: pointer;
        border-left: 2px solid transparent;
        transition: all .15s;
        border-bottom: 1px solid rgba(255,255,255,.03);
      }
      .conv-item:hover { background: rgba(255,255,255,.03); }
      .conv-item.active { background: rgba(255,255,255,.07); border-left-color: #fff; }

      .msg-bubble-me {
        background: rgba(255,255,255,.08);
        border: 1px solid rgba(255,255,255,.1);
        padding: 8px 12px;
        max-width: 68%;
        margin-left: auto;
        font-size: 13px;
        line-height: 1.5;
        color: #e8e4d9;
      }
      .msg-bubble-other {
        background: rgba(255,255,255,.04);
        border: 1px solid rgba(255,255,255,.06);
        padding: 8px 12px;
        max-width: 68%;
        font-size: 13px;
        line-height: 1.5;
        color: rgba(232,228,217,.8);
      }

      .chat-input {
        flex: 1;
        background: rgba(255,255,255,.05);
        border: 1px solid rgba(255,255,255,.08);
        color: #e8e4d9;
        font-family: 'Space Mono', monospace;
        font-size: 12px;
        padding: 11px 16px;
        outline: none;
        transition: border-color .2s;
      }
      .chat-input:focus { border-color: rgba(255,255,255,.25); }
      .chat-input::placeholder { color: rgba(255,255,255,.2); }

      .send-btn {
        background: rgba(255,255,255,.08);
        border: 1px solid rgba(255,255,255,.2);
        color: #fff;
        font-family: 'Space Mono', monospace;
        font-size: 11px;
        padding: 11px 20px;
        cursor: pointer;
        letter-spacing: .15em;
        transition: all .2s;
      }
      .send-btn:hover { background: rgba(255,255,255,.15); }
      .send-btn:disabled { opacity: .3; cursor: not-allowed; }

      .section-label {
        font-size: 9px;
        letter-spacing: .25em;
        color: #333;
        padding: 10px 14px 4px;
        text-transform: uppercase;
      }

      .online-dot {
        width: 7px; height: 7px;
        border-radius: 50%;
        background: #3ddc84;
        display: inline-block;
        flex-shrink: 0;
      }
      .offline-dot {
        width: 7px; height: 7px;
        border-radius: 50%;
        background: #333;
        display: inline-block;
        flex-shrink: 0;
      }
    `;
    document.head.appendChild(s);
    return () => document.getElementById("chat-styles")?.remove();
  }, []);

  // ── Conectar Socket.io ──
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;

    socket = io("http://localhost:4000");
    socket.emit("user:connect", session.user.id);

    socket.on("users:online", (users) => setOnlineUsers(users));

    socket.on("message:receive", (msg) => {
      setMensajes(prev => [...prev, msg]);
      loadConversaciones();
    });

    socket.on("message:sent", (msg) => {
      setMensajes(prev => [...prev, msg]);
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [status, session]);

  // ── Scroll al último mensaje ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  // ── Cargar conversaciones ──
  const loadConversaciones = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:4000/api/chat/conversaciones", { credentials: "include" });
      const data = await res.json();
      setAmigos(data.amigos || []);
      setSolicitudes(data.solicitudes || []);
    } catch {}
  }, []);

  useEffect(() => {
    if (status === "authenticated") loadConversaciones();
  }, [status, loadConversaciones]);

  // ── Abrir conversación ──
  const openChat = async (user) => {
    setActiveChat(user);
    setLoading(true);
    setMensajes([]);
    try {
      const res = await fetch(`http://localhost:4000/api/chat/${user.userId}`, { credentials: "include" });
      const data = await res.json();
      setMensajes(data.mensajes || []);

      // Marcar como leídos
      if (socket && session?.user?.id) {
        socket.emit("messages:read", { emisorId: user.userId, receptorId: session.user.id });
      }
    } catch {}
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // ── Enviar mensaje ──
  const sendMessage = () => {
    if (!input.trim() || !activeChat || !socket || !session?.user?.id) return;

    socket.emit("message:send", {
      emisorId:   session.user.id,
      receptorId: activeChat.userId,
      contenido:  input.trim(),
    });

    setInput("");
  };

  const isOnline = (userId) => onlineUsers.includes(String(userId));

  if (status === "loading") return null;

  // ── Componente de item de conversación ──
  const ConvItem = ({ conv }) => (
    <div
      className={`conv-item${activeChat?.userId === conv.userId ? " active" : ""}`}
      onClick={() => openChat(conv)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
        <span className={isOnline(conv.userId) ? "online-dot" : "offline-dot"} />
        <span style={{ fontSize: 13, color: activeChat?.userId === conv.userId ? "#fff" : "#e8e4d9", letterSpacing: ".03em" }}>
          {conv.username}
        </span>
        {conv.unread > 0 && (
          <span style={{ marginLeft: "auto", background: "#cc3344", color: "#fff", fontSize: 9, padding: "1px 5px", minWidth: 16, textAlign: "center" }}>
            {conv.unread}
          </span>
        )}
      </div>
      <div style={{ fontSize: 11, color: "#444", letterSpacing: ".02em", paddingLeft: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {conv.lastMsg}
      </div>
    </div>
  );

  return (
    <>
      {/* ── NAVBAR ── */}
        <Navbar />
      {/* ── LAYOUT CHAT ── */}
      <div style={{ display: "flex", height: "calc(100vh - 48px)", marginTop: 48 }}>

        {/* ── SIDEBAR ── */}
        <div style={{ width: 240, borderRight: "1px solid rgba(255,255,255,.07)", background: "rgba(0,0,0,.5)", display: "flex", flexDirection: "column", flexShrink: 0 }}>

          {/* Header */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,.07)", fontFamily: "'Cinzel', serif", fontSize: 13, color: ac, letterSpacing: ".2em" }}>
            MENSAJES
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>

            {/* Amigos */}
            <div className="section-label">† amigos</div>
            {amigos.length === 0 ? (
              <div style={{ padding: "8px 14px", fontSize: 11, color: "#333" }}>sin conversaciones</div>
            ) : (
              amigos.map(c => <ConvItem key={c.userId} conv={c} />)
            )}

            {/* Solicitudes / otros */}
            {solicitudes.length > 0 && (
              <>
                <div className="section-label" style={{ marginTop: 8 }}>† solicitudes</div>
                {solicitudes.map(c => <ConvItem key={c.userId} conv={c} />)}
              </>
            )}
          </div>

          {/* Usuario activo */}
          <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,.07)", display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 26, height: 26, background: "#0a0a0a", border: `1px solid ${ac}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: `${ac}55`, flexShrink: 0 }}>◈</div>
            <div>
              <div style={{ fontSize: 12, color: "#e8e4d9" }}>{session?.user?.name?.split(" ")[0] || "tú"}</div>
              <div style={{ fontSize: 10, color: "#3ddc84", display: "flex", alignItems: "center", gap: 4 }}>
                <span className="online-dot" style={{ width: 5, height: 5 }} /> online
              </div>
            </div>
          </div>
        </div>

        {/* ── ÁREA DE CHAT ── */}
        {activeChat ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

            {/* Header del chat */}
            <div style={{ padding: "12px 24px", borderBottom: "1px solid rgba(255,255,255,.07)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
              <span className={isOnline(activeChat.userId) ? "online-dot" : "offline-dot"} />
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: 15, color: ac }}>
                {activeChat.username}
              </span>
              <span style={{ fontSize: 11, color: isOnline(activeChat.userId) ? "#3ddc84" : "#333" }}>
                {isOnline(activeChat.userId) ? "online" : "offline"}
              </span>
            </div>

            {/* Mensajes */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
              {loading ? (
                <div style={{ textAlign: "center", color: "#333", fontSize: 12 }}>cargando...</div>
              ) : mensajes.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#333" }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>◈</div>
                  <div style={{ fontSize: 12, letterSpacing: ".1em" }}>inicio de la conversación</div>
                </div>
              ) : (
                mensajes.map((msg, i) => {
                  const esPropio = msg.emisorId === parseInt(session?.user?.id) || msg.emisor?.id === parseInt(session?.user?.id);
                  return (
                    <div key={msg.id || i} style={{ display: "flex", flexDirection: "column", alignItems: esPropio ? "flex-end" : "flex-start" }}>
                      {!esPropio && (
                        <div style={{ fontSize: 10, color: "#444", marginBottom: 3, paddingLeft: 4 }}>
                          {msg.emisor?.username}
                        </div>
                      )}
                      <div className={esPropio ? "msg-bubble-me" : "msg-bubble-other"}>
                        {msg.contenido}
                      </div>
                      <div style={{ fontSize: 9, color: "#333", marginTop: 3, paddingLeft: 4, paddingRight: 4 }}>
                        {msg.creadoEn ? new Date(msg.creadoEn).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }) : ""}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: "14px 24px", borderTop: "1px solid rgba(255,255,255,.07)", display: "flex", gap: 10, flexShrink: 0 }}>
              <input
                ref={inputRef}
                className="chat-input"
                placeholder={`mensaje para ${activeChat.username}...`}
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
          /* Estado vacío */
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "#333" }}>
            <div style={{ fontSize: 32 }}>◈</div>
            <div style={{ fontSize: 13, letterSpacing: ".15em" }}>selecciona una conversación</div>
            <div style={{ fontSize: 11, letterSpacing: ".08em", color: "#222" }}>o inicia una nueva desde un perfil</div>
          </div>
        )}
      </div>
    </>
  );
}
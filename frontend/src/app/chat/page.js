"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import Navbar from "@/components/Navbar";
import BgCross from "@/components/BgCross";

const API = "http://localhost:4000";
let socket = null;

const FLAME_MAP = [
  [0,0,0,0,1,1,0,0,0,0],[0,0,0,1,2,2,1,0,0,0],[0,0,0,1,3,2,1,1,0,0],
  [0,0,1,2,4,3,2,1,0,0],[0,1,2,3,5,4,3,1,0,0],[0,1,3,4,5,5,4,2,1,0],
  [1,2,4,5,5,5,4,3,1,0],[1,3,4,5,5,5,5,4,2,1],[1,2,3,4,5,5,4,3,1,0],
  [0,1,2,3,4,4,3,2,1,0],[0,0,1,2,3,3,2,1,0,0],[0,0,0,1,2,2,1,0,0,0],
  [0,0,0,0,1,1,0,0,0,0],
];
const FC_HOT  = { 1:"#7a0000", 2:"#c41800", 3:"#ff5500", 4:"#ffaa00", 5:"#ffe566" };
const FC_COLD = { 1:"#2a2a2a", 2:"#3a3a3a", 3:"#4a4a4a", 4:"#5a5a5a", 5:"#6a6a6a" };

function PixelFlame({ s=3, dying=false }) {
  const C = dying ? FC_COLD : FC_HOT;
  return (
    <svg width={10*s} height={13*s} viewBox={`0 0 ${10*s} ${13*s}`}
      style={{ display:"block", animation: !dying ? "flicker 1.6s ease-in-out infinite" : "none" }}>
      {FLAME_MAP.map((row, r) => row.map((cell, c) =>
        cell ? <rect key={`${r}-${c}`} x={c*s} y={r*s} width={s} height={s} fill={C[cell]} /> : null
      ))}
    </svg>
  );
}

function StreakC({ dying=false, count=1, progress=1.0 }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5, padding:"7px 10px", background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.06)", borderRadius:3, width:90, flexShrink:0 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <PixelFlame s={3} dying={dying} />
        <span style={{ fontSize:18, fontWeight:500, fontFamily:"'IBM Plex Mono',monospace", color: dying ? "#404040" : "#ffaa00", letterSpacing:"-.04em", transition:"color .4s" }}>{count}</span>
      </div>
      <div style={{ height:2, background: dying ? "rgba(255,255,255,.05)" : "rgba(255,140,0,.12)", borderRadius:1, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${progress*100}%`, background: dying ? "#333" : "#ff6600", borderRadius:1, transition:"width .4s, background .4s", animation: dying ? "pulse 2s ease-in-out infinite" : "none" }}/>
      </div>
      <div style={{ fontSize:7, letterSpacing:".1em", fontFamily:"'IBM Plex Mono',monospace", color: dying ? "#333" : "rgba(255,140,0,.4)", transition:"color .4s" }}>
        {dying ? "12H · EXPIRA" : "24H · ACTIVO"}
      </div>
    </div>
  );
}

function MicIcon({ size=18, recording=false }) {
  const col = recording ? "#3ddc84" : "rgba(255,255,255,.6)";
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={{ display:"block" }}>
      <rect x="6.5" y="2" width="5" height="8" rx="2.5" stroke={col} strokeWidth=".8" fill="none"/>
      <path d="M3.5 9.5 C3.5 13 14.5 13 14.5 9.5" stroke={col} strokeWidth=".8" strokeLinecap="round" fill="none"/>
      <line x1="9" y1="13.2" x2="9" y2="15.5" stroke={col} strokeWidth=".8" strokeLinecap="round"/>
      <line x1="6.5" y1="15.5" x2="11.5" y2="15.5" stroke={col} strokeWidth=".8" strokeLinecap="round"/>
    </svg>
  );
}

const BARS = [0.3, 0.8, 0.5, 1, 0.6, 0.9, 0.4, 0.7, 0.5, 0.8, 0.4, 1, 0.6];

function AudioIndicator({ username, label="mandando audio" }) {
  return (
    <div style={{ display:"flex", gap:10, alignItems:"flex-end", marginBottom:10, animation:"fadeUp .18s ease" }}>
      <div className="avatar-sm">◈</div>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-start" }}>
        <div style={{ fontSize:9, fontFamily:"'IBM Plex Mono',monospace", color:"rgba(255,255,255,.28)", marginBottom:3, letterSpacing:".08em" }}>{username}</div>
        <div style={{ background:"#0d0d0d", borderRadius:3, padding:"10px 14px", border:"1px solid rgba(255,255,255,.08)", display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:"rgba(255,255,255,.35)", letterSpacing:".08em", marginRight:4 }}>{label}</span>
          {BARS.map((h, i) => (
            <div key={i} style={{ width:2.5, borderRadius:2, background:"rgba(61,220,132,.7)", height:`${h*16}px`, animation:`wave 0.9s ease ${i*0.06}s infinite`, transformOrigin:"center" }}/>
          ))}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator({ username }) {
  const frames = ["_", "._", ".._", "..._"];
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setFrame(f => (f + 1) % frames.length), 380);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ display:"flex", gap:10, alignItems:"flex-end", marginBottom:10, animation:"fadeUp .18s ease" }}>
      <div className="avatar-sm">◈</div>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-start" }}>
        <div style={{ fontSize:9, fontFamily:"'IBM Plex Mono',monospace", color:"rgba(255,255,255,.28)", marginBottom:3, letterSpacing:".08em" }}>{username}</div>
        <div style={{ background:"#0d0d0d", borderRadius:3, padding:"8px 14px", border:"1px solid rgba(255,255,255,.08)", display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:"rgba(255,255,255,.25)", letterSpacing:".04em" }}>escribiendo</span>
          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:"rgba(255,255,255,.55)", letterSpacing:".04em", minWidth:28, display:"inline-block" }}>{frames[frame]}</span>
          <span style={{ display:"inline-block", width:7, height:13, background:"rgba(255,255,255,.45)", animation:"blink 1s step-end infinite", verticalAlign:"middle", marginLeft:1 }} />
        </div>
      </div>
    </div>
  );
}

function AudioReplyPreview({ src }) {
  const [dur, setDur] = useState("...");
  useEffect(() => {
    const a = new Audio(`${API}${src}`);
    a.onloadedmetadata = () => {
      const s = Math.floor(a.duration);
      setDur(`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`);
    };
  }, [src]);
  return <span>🎤 {dur}</span>;
}

function AudioPlayer({ src, esPropio }) {
  const [playing,  setPlaying]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  const fmt = s => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`;
  const textCol = esPropio ? "rgba(0,0,0,.7)"  : "rgba(255,255,255,.7)";
  const barBg   = esPropio ? "rgba(0,0,0,.15)" : "rgba(255,255,255,.15)";
  const barFill = esPropio ? "rgba(0,0,0,.8)"  : "rgba(255,255,255,.8)";

  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, width:"100%" }}>
      <audio ref={audioRef} src={src} style={{ display:"none" }}
        onTimeUpdate={e => setProgress(e.target.currentTime)}
        onLoadedMetadata={e => setDuration(e.target.duration)}
        onEnded={() => { setPlaying(false); setProgress(0); }} />
      <button onClick={toggle} style={{ background:"none", border:"none", cursor:"pointer", padding:0, color:textCol, fontSize:14, flexShrink:0, lineHeight:1 }}>
        {playing ? "⏸" : "▶"}
      </button>
      <div style={{ flex:1, height:2, background:barBg, borderRadius:1, cursor:"pointer", position:"relative" }}
        onClick={e => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct  = (e.clientX - rect.left) / rect.width;
          if (audioRef.current) { audioRef.current.currentTime = pct * duration; setProgress(pct * duration); }
        }}>
        <div style={{ height:"100%", width: duration ? `${(progress/duration)*100}%` : "0%", background:barFill, borderRadius:1, transition:"width .1s linear" }} />
      </div>
      <span style={{ fontSize:9, fontFamily:"'IBM Plex Mono',monospace", color:textCol, flexShrink:0 }}>
        {fmt(progress)} / {fmt(duration)}
      </span>
    </div>
  );
}

function Bubble({ msg, esPropio, replyMsg, onReply, onDelete }) {
  const [hov,      setHov]      = useState(false);
  const [delPhase, setDelPhase] = useState("idle");
  const formatTime = d => d ? new Date(d).toLocaleTimeString("es-MX", { hour:"2-digit", minute:"2-digit" }) : "";
  const isAudioMsg = msg.tipo === "audio" && msg.audioUrl;

  const handleDelete = () => {
    setDelPhase("open");
    setTimeout(() => {
      setDelPhase("shrink");
      setTimeout(() => { setDelPhase("gone"); onDelete(msg.id); }, 280);
    }, 320);
  };

  const trashCol = delPhase === "idle" ? "rgba(255,255,255,.4)" : "rgba(255,80,80,.85)";

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display:"flex", flexDirection:"column", alignItems: esPropio ? "flex-end" : "flex-start", gap:3 }}>

      {hov && (
        <div style={{ display:"flex", gap:4, alignItems:"center", marginBottom:2 }}>
          <div className="reply-btn" onClick={() => onReply(msg)}>↩ responder</div>
          {esPropio && (
            <button onClick={handleDelete} title="Eliminar"
              style={{ background:"none", border:"none", cursor:"pointer", padding:"2px 4px", display:"flex", alignItems:"center" }}>
              <div style={{
                transition: delPhase==="shrink" ? "all .28s cubic-bezier(.4,0,.6,1)" : "none",
                transform: delPhase==="shrink" ? "scale(.05) perspective(200px) translateZ(-80px)" : delPhase==="open" ? "scale(1.15)" : "scale(1)",
                opacity: delPhase==="gone" ? 0 : 1,
              }}>
                <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
                  <rect x="1" y="3" width="10" height="10" rx="1" stroke={trashCol} strokeWidth="1"/>
                  <path d="M4 3V2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1" stroke={trashCol} strokeWidth="1"/>
                  <line x1="0" y1="3" x2="12" y2="3" stroke={trashCol} strokeWidth="1"/>
                  <line x1="4.5" y1="6" x2="4.5" y2="10" stroke={trashCol} strokeWidth="1"/>
                  <line x1="7.5" y1="6" x2="7.5" y2="10" stroke={trashCol} strokeWidth="1"/>
                </svg>
              </div>
            </button>
          )}
        </div>
      )}

      <div className={esPropio ? "bubble-me" : "bubble-other"} style={ isAudioMsg ? { background: esPropio ? "#fff" : "#141414" } : {} }>
        {replyMsg && (
          <div className={esPropio ? "reply-bar-me" : "reply-bar-other"}>
            <div style={{ width:2.5, borderRadius:2, background: esPropio ? "rgba(0,0,0,.22)" : "rgba(255,255,255,.28)", alignSelf:"stretch", flexShrink:0 }} />
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:8, fontFamily:"'IBM Plex Mono',monospace", color: esPropio ? "rgba(0,0,0,.6)" : "rgba(255,255,255,.58)", marginBottom:1, letterSpacing:".04em" }}>
                {replyMsg.emisor?.username || "Tú"}
              </div>
              <div style={{ fontSize:10, fontFamily:"'IBM Plex Sans',sans-serif", color: esPropio ? "rgba(0,0,0,.42)" : "rgba(255,255,255,.36)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:240 }}>
                {replyMsg.tipo === "audio" && replyMsg.audioUrl
                  ? <AudioReplyPreview src={replyMsg.audioUrl} />
                  : replyMsg.contenido}
              </div>
            </div>
          </div>
        )}

        {isAudioMsg ? (
          <div style={{ padding:"10px 14px", display:"flex", flexDirection:"column", gap:6, width:600 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
              <MicIcon size={12} recording={false} />
              <span style={{ fontFamily:"'IBM Plex Sans',sans-serif", fontSize:10, color: esPropio ? "rgba(0,0,0,.5)" : "rgba(255,255,255,.4)", letterSpacing:".04em" }}>
                mensaje de voz
              </span>
            </div>
            <AudioPlayer src={`${API}${msg.audioUrl}`} esPropio={esPropio} />
            <div className={esPropio ? "bubble-time-me" : "bubble-time-other"} style={{ alignSelf:"flex-end", marginTop:2 }}>
              {formatTime(msg.creadoEn)}
            </div>
          </div>
        ) : (
          <div style={{ padding:"9px 14px", display:"flex", alignItems:"flex-end", gap:10 }}>
            <div className={esPropio ? "bubble-text-me" : "bubble-text-other"}>{msg.contenido}</div>
            <div className={esPropio ? "bubble-time-me" : "bubble-time-other"}>{formatTime(msg.creadoEn)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function IconBtn({ onClick, title, children, disabled }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background:"none", border:"none", cursor: disabled ? "not-allowed" : "pointer", padding:"0 4px", transition:"opacity .15s", display:"flex", alignItems:"center", justifyContent:"center", opacity: disabled ? .3 : hov ? 1 : .5 }}>
      {children}
    </button>
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
  const [isAudio,     setIsAudio]     = useState(false);
  const [recording,   setRecording]   = useState(false);
  const [streak,      setStreak]      = useState({ count:0, dying:false, progress:1.0, loaded:false });

  const messagesEndRef   = useRef(null);
  const inputRef         = useRef(null);
  const typingTimer      = useRef(null);
  const audioTimer       = useRef(null);
  const fileInputRef     = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef   = useRef([]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth");
  }, [status, router]);

  useEffect(() => { setIsTyping(false); setIsAudio(false); }, [activeChat]);

  const loadStreak = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const res  = await fetch(`${API}/api/chat/streak/${userId}`, { credentials:"include" });
      if (!res.ok) return;
      const data = await res.json();
      setStreak({ count: data.count ?? 0, dying: data.dying ?? false, progress: data.progress ?? 1.0, loaded: true });
    } catch {
      setStreak({ count:0, dying:false, progress:1.0, loaded:true });
    }
  }, []);

  useEffect(() => {
    if (activeChat?.userId) loadStreak(activeChat.userId);
  }, [activeChat, loadStreak]);

  useEffect(() => {
    const s = document.createElement("style");
    s.id = "chat-styles";
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:wght@300;400;500&family=DM+Serif+Display:ital@0;1&display=swap');
      @keyframes spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
      @keyframes fadeUp   { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
      @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0} }
      @keyframes flicker  { 0%,100%{opacity:1;transform:scaleY(1)} 33%{opacity:.92;transform:scaleY(.97) scaleX(1.02)} 66%{opacity:.96;transform:scaleY(1.02) scaleX(.98)} }
      @keyframes pulse    { 0%,100%{opacity:.35} 50%{opacity:.55} }
      @keyframes wave     { 0%,100%{transform:scaleY(0.3)} 50%{transform:scaleY(1)} }
      @keyframes micPulse { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
      body { background:#000; color:#e8e4d9; font-family:'IBM Plex Mono',monospace; font-size:13px; overflow:hidden; }
      body::before { content:''; position:fixed; inset:0; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E"); opacity:.04; pointer-events:none; z-index:9998; }
      ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:2px}
      .conv-item { padding:9px 15px; cursor:pointer; border-left:2px solid transparent; transition:all .12s; display:flex; gap:10px; align-items:center; }
      .conv-item:hover { background:rgba(255,255,255,.03); }
      .conv-item.active { background:rgba(255,255,255,.06); border-left-color:rgba(255,255,255,.6); }
      .avatar { width:32px; height:32px; border-radius:50%; background:#1a1a1a; border:1.5px solid rgba(255,255,255,.1); display:flex; align-items:center; justify-content:center; font-size:11px; color:rgba(255,255,255,.22); flex-shrink:0; position:relative; }
      .avatar-sm { width:28px; height:28px; border-radius:50%; background:#1a1a1a; border:1.5px solid rgba(255,255,255,.08); display:flex; align-items:center; justify-content:center; font-size:9px; color:rgba(255,255,255,.2); flex-shrink:0; font-family:'IBM Plex Mono',monospace; }
      .status-dot { position:absolute; bottom:1px; right:1px; width:8px; height:8px; border-radius:50%; border:2px solid #050505; }
      .status-dot-hdr { position:absolute; bottom:1px; right:1px; width:9px; height:9px; border-radius:50%; border:2px solid #000; }
      .bubble-me { background:#fff; border-radius:3px; box-shadow:0 2px 14px rgba(0,0,0,.45); overflow:hidden; animation:fadeUp .15s ease; position:relative; z-index:1; }
      .bubble-other { background:#141414; border-radius:3px; box-shadow:0 2px 14px rgba(0,0,0,.45); overflow:hidden; animation:fadeUp .15s ease; position:relative; z-index:1; }
      .bubble-text-me    { font-family:'IBM Plex Sans',sans-serif; font-size:13px; color:#000; line-height:1.55; letter-spacing:.01em; }
      .bubble-text-other { font-family:'IBM Plex Sans',sans-serif; font-size:13px; color:#e8e4d9; line-height:1.55; letter-spacing:.01em; }
      .bubble-time-me    { font-size:8px; color:rgba(0,0,0,.28); white-space:nowrap; flex-shrink:0; font-family:'IBM Plex Mono',monospace; letter-spacing:.05em; margin-top:auto; }
      .bubble-time-other { font-size:8px; color:rgba(255,255,255,.2); white-space:nowrap; flex-shrink:0; font-family:'IBM Plex Mono',monospace; letter-spacing:.05em; margin-top:auto; }
      .reply-bar-me    { padding:7px 12px 6px; background:rgba(0,0,0,.07); border-bottom:1px solid rgba(0,0,0,.07); display:flex; gap:8px; }
      .reply-bar-other { padding:7px 12px 6px; background:rgba(255,255,255,.05); border-bottom:1px solid rgba(255,255,255,.06); display:flex; gap:8px; }
      .reply-btn { padding:2px 10px; background:rgba(255,255,255,.05); border-radius:999px; border:1px solid rgba(255,255,255,.08); font-size:9px; font-family:'IBM Plex Mono',monospace; color:rgba(255,255,255,.38); cursor:pointer; display:inline-flex; gap:4px; align-items:center; animation:fadeIn .1s ease; letter-spacing:.06em; transition:all .15s; }
      .reply-btn:hover { background:rgba(255,255,255,.1); color:#fff; }
      .chat-input { flex:1; background:transparent; border:none; color:#e8e4d9; font-family:'IBM Plex Sans',sans-serif; font-size:12px; padding:11px 16px; outline:none; letter-spacing:.02em; }
      .chat-input::placeholder { color:rgba(255,255,255,.22); }
      .input-wrap { flex:1; display:flex; background:rgba(255,255,255,.04); border-radius:2px; overflow:hidden; border:1px solid rgba(255,255,255,.08); transition:border-color .2s; align-items:center; }
      .input-wrap:focus-within { border-color:rgba(255,255,255,.25); }
      .send-arrow { background:transparent; border:none; border-left:1px solid rgba(255,255,255,.07); padding:0 16px; color:rgba(255,255,255,.3); font-size:16px; cursor:pointer; transition:color .2s; height:100%; }
      .send-arrow:hover { color:rgba(255,255,255,.8); }
      .send-arrow:disabled { opacity:.2; cursor:not-allowed; }
      .buscar-input { width:100%; box-sizing:border-box; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.12); color:#fff; font-family:'IBM Plex Mono',monospace; font-size:11px; padding:8px 12px; outline:none; transition:border-color .2s; border-radius:2px; }
      .buscar-input:focus { border-color:rgba(255,255,255,.3); }
      .buscar-input::placeholder { color:rgba(255,255,255,.25); }
      .resultado-item { display:flex; align-items:center; justify-content:space-between; padding:8px 12px; cursor:pointer; border-bottom:1px solid rgba(255,255,255,.04); transition:background .12s; }
      .resultado-item:hover { background:rgba(255,255,255,.06); }
      .spinner { width:10px; height:10px; border:1px solid rgba(255,255,255,.15); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; display:inline-block; }
      .date-pill { display:flex; align-items:center; gap:12px; margin:16px 0 14px; }
      .date-pill::before,.date-pill::after { content:''; flex:1; height:1px; background:rgba(255,255,255,.05); }
      .date-pill span { font-size:8px; font-family:'IBM Plex Mono',monospace; color:rgba(255,255,255,.22); background:rgba(255,255,255,.04); padding:3px 12px; border-radius:999px; letter-spacing:.12em; }
      .mic-recording { animation:micPulse 1s ease-in-out infinite; }
    `;
    document.head.appendChild(s);
    return () => document.getElementById("chat-styles")?.remove();
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.dbId) return;
    socket = io(API);
    socket.emit("user:connect", session.user.dbId);
    socket.on("users:online",    users => setOnlineUsers(users));
    socket.on("message:receive", msg   => { setMensajes(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]); loadConversaciones(); });
    socket.on("message:sent",    msg   => { setMensajes(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]); });
    socket.on("typing:start",    ({ userId }) => { setIsTyping(String(userId)); setIsAudio(false); });
    socket.on("typing:stop",     ({ userId }) => { setIsTyping(prev => prev === String(userId) ? false : prev); });
    socket.on("audio:start",     ({ userId }) => { setIsAudio(String(userId)); setIsTyping(false); });
    socket.on("audio:stop",      ({ userId }) => { setIsAudio(prev => prev === String(userId) ? false : prev); });
    socket.on("message:receive:audio", msg => {
      setMensajes(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
      loadConversaciones();
    });
    socket.on("message:deleted", ({ id }) => {
      setMensajes(prev => prev.filter(m => m.id !== id));
    });
    return () => { socket?.disconnect(); socket = null; };
  }, [status, session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [mensajes, isTyping, isAudio]);

  const loadConversaciones = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/api/chat/conversaciones`, { credentials:"include" });
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
        const res  = await fetch(`${API}/api/amigos/buscar?q=${busqueda}`, { credentials:"include" });
        const data = await res.json();
        setResultados(data.usuarios || []);
      } catch {}
      setBuscando(false);
    }, 400);
    return () => clearTimeout(t);
  }, [busqueda]);

  const openChat = async user => {
    setShowBuscar(false); setBusqueda(""); setResultados([]);
    setIsTyping(false); setIsAudio(false);
    const chatUser = { userId: user.userId || user.id, username: user.username };
    setActiveChat(chatUser);
    setLoading(true); setMensajes([]); setReplyingTo(null);
    try {
      const res  = await fetch(`${API}/api/chat/${chatUser.userId}`, { credentials:"include" });
      const data = await res.json();
      const msgs = data.mensajes || [];
      setMensajes(msgs.filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i));
      if (socket && session?.user?.dbId)
        socket.emit("messages:read", { emisorId: chatUser.userId, receptorId: session.user.dbId });
    } catch {}
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleInputChange = e => {
    setInput(e.target.value);
    if (!socket || !activeChat) return;
    socket.emit("typing:start", { receptorId: activeChat.userId });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit("typing:stop", { receptorId: activeChat.userId });
    }, 1500);
  };

  const handleMicClick = async () => {
    if (!activeChat || !socket) return;
    if (!recording) {
      try {
        const stream   = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        audioChunksRef.current = [];
        recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
        recorder.start();
        mediaRecorderRef.current = recorder;
        setRecording(true);
        socket.emit("audio:start", { receptorId: activeChat.userId });
        audioTimer.current = setTimeout(() => stopRecording(false), 60000);
      } catch (err) {
        console.error("Permiso de micrófono denegado:", err.message);
      }
    } else {
      stopRecording(false);
    }
  };

  const stopRecording = (send = false) => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") { setRecording(false); return; }
    recorder.onstop = async () => {
      recorder.stream?.getTracks().forEach(t => t.stop());
      if (send && audioChunksRef.current.length > 0) {
        const blob = new Blob(audioChunksRef.current, { type:"audio/webm" });
        const fd   = new FormData();
        fd.append("audio", blob, "audio.webm");
        try {
          const res  = await fetch(`${API}/api/chat/audio/${activeChat.userId}`, { method:"POST", credentials:"include", body:fd });
          const text = await res.text();
          const data = JSON.parse(text);
          if (data.ok) setMensajes(prev => prev.some(m => m.id === data.msg.id) ? prev : [...prev, data.msg]);
        } catch (err) { console.error("Error enviando audio:", err.message); }
      }
      audioChunksRef.current = [];
      mediaRecorderRef.current = null;
    };
    recorder.stop();
    setRecording(false);
    clearTimeout(audioTimer.current);
    if (socket && activeChat) socket.emit("audio:stop", { receptorId: activeChat.userId });
  };

  const handleDeleteMsg = async msgId => {
    try {
      await fetch(`${API}/api/chat/mensaje/${msgId}`, { method:"DELETE", credentials:"include" });
      setMensajes(prev => prev.filter(m => m.id !== msgId));
      if (socket && activeChat) socket.emit("message:deleted", { id: msgId, receptorId: activeChat.userId });
    } catch {}
  };

  const sendMessage = () => {
    if (!input.trim() || !activeChat || !socket || !session?.user?.dbId) return;
    clearTimeout(typingTimer.current);
    socket.emit("typing:stop",  { receptorId: activeChat.userId });
    socket.emit("message:send", {
      emisorId:   session.user.dbId,
      receptorId: activeChat.userId,
      contenido:  input.trim(),
      replyToId:  replyingTo?.id || null,
    });
    setInput("");
    setReplyingTo(null);
  };

  const isOnline = id => onlineUsers.includes(String(id));
  const isActive = id => activeChat?.userId === id;

  const formatDate = d => {
    if (!d) return "";
    const date = new Date(d);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "HOY";
    if (date.toDateString() === yesterday.toDateString()) return "AYER";
    return date.toLocaleDateString("es-MX", { day:"numeric", month:"long" }).toUpperCase();
  };

  const showTypingIndicator = isTyping && String(isTyping) === String(activeChat?.userId);
  const showAudioIndicator  = isAudio  && String(isAudio)  === String(activeChat?.userId);

  if (status === "loading") return null;

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
                    <div className="avatar">◈<div className="status-dot" style={{ background: isOnline(c.userId) ? "#3ddc84" : "#2a2a2a" }} /></div>
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
                    <div className="avatar">◈<div className="status-dot" style={{ background: isOnline(a.userId) ? "#3ddc84" : "#2a2a2a" }} /></div>
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
                <span style={{ color:"rgba(255,255,255,.6)", cursor:"pointer", textDecoration:"underline" }} onClick={() => router.push("/amigos")}>ir a amigos</span>
              </div>
            )}
          </div>

          <div onClick={() => setShowBuscar(!showBuscar)}
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
                ◈<div className="status-dot-hdr" style={{ background: isOnline(activeChat.userId) ? "#3ddc84" : "#2a2a2a" }} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:17, color:"#fff", lineHeight:1 }}>{activeChat.username}</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color: isOnline(activeChat.userId) ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.2)", letterSpacing:".1em", marginTop:3 }}>
                  {isOnline(activeChat.userId) ? "en línea ahora" : "desconectado"}
                </div>
              </div>
              {streak.loaded && <StreakC count={streak.count} dying={streak.dying} progress={streak.progress} />}
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
                  const replyMsg = msg.replyToId ? mensajes.find(m => m.id === msg.replyToId) || null : null;
                  return (
                    <div key={msg.id || i} style={{ marginBottom: prevSame ? 3 : 14 }}>
                      {showDate && <div className="date-pill"><span>{formatDate(msg.creadoEn)}</span></div>}
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
                            onReply={m => { setReplyingTo(m); inputRef.current?.focus(); }}
                            onDelete={handleDeleteMsg} />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {showAudioIndicator  && <AudioIndicator  username={activeChat.username} label="mandando audio" />}
              {showTypingIndicator && !showAudioIndicator && <TypingIndicator username={activeChat.username} />}
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
                    {replyingTo.tipo === "audio" && replyingTo.audioUrl
                      ? <AudioReplyPreview src={replyingTo.audioUrl} />
                      : replyingTo.contenido}
                  </div>
                </div>
                <span onClick={() => setReplyingTo(null)}
                  style={{ fontSize:16, color:"rgba(255,255,255,.22)", cursor:"pointer", transition:"color .15s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,.8)"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.22)"}
                >✕</span>
              </div>
            )}

            <div style={{ padding:"10px 18px 14px", background:"#000", borderTop:"1px solid rgba(255,255,255,.07)", display:"flex", gap:5, alignItems:"center" }}>
              <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx" style={{ display:"none" }}
                onChange={e => console.log("archivo:", e.target.files?.[0]?.name)} />

              <IconBtn title="Adjuntar archivo" onClick={() => fileInputRef.current?.click()} disabled={!activeChat}>
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

              <IconBtn title={recording ? "Detener audio" : "Grabar audio"} onClick={handleMicClick} disabled={!activeChat}>
                <div className={recording ? "mic-recording" : ""}>
                  <MicIcon size={18} recording={recording} />
                </div>
              </IconBtn>

              {recording ? (
                <div style={{ flex:1, background:"rgba(61,220,132,.04)", border:"1px solid rgba(61,220,132,.2)", borderRadius:2, padding:"0 14px", display:"flex", alignItems:"center", gap:8, height:40 }}>
                  <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:"rgba(61,220,132,.7)", letterSpacing:".1em" }}>grabando</span>
                  {BARS.map((h, i) => (
                    <div key={i} style={{ width:2, borderRadius:2, background:"rgba(61,220,132,.7)", height:`${h*14}px`, animation:`wave 0.9s ease ${i*0.06}s infinite`, transformOrigin:"center" }}/>
                  ))}
                  <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
                    <button onClick={() => stopRecording(false)}
                      style={{ background:"none", border:"1px solid rgba(255,80,80,.3)", color:"rgba(255,80,80,.6)", fontFamily:"'IBM Plex Mono',monospace", fontSize:8, padding:"3px 10px", cursor:"pointer", letterSpacing:".1em", transition:"all .15s" }}
                      onMouseEnter={e => { e.currentTarget.style.background="rgba(255,80,80,.1)"; e.currentTarget.style.color="#ff5050"; }}
                      onMouseLeave={e => { e.currentTarget.style.background="none"; e.currentTarget.style.color="rgba(255,80,80,.6)"; }}>
                      ✕
                    </button>
                    <button onClick={() => stopRecording(true)}
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
                    placeholder={replyingTo ? "↩ responder..." : "Escribe un mensaje..."}
                    value={input} onChange={handleInputChange}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  />
                  <button className="send-arrow" onClick={sendMessage} disabled={!input.trim()}>↑</button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16, background:"#000" }}>
            <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:24, color:"rgba(255,255,255,.12)" }}>Mensajes</div>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, letterSpacing:".15em", color:"rgba(255,255,255,.2)" }}>selecciona una conversación</div>
            <button onClick={() => setShowBuscar(true)}
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
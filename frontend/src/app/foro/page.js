"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function ForoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const ac = "#ffffff";
  const [activeChannel, setActiveChannel] = useState("general");
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth");
  }, [status, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChannel]);

  useEffect(() => {
    const s = document.createElement("style");
    s.id = "foro-styles";
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

      ::-webkit-scrollbar { width:4px }
      ::-webkit-scrollbar-track { background:#000 }
      ::-webkit-scrollbar-thumb { background:#222 }

      .channel-item {
        padding: 7px 16px;
        cursor: pointer;
        border-left: 2px solid transparent;
        transition: all .15s;
      }
      .channel-item:hover { background: rgba(255,255,255,.03); }
      .channel-item.active { background: rgba(255,255,255,.07); border-left-color: #fff; }

      .msg-input {
        flex: 1;
        background: rgba(255,255,255,.06);
        border: 1px solid rgba(255,255,255,.08);
        color: #e8e4d9;
        font-family: 'Space Mono', monospace;
        font-size: 12px;
        padding: 11px 16px;
        outline: none;
        letter-spacing: .03em;
        transition: border-color .2s;
      }
      .msg-input:focus { border-color: rgba(255,255,255,.3); }
      .msg-input::placeholder { color: rgba(255,255,255,.2); }

      .send-btn {
        background: rgba(255,255,255,.1);
        border: 1px solid rgba(255,255,255,.25);
        color: #fff;
        font-family: 'Space Mono', monospace;
        font-size: 11px;
        padding: 11px 18px;
        cursor: pointer;
        letter-spacing: .15em;
        transition: all .2s;
      }
      .send-btn:hover { background: rgba(255,255,255,.18); }
    `;
    document.head.appendChild(s);
    return () => document.getElementById("foro-styles")?.remove();
  }, []);

  const channels = [
    { id: "general",    name: "# general",    desc: "todo y nada",               unread: 3 },
    { id: "vlogs",      name: "# vlogs",      desc: "comparte tu contenido",     unread: 0 },
    { id: "aesthetics", name: "# aesthetics", desc: "paletas, refs, moodboards", unread: 7 },
    { id: "code",       name: "# code",       desc: "habla del stack",           unread: 1 },
    { id: "dark-music", name: "# dark-music", desc: "playlists y bandas",        unread: 0 },
    { id: "void",       name: "# void",       desc: "el agujero negro",          unread: 2 },
  ];

  const msgs = {
    general: [
      { user: "dead_girl",      time: "04:37", text: "alguien más tiene el sitio lento o soy yo",           color: "#ccc" },
      { user: "null_entity",    time: "04:39", text: "yo también. igual de vacío que mi alma",              color: "#999" },
      { user: "_cemetery_code", time: "04:41", text: "están haciendo deploy supongo",                       color: "#aaa" },
      { user: "glitch.phantom", time: "04:45", text: "> void.exe se reinició solo\n> recomiendo esperar",  color: "#bbb" },
      { user: "dead_girl",      time: "04:48", text: "ya volvió para los que pregunten",                    color: "#ccc" },
    ],
    aesthetics: [
      { user: "_cemetery_code", time: "03:11", text: "alguien tiene refs de cybersigilism para un proyecto?", color: "#aaa" },
      { user: "glitch.phantom", time: "03:15", text: "busca \"dark techno sigil art\" en pinterest",          color: "#bbb" },
      { user: "null_entity",    time: "03:22", text: "también mira los stickers de Tumblr ca. 2014",          color: "#999" },
    ],
    code: [
      { user: "glitch.phantom", time: "02:03", text: "¿next.js hydration error en prod pero no en dev?",        color: "#bbb" },
      { user: "dead_girl",      time: "02:11", text: "probablemente mismatch de SSR. revisa Date o Math.random", color: "#ccc" },
      { user: "glitch.phantom", time: "02:14", text: "ERA ESO. gracias queen",                                   color: "#bbb" },
    ],
    vlogs:       [{ user: "null_entity",    time: "01:00", text: "subí nuevo vlog. está en mi perfil si quieren verlo", color: "#999" }],
    "dark-music":[{ user: "_cemetery_code", time: "00:12", text: "¿alguien conoce Salem? muy subestimados",             color: "#aaa" }],
    void:        [
      { user: "glitch.phantom", time: "03:33", text: "...", color: "#bbb" },
      { user: "dead_girl",      time: "03:34", text: "...", color: "#ccc" },
    ],
  };

  const currentMsgs    = msgs[activeChannel] || msgs.general;
  const currentChannel = channels.find(c => c.id === activeChannel);

  if (status === "loading") return null;

  return (
    <>
      <Navbar />

      <div style={{ display: "flex", height: "calc(100vh - 48px)", marginTop: 48 }}>

        {/* ── SIDEBAR ── */}
        <div style={{ width: 210, borderRight: "1px solid rgba(255,255,255,.07)", background: "rgba(0,0,0,.5)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,.07)", fontFamily: "'Cinzel', serif", fontSize: 13, color: ac, letterSpacing: ".2em" }}>
            VOID_CHANNELS
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
            {channels.map(c => (
              <div
                key={c.id}
                className={`channel-item${activeChannel === c.id ? " active" : ""}`}
                onClick={() => setActiveChannel(c.id)}
                style={{ borderLeftColor: activeChannel === c.id ? ac : "transparent" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: activeChannel === c.id ? ac : "#555", letterSpacing: ".05em" }}>
                    {c.name}
                  </span>
                  {c.unread > 0 && (
                    <span style={{ background: "#cc3344", color: "#fff", fontSize: 9, padding: "1px 5px", minWidth: 16, textAlign: "center" }}>
                      {c.unread}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 10, color: "#333", marginTop: 2, letterSpacing: ".03em" }}>{c.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,.07)", display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 26, height: 26, background: "#0a0a0a", border: `1px solid ${ac}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: `${ac}55`, flexShrink: 0 }}>◈</div>
            <div>
              <div style={{ fontSize: 12, color: "#e8e4d9" }}>{session?.user?.name?.split(" ")[0] || "user"}</div>
              <div style={{ fontSize: 10, color: "#3ddc84", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#3ddc84", display: "inline-block" }} />
                online
              </div>
            </div>
          </div>
        </div>

        {/* ── MENSAJES ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

          <div style={{ padding: "12px 24px", borderBottom: "1px solid rgba(255,255,255,.07)", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
            <span style={{ color: ac, fontFamily: "'Cinzel', serif", fontSize: 15 }}>{currentChannel?.name}</span>
            <span style={{ color: "rgba(255,255,255,.1)" }}>|</span>
            <span style={{ fontSize: 12, color: "#444" }}>{currentChannel?.desc}</span>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
            {currentMsgs.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 18 }}>
                <div style={{ width: 30, height: 30, background: "#0a0a0a", border: `1px solid ${ac}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: `${ac}44`, flexShrink: 0, marginTop: 2 }}>◈</div>
                <div>
                  <div style={{ display: "flex", gap: 10, alignItems: "baseline", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: m.color, fontWeight: 700, letterSpacing: ".03em" }}>{m.user}</span>
                    <span style={{ fontSize: 10, color: "#333" }}>{m.time}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(232,228,217,.7)", lineHeight: 1.6, whiteSpace: "pre-wrap", fontFamily: "'Space Mono', monospace" }}>
                    {m.text}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding: "14px 24px", borderTop: "1px solid rgba(255,255,255,.07)", display: "flex", gap: 10, flexShrink: 0 }}>
            <input
              className="msg-input"
              placeholder={`mensaje en ${currentChannel?.name}...`}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && input.trim()) setInput(""); }}
            />
            <button className="send-btn" onClick={() => { if (input.trim()) setInput(""); }}>
              ENVIAR
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
"use client";

import { useState, useEffect, useRef } from "react";

// Glitch text hook
function useGlitch(text, active) {
  const [displayed, setDisplayed] = useState(text);
  const chars = "!<>-_\\/[]{}—=+*^?#@$%&~`|;:.,°†‡§¶";
  useEffect(() => {
    if (!active) { setDisplayed(text); return; }
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayed(
        text.split("").map((char, i) =>
          i < iteration
            ? text[i]
            : chars[Math.floor(Math.random() * chars.length)]
        ).join("")
      );
      if (iteration >= text.length) clearInterval(interval);
      iteration += 0.4;
    }, 30);
    return () => clearInterval(interval);
  }, [active, text]);
  return displayed;
}

// ASCII noise background
function AsciiNoise() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const chars = "01░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε";
    let frame;
    const draw = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.fillStyle = "rgba(0,0,0,0.85)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = "11px monospace";
      const cols = Math.floor(canvas.width / 12);
      const rows = Math.floor(canvas.height / 14);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (Math.random() > 0.965) {
            const opacity = Math.random() * 0.12 + 0.02;
            ctx.fillStyle = `rgba(180,160,255,${opacity})`;
            ctx.fillText(chars[Math.floor(Math.random() * chars.length)], c * 12, r * 14);
          }
        }
      }
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

// Scanlines overlay
function Scanlines() {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 1,
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 4px)",
      }}
    />
  );
}

// Vignette
function Vignette() {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 2,
        background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.75) 100%)",
      }}
    />
  );
}

// Corner decorations
function CornerDeco() {
  const style = (pos) => ({
    position: "fixed",
    ...pos,
    width: 80,
    height: 80,
    zIndex: 3,
    opacity: 0.35,
    pointerEvents: "none",
  });
  const svg = (rot) => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ transform: `rotate(${rot}deg)`, width: "100%", height: "100%" }}>
      <path d="M4 4 L4 36 M4 4 L36 4" stroke="#9b7fff" strokeWidth="1.5"/>
      <path d="M4 4 L16 16" stroke="#9b7fff" strokeWidth="0.8" strokeDasharray="2 3"/>
      <circle cx="4" cy="4" r="2" fill="#9b7fff"/>
      <rect x="14" y="14" width="4" height="4" stroke="#9b7fff" strokeWidth="0.8" fill="none"/>
      <text x="8" y="52" fill="#9b7fff" fontSize="7" fontFamily="monospace" opacity="0.6">
        {rot === 0 ? "00:00" : rot === 90 ? "SYS" : rot === 180 ? "END" : "NET"}
      </text>
    </svg>
  );
  return (
    <>
      <div style={style({ top: 12, left: 12 })}>{svg(0)}</div>
      <div style={style({ top: 12, right: 12 })}>{svg(90)}</div>
      <div style={style({ bottom: 12, right: 12 })}>{svg(180)}</div>
      <div style={style({ bottom: 12, left: 12 })}>{svg(270)}</div>
    </>
  );
}

// Status bar
function StatusBar({ time }) {
  return (
    <div
      className="fixed top-0 left-0 right-0 flex justify-between items-center px-6 py-2"
      style={{ zIndex: 10, borderBottom: "1px solid rgba(155,127,255,0.12)", fontFamily: "monospace", fontSize: 10, color: "rgba(155,127,255,0.5)" }}
    >
      <span>VLOG_SOCIAL // v0.1.0 // BUILD 2026</span>
      <span>{time} ◈ SYSTEM ONLINE ◈ AWAITING INPUT</span>
      <span>NET:OK ▸ DB:IDLE ▸ SRV:READY</span>
    </div>
  );
}

// Main export
export default function Home() {
  const [time, setTime] = useState("");
  const [glitching, setGlitching] = useState(false);
  const [phase, setPhase] = useState(0); // 0=landing, 1=entering
  const [hovered, setHovered] = useState(false);

  const title1 = useGlitch("VLOG", glitching);
  const title2 = useGlitch("SOCIAL", glitching);

  // Clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-glitch
  useEffect(() => {
    const trigger = () => {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 600);
    };
    trigger();
    const id = setInterval(trigger, 5000 + Math.random() * 4000);
    return () => clearInterval(id);
  }, []);

  // CSS keyframes injected once
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Cinzel:wght@400;700&family=Rajdhani:wght@300;400;600&display=swap');
      
      body { background: #000; overflow: hidden; cursor: crosshair; }

      @keyframes flicker {
        0%,100%{opacity:1} 92%{opacity:1} 93%{opacity:0.4} 94%{opacity:1} 96%{opacity:0.6} 97%{opacity:1}
      }
      @keyframes pulse-border {
        0%,100%{border-color:rgba(155,127,255,0.3)} 50%{border-color:rgba(155,127,255,0.8)}
      }
      @keyframes float-up {
        from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)}
      }
      @keyframes scanline-move {
        from{transform:translateY(-100%)} to{transform:translateY(100vh)}
      }
      @keyframes grain {
        0%,100%{transform:translate(0,0)} 10%{transform:translate(-2%,-3%)} 20%{transform:translate(3%,1%)}
        30%{transform:translate(-1%,4%)} 40%{transform:translate(4%,-2%)} 50%{transform:translate(-3%,3%)}
        60%{transform:translate(2%,-4%)} 70%{transform:translate(-4%,1%)} 80%{transform:translate(3%,2%)}
        90%{transform:translate(-1%,-1%)}
      }
      @keyframes logo-reveal {
        from{letter-spacing:0.8em;opacity:0;filter:blur(8px)} to{letter-spacing:0.12em;opacity:1;filter:blur(0)}
      }
      @keyframes dash-flow {
        from{stroke-dashoffset:1000} to{stroke-dashoffset:0}
      }
      @keyframes blink {
        0%,100%{opacity:1} 50%{opacity:0}
      }
      @keyframes enter-scale {
        from{transform:scale(0.98);opacity:0} to{transform:scale(1);opacity:1}
      }

      .title-word {
        font-family: 'Cinzel', serif;
        font-weight: 700;
        letter-spacing: 0.12em;
        animation: logo-reveal 1.8s cubic-bezier(0.16,1,0.3,1) forwards, flicker 8s infinite 2s;
      }
      .enter-btn {
        font-family: 'Share Tech Mono', monospace;
        font-size: 11px;
        letter-spacing: 0.25em;
        text-transform: uppercase;
        border: 1px solid rgba(155,127,255,0.4);
        padding: 12px 36px;
        color: rgba(155,127,255,0.8);
        background: transparent;
        cursor: crosshair;
        transition: all 0.2s;
        animation: pulse-border 3s infinite;
        position: relative;
        overflow: hidden;
      }
      .enter-btn:hover {
        color: #fff;
        border-color: rgba(155,127,255,1);
        background: rgba(155,127,255,0.08);
        box-shadow: 0 0 24px rgba(155,127,255,0.25), inset 0 0 24px rgba(155,127,255,0.05);
      }
      .enter-btn::before {
        content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;
        background:linear-gradient(90deg,transparent,rgba(155,127,255,0.1),transparent);
        transition:left 0.4s;
      }
      .enter-btn:hover::before { left:100%; }

      .subtitle {
        font-family: 'Rajdhani', sans-serif;
        font-weight: 300;
        letter-spacing: 0.5em;
        font-size: 11px;
        color: rgba(155,127,255,0.45);
        animation: float-up 1.2s ease 0.6s both;
      }
      .meta-line {
        font-family: 'Share Tech Mono', monospace;
        font-size: 9px;
        letter-spacing: 0.2em;
        color: rgba(155,127,255,0.25);
        animation: float-up 1.2s ease 1.4s both;
      }
      .cursor-blink { animation: blink 1s step-end infinite; }
      .glow-line {
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(155,127,255,0.6), transparent);
        animation: float-up 1s ease 0.8s both;
      }
      .moving-scanline {
        position:fixed;top:0;left:0;right:0;height:2px;
        background:linear-gradient(180deg,rgba(155,127,255,0),rgba(155,127,255,0.04),rgba(155,127,255,0));
        animation:scanline-move 8s linear infinite;
        pointer-events:none;z-index:4;
      }
      .center-cross {
        position:absolute;
        font-size:9px;
        font-family:monospace;
        color:rgba(155,127,255,0.2);
        pointer-events:none;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000" }}>
      <AsciiNoise />
      <Scanlines />
      <Vignette />
      <CornerDeco />

      {/* Moving scanline */}
      <div className="moving-scanline" />

      {/* Status bar */}
      <StatusBar time={time} />

      {/* Center SVG frame */}
      <svg
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 3, pointerEvents: "none" }}
        viewBox="0 0 1200 700"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Outer frame lines */}
        <rect x="60" y="40" width="1080" height="620" fill="none" stroke="rgba(155,127,255,0.1)" strokeWidth="0.5"
          strokeDasharray="8 4" style={{ animation: "dash-flow 4s linear forwards" }} />
        {/* Center crosshair */}
        <line x1="600" y1="280" x2="600" y2="320" stroke="rgba(155,127,255,0.3)" strokeWidth="0.8"/>
        <line x1="580" y1="300" x2="620" y2="300" stroke="rgba(155,127,255,0.3)" strokeWidth="0.8"/>
        <circle cx="600" cy="300" r="40" fill="none" stroke="rgba(155,127,255,0.06)" strokeWidth="0.6"/>
        {/* Side marks */}
        <text x="65" y="340" fill="rgba(155,127,255,0.2)" fontSize="8" fontFamily="monospace">◂ ENTER SYSTEM ▸</text>
        <text x="1020" y="340" fill="rgba(155,127,255,0.2)" fontSize="8" fontFamily="monospace" textAnchor="end">◂ ENTER SYSTEM ▸</text>
        {/* Bottom data strip */}
        <text x="600" y="660" fill="rgba(155,127,255,0.15)" fontSize="7" fontFamily="monospace" textAnchor="middle">
          NODE:ALPHA ◈ MYSQL:STANDBY ◈ SOCKET:IDLE ◈ AUTH:WAITING ◈ CLOUDFLARE:TUNNEL
        </text>
      </svg>

      {/* Main content */}
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 5,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 0,
        }}
      >
        {/* Pre-title tag */}
        <div className="meta-line" style={{ marginBottom: 20 }}>
          ◈ &nbsp; SISTEMA INICIALIZADO &nbsp; // &nbsp; PROTOCOLO SOCIAL &nbsp; ◈
        </div>

        {/* Glow separator */}
        <div className="glow-line" style={{ width: 320, marginBottom: 28 }} />

        {/* Main title */}
        <div style={{ display: "flex", gap: "0.5em", alignItems: "baseline", marginBottom: 6 }}>
          <span
            className="title-word"
            style={{
              fontSize: "clamp(52px, 8vw, 96px)",
              color: "#fff",
              textShadow: "0 0 40px rgba(155,127,255,0.6), 0 0 80px rgba(155,127,255,0.2)",
            }}
          >
            {title1}
          </span>
          <span
            className="title-word"
            style={{
              fontSize: "clamp(52px, 8vw, 96px)",
              color: "rgba(155,127,255,0.9)",
              textShadow: "0 0 40px rgba(155,127,255,0.8), 0 0 100px rgba(155,127,255,0.3)",
              animationDelay: "0.15s",
            }}
          >
            {title2}
          </span>
        </div>

        {/* Subtitle */}
        <div className="subtitle" style={{ marginBottom: 40 }}>
          TU ESPACIO &nbsp;◆&nbsp; TU ESTÉTICA &nbsp;◆&nbsp; TU VOZ
        </div>

        {/* Enter button */}
        <button
          className="enter-btn"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={() => {
            setPhase(1);
            // Replace with: window.location.href = '/auth'
          }}
          style={{ marginBottom: 48 }}
        >
          {hovered ? "[ INICIAR_SESION.exe ]" : "◈ ENTRAR AL SISTEMA ◈"}
        </button>

        {/* Glow separator bottom */}
        <div className="glow-line" style={{ width: 220, marginBottom: 20 }} />

        {/* Meta info row */}
        <div style={{
          display: "flex", gap: 32, alignItems: "center",
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 9, color: "rgba(155,127,255,0.3)",
          letterSpacing: "0.18em",
          animation: "float-up 1.2s ease 1.8s both",
        }}>
          <span>GOOGLE_AUTH</span>
          <span style={{ color: "rgba(155,127,255,0.12)" }}>◆</span>
          <span>SPOTIFY_SYNC</span>
          <span style={{ color: "rgba(155,127,255,0.12)" }}>◆</span>
          <span>VLOG_PERSONAL</span>
          <span style={{ color: "rgba(155,127,255,0.12)" }}>◆</span>
          <span>CYBER_GOTH</span>
        </div>

        {/* Cursor */}
        <div style={{
          marginTop: 40,
          fontFamily: "monospace", fontSize: 11,
          color: "rgba(155,127,255,0.4)",
          letterSpacing: "0.2em",
          animation: "float-up 1s ease 2.2s both",
        }}>
          <span>root@vlogsocial:~$ </span>
          <span className="cursor-blink">█</span>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const validateUsername = (v) => {
  if (v.length < 3)  return "mínimo 3 caracteres";
  if (v.length > 20) return "máximo 20 caracteres";
  if (!/^[a-zA-Z0-9_]+$/.test(v)) return "solo letras, números y _";
  return null;
};

const validatePassword = (v) => {
  if (v.length < 8)     return "mínimo 8 caracteres";
  if (v.length > 14)    return "máximo 14 caracteres";
  if (!/[A-Z]/.test(v)) return "necesita al menos una mayúscula";
  if (!/[0-9]/.test(v)) return "necesita al menos un número";
  return null;
};

function useTypewriter(text, speed = 18) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const id = setInterval(() => {
      setDisplayed(text.slice(0, ++i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return displayed;
}

function TermLine({ text, color = "rgba(255,255,255,.9)", delay = 0, style = {} }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  if (!visible) return null;
  return (
    <div style={{
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: 12, letterSpacing: ".06em",
      color, lineHeight: 1.7,
      ...style,
    }}>
      {text}
    </div>
  );
}

function ProgressBar({ percent }) {
  const filled = Math.round(percent / 10);
  const empty  = 10 - filled;
  return (
    <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: "#fff" }}>
      [{"█".repeat(filled)}{"░".repeat(empty)}] {percent}%
    </span>
  );
}

export default function RegisterPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [step,     setStep]     = useState(0);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState("");
  const [progress, setProgress] = useState(0);
  const inputRef = useRef(null);

  const introText = useTypewriter(
    session?.user?.name
      ? `> SISTEMA: bienvenido, ${session.user.name}\n> nuevo usuario detectado\n> iniciando protocolo de registro...`
      : `> SISTEMA: nuevo usuario detectado\n> iniciando protocolo de registro...`,
    14
  );

  useEffect(() => {
    if (step === 0) {
      const t = setTimeout(() => setStep(1), session?.user?.name ? 2800 : 2200);
      return () => clearTimeout(t);
    }
  }, [step, session]);

  useEffect(() => {
    if (step >= 1 && step <= 3) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [step]);

  useEffect(() => {
    const s = document.createElement("style");
    s.id = "register-styles";
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

      @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0} }
      @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
      @keyframes scanline { from{transform:translateY(-100%)} to{transform:translateY(100vh)} }

      body { background:#000; overflow:hidden; }

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

      .term-input {
        background: transparent;
        border: none; outline: none;
        font-family: 'Share Tech Mono', monospace;
        font-size: 14px; letter-spacing: .08em;
        color: #ffffff; caret-color: #ffffff;
        width: 100%; padding: 0;
      }
      .term-input::placeholder { color: rgba(255,255,255,.2); }
      .term-input::selection   { background: rgba(255,255,255,.15); }

      .cursor-blink { animation: blink 1s step-end infinite; }
      .req-ok  { color: rgba(100,220,120,.9); }
      .req-bad { color: rgba(255,255,255,.25); }

      .confirm-btn {
        background: transparent;
        border: 1px solid rgba(255,255,255,.2);
        color: rgba(255,255,255,.55);
        font-family: 'Share Tech Mono', monospace;
        font-size: 10px; letter-spacing: .2em;
        padding: 4px 14px; cursor: pointer;
        transition: all .2s;
      }
      .confirm-btn:hover { border-color: rgba(255,255,255,.7); color: #fff; }

      .moving-scan {
        position:fixed; top:0; left:0; right:0; height:1px;
        background:rgba(255,255,255,.03);
        animation:scanline 10s linear infinite;
        pointer-events:none; z-index:10000;
      }
    `;
    document.head.appendChild(s);
    return () => document.getElementById("register-styles")?.remove();
  }, []);

  const handleUsername = (e) => {
    e.preventDefault();
    const err = validateUsername(username);
    if (err) { setError(err); return; }
    setError(""); setStep(2);
  };

  const handlePassword = (e) => {
    e.preventDefault();
    const err = validatePassword(password);
    if (err) { setError(err); return; }
    setError(""); setStep(3);
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (confirm !== password) { setError("las contraseñas no coinciden"); return; }
    setError("");
    setStep(4);

    // Animación de progreso
    [{ p:20,d:300 },{ p:45,d:700 },{ p:70,d:1200 },{ p:90,d:1800 },{ p:100,d:2400 }]
      .forEach(({ p, d }) => setTimeout(() => setProgress(p), d));

    // Llamada al backend después de la animación
    setTimeout(async () => {
      try {
        const res = await fetch('http://localhost:4000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            googleId: session?.user?.id  || session?.user?.sub,
            email:    session?.user?.email,
            nombre:   session?.user?.name,
            username,
            password,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          // Volver al step 3 con el error
          setStep(3);
          setProgress(0);
          setError(data.error || 'Error al registrar');
          return;
        }

        // Éxito
        setStep(5);
        setTimeout(() => router.push('/feed'), 2000);

      } catch (err) {
        setStep(3);
        setProgress(0);
        setError('No se pudo conectar con el servidor');
      }
    }, 3000);
  };

  const pwReqs = [
    { label: "mínimo 8 caracteres",  ok: password.length >= 8 },
    { label: "máximo 14 caracteres", ok: password.length <= 14 && password.length > 0 },
    { label: "una mayúscula",        ok: /[A-Z]/.test(password) },
    { label: "un número",            ok: /[0-9]/.test(password) },
  ];

  const C  = "rgba(255,255,255,.9)";
  const CD = "rgba(255,255,255,.5)";
  const CF = "rgba(255,255,255,.2)";
  const CB = "rgba(255,255,255,.15)";

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Share Tech Mono', monospace",
    }}>
      <div className="moving-scan" />

      <div style={{
        width: "min(640px, 90vw)",
        border: `1px solid ${CB}`,
        padding: "40px 48px 36px",
        position: "relative",
        animation: "fadeIn .4s ease",
      }}>

        {/* Esquinas */}
        {[
          { top:-1,    left:-1,   borderTop:`1px solid ${CD}`,    borderLeft:`1px solid ${CD}`   },
          { top:-1,    right:-1,  borderTop:`1px solid ${CD}`,    borderRight:`1px solid ${CD}`  },
          { bottom:-1, left:-1,   borderBottom:`1px solid ${CD}`, borderLeft:`1px solid ${CD}`   },
          { bottom:-1, right:-1,  borderBottom:`1px solid ${CD}`, borderRight:`1px solid ${CD}`  },
        ].map((s, i) => (
          <div key={i} style={{ position:"absolute", width:20, height:20, ...s }} />
        ))}

        {/* Header */}
        <div style={{
          fontSize:9, letterSpacing:".25em", color: CF,
          marginBottom:32, display:"flex", justifyContent:"space-between",
        }}>
          <span>FACULEAKS · REGISTRO</span>
          <span>NEONDEV · ALPHA</span>
        </div>

        {/* Intro typewriter */}
        <div style={{
          fontSize:12, color: CD,
          letterSpacing:".06em", lineHeight:1.9,
          marginBottom:28, whiteSpace:"pre-line", minHeight:58,
        }}>
          {introText}
        </div>

        {/* ── STEP 1: USERNAME ── */}
        {step >= 1 && step < 4 && (
          <div style={{ marginBottom:20, animation:"fadeIn .3s ease" }}>
            <TermLine text="> elige tu identificador público" color={CD} />
            <TermLine text="> será tu nombre en el vlog y tu login" delay={120} color={CF} style={{ fontSize:10, marginBottom:10 }} />

            {step === 1 ? (
              <form onSubmit={handleUsername}>
                <div style={{ display:"flex", alignItems:"center", gap:8, borderBottom:`1px solid ${CB}`, paddingBottom:6, marginTop:8 }}>
                  <span style={{ color:CD, fontSize:12 }}>@</span>
                  <input
                    ref={inputRef}
                    className="term-input"
                    value={username}
                    onChange={e => { setUsername(e.target.value); setError(""); }}
                    placeholder="tu_nombre"
                    maxLength={20}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8 }}>
                  <span style={{ fontSize:10, letterSpacing:".06em", color: error ? "rgba(220,80,80,.9)" : CF }}>
                    {error ? `> ERROR: ${error}` : `> ${username.length}/20`}
                  </span>
                  <button type="submit" className="confirm-btn">CONFIRMAR →</button>
                </div>
              </form>
            ) : (
              <div style={{ marginTop:8, fontSize:13, color:"rgba(100,220,120,.9)", letterSpacing:".06em" }}>
                @ {username} <span style={{ color:"rgba(100,220,120,.5)", fontSize:10 }}>✓ confirmado</span>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: PASSWORD ── */}
        {step >= 2 && step < 4 && (
          <div style={{ marginBottom:20, animation:"fadeIn .3s ease" }}>
            <div style={{ height:1, background:CB, margin:"16px 0" }} />
            <TermLine text="> define tu clave de acceso" color={CD} />

            {step === 2 ? (
              <form onSubmit={handlePassword}>
                <div style={{ display:"flex", alignItems:"center", gap:8, borderBottom:`1px solid ${CB}`, paddingBottom:6, marginTop:8 }}>
                  <span style={{ color:CD, fontSize:12 }}>$</span>
                  <input
                    ref={inputRef}
                    className="term-input"
                    type="password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(""); }}
                    placeholder="••••••••"
                    maxLength={14}
                    autoComplete="new-password"
                  />
                </div>
                <div style={{ marginTop:10, display:"grid", gridTemplateColumns:"1fr 1fr", gap:"2px 16px" }}>
                  {pwReqs.map((r, i) => (
                    <div key={i} className={r.ok ? "req-ok" : "req-bad"} style={{ fontSize:10, letterSpacing:".05em" }}>
                      {r.ok ? "✓" : "○"} {r.label}
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:10 }}>
                  <span style={{ fontSize:10, letterSpacing:".06em", color: error ? "rgba(220,80,80,.9)" : CF }}>
                    {error ? `> ERROR: ${error}` : `> ${password.length}/14`}
                  </span>
                  <button type="submit" className="confirm-btn">CONFIRMAR →</button>
                </div>
              </form>
            ) : (
              <div style={{ marginTop:8, fontSize:13, color:"rgba(100,220,120,.9)", letterSpacing:".06em" }}>
                clave establecida <span style={{ color:"rgba(100,220,120,.5)", fontSize:10 }}>✓</span>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: CONFIRM ── */}
        {step === 3 && (
          <div style={{ marginBottom:20, animation:"fadeIn .3s ease" }}>
            <div style={{ height:1, background:CB, margin:"16px 0" }} />
            <TermLine text="> confirma tu clave de acceso" color={CD} />
            <form onSubmit={handleConfirm}>
              <div style={{ display:"flex", alignItems:"center", gap:8, borderBottom:`1px solid ${CB}`, paddingBottom:6, marginTop:8 }}>
                <span style={{ color:CD, fontSize:12 }}>$</span>
                <input
                  ref={inputRef}
                  className="term-input"
                  type="password"
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); setError(""); }}
                  placeholder="••••••••"
                  maxLength={14}
                  autoComplete="new-password"
                />
              </div>
              {confirm.length > 0 && (
                <div style={{ fontSize:10, marginTop:6, letterSpacing:".05em",
                  color: confirm === password ? "rgba(100,220,120,.9)" : "rgba(220,80,80,.7)" }}>
                  {confirm === password ? "✓ coinciden" : "✗ no coinciden"}
                </div>
              )}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:10 }}>
                <span style={{ fontSize:10, color:"rgba(220,80,80,.9)", letterSpacing:".06em" }}>
                  {error ? `> ERROR: ${error}` : ""}
                </span>
                <button type="submit" className="confirm-btn">CREAR CUENTA →</button>
              </div>
            </form>
          </div>
        )}

        {/* ── STEP 4: LOADING ── */}
        {step === 4 && (
          <div style={{ animation:"fadeIn .3s ease", marginTop:8 }}>
            <div style={{ height:1, background:CB, margin:"16px 0" }} />
            <TermLine text="> creando perfil..."                delay={0}    color={CD} />
            <TermLine text="> cifrando credenciales..."         delay={400}  color={CF} />
            <TermLine text="> registrando en base de datos..."  delay={900}  color={CF} />
            <TermLine text="> configurando vlog..."             delay={1500} color={CF} />
            <div style={{ marginTop:16 }}>
              <ProgressBar percent={progress} />
            </div>
          </div>
        )}

        {/* ── STEP 5: SUCCESS ── */}
        {step === 5 && (
          <div style={{ animation:"fadeIn .4s ease", marginTop:8 }}>
            <div style={{ height:1, background:CB, margin:"16px 0" }} />
            <div style={{ fontSize:12, color:"rgba(100,220,120,.95)", letterSpacing:".08em", lineHeight:2 }}>
              <div>{">"} acceso concedido</div>
              <div>{">"} bienvenido, <span style={{ color:"#fff" }}>{"@"}{username}</span></div>
              <div style={{ color:"rgba(100,220,120,.4)", fontSize:10, marginTop:4 }}>
                redirigiendo al sistema<span className="cursor-blink">_</span>
              </div>
            </div>
          </div>
        )}

        {/* Cursor idle */}
        {step === 0 && (
          <span className="cursor-blink" style={{ color:CD, fontSize:12 }}>_</span>
        )}

        {/* Footer */}
        <div style={{
          marginTop:36, fontSize:8, color:CF,
          letterSpacing:".2em", display:"flex", justifyContent:"space-between",
        }}>
          <span>FACULEAKS · ALPHA</span>
          <span>NEONDEV STUDIO</span>
        </div>
      </div>
    </div>
  );
}
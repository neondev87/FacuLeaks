"use client";

import { useSession } from "next-auth/react";
import useInjectedStyles from "@/hooks/useInjectedStyles";
import useRegister from "@/hooks/useRegister";
import TermLine from "@/components/register/TermLine";
import ProgressBar from "@/components/register/ProgressBar";
import { registerStyles } from "./registerStyles";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: app/register/page.js — completar el registro (por pasos)
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: cuando alguien se loguea con Google por primera vez, NextAuth
// sabe que existe en Google pero el backend todavía no tiene una fila para
// esa persona — acá se completa: elegir username y contraseña, y al
// confirmar se manda todo a POST /api/auth/register. Toda la lógica vive en
// hooks/useRegister.js (parejado con el patrón de Fase 2 el 2026-09-04);
// este archivo es el JSX de los 6 pasos.
//
// PARA QUÉ SIRVE: es el puente entre "tenés cuenta de Google" y "tenés
// cuenta en FacuLeaks". Fase 3 va a rediseñar SOLO lo visual de esta
// pantalla — el flujo de pasos se mantiene igual.
//
// CON QUÉ SE CONECTA: hooks/useRegister.js, components/register/*.
// ════════════════════════════════════════════════════════════════════════
export default function RegisterPage() {
  const { data: session, status } = useSession();

  const {
    checking, step, inputRef, introText,
    username, setUsername, password, setPassword, confirm, setConfirm,
    error, setError, progress, pwReqs,
    handleUsername, handlePassword, handleConfirm,
  } = useRegister({ status, session });

  useInjectedStyles("register-styles", registerStyles);

  const CD = "rgba(255,255,255,.5)";
  const CF = "rgba(255,255,255,.2)";
  const CB = "rgba(255,255,255,.15)";

  if (status === "loading" || checking) return null;

  return (
    <div style={{
      position:"fixed", inset:0, background:"#000",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily:"'Share Tech Mono',monospace",
    }}>
      <div className="moving-scan" />
      <div style={{
        width:"min(640px, 90vw)", border:`1px solid ${CB}`,
        padding:"40px 48px 36px", position:"relative", animation:"fadeIn .4s ease",
      }}>
        {[
          { top:-1,    left:-1,   borderTop:`1px solid ${CD}`,    borderLeft:`1px solid ${CD}`   },
          { top:-1,    right:-1,  borderTop:`1px solid ${CD}`,    borderRight:`1px solid ${CD}`  },
          { bottom:-1, left:-1,   borderBottom:`1px solid ${CD}`, borderLeft:`1px solid ${CD}`   },
          { bottom:-1, right:-1,  borderBottom:`1px solid ${CD}`, borderRight:`1px solid ${CD}`  },
        ].map((s, i) => <div key={i} style={{ position:"absolute", width:20, height:20, ...s }} />)}

        <div style={{ fontSize:9, letterSpacing:".25em", color:CF, marginBottom:32, display:"flex", justifyContent:"space-between" }}>
          <span>FACULEAKS · REGISTRO</span><span>NEONDEV · ALPHA</span>
        </div>

        <div style={{ fontSize:12, color:CD, letterSpacing:".06em", lineHeight:1.9, marginBottom:28, whiteSpace:"pre-line", minHeight:58 }}>
          {introText}
        </div>

        {step >= 1 && step < 4 && (
          <div style={{ marginBottom:20, animation:"fadeIn .3s ease" }}>
            <TermLine text="> elige tu identificador público" color={CD} />
            <TermLine text="> será tu nombre en el vlog y tu login" delay={120} color={CF} style={{ fontSize:10, marginBottom:10 }} />
            {step === 1 ? (
              <form onSubmit={handleUsername}>
                <div style={{ display:"flex", alignItems:"center", gap:8, borderBottom:`1px solid ${CB}`, paddingBottom:6, marginTop:8 }}>
                  <span style={{ color:CD, fontSize:12 }}>@</span>
                  <input ref={inputRef} className="term-input" value={username}
                    onChange={e => { setUsername(e.target.value); setError(""); }}
                    placeholder="tu_nombre" maxLength={20} autoComplete="off" spellCheck={false} />
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

        {step >= 2 && step < 4 && (
          <div style={{ marginBottom:20, animation:"fadeIn .3s ease" }}>
            <div style={{ height:1, background:CB, margin:"16px 0" }} />
            <TermLine text="> define tu clave de acceso" color={CD} />
            {step === 2 ? (
              <form onSubmit={handlePassword}>
                <div style={{ display:"flex", alignItems:"center", gap:8, borderBottom:`1px solid ${CB}`, paddingBottom:6, marginTop:8 }}>
                  <span style={{ color:CD, fontSize:12 }}>$</span>
                  <input ref={inputRef} className="term-input" type="password" value={password}
                    onChange={e => { setPassword(e.target.value); setError(""); }}
                    placeholder="••••••••" maxLength={14} autoComplete="new-password" />
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

        {step === 3 && (
          <div style={{ marginBottom:20, animation:"fadeIn .3s ease" }}>
            <div style={{ height:1, background:CB, margin:"16px 0" }} />
            <TermLine text="> confirma tu clave de acceso" color={CD} />
            <form onSubmit={handleConfirm}>
              <div style={{ display:"flex", alignItems:"center", gap:8, borderBottom:`1px solid ${CB}`, paddingBottom:6, marginTop:8 }}>
                <span style={{ color:CD, fontSize:12 }}>$</span>
                <input ref={inputRef} className="term-input" type="password" value={confirm}
                  onChange={e => { setConfirm(e.target.value); setError(""); }}
                  placeholder="••••••••" maxLength={14} autoComplete="new-password" />
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

        {step === 4 && (
          <div style={{ animation:"fadeIn .3s ease", marginTop:8 }}>
            <div style={{ height:1, background:CB, margin:"16px 0" }} />
            <TermLine text="> creando perfil..."               delay={0}    color={CD} />
            <TermLine text="> cifrando credenciales..."        delay={400}  color={CF} />
            <TermLine text="> registrando en base de datos..." delay={900}  color={CF} />
            <TermLine text="> configurando vlog..."            delay={1500} color={CF} />
            <div style={{ marginTop:16 }}><ProgressBar percent={progress} /></div>
          </div>
        )}

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

        {step === 0 && <span className="cursor-blink" style={{ color:CD, fontSize:12 }}>_</span>}

        <div style={{ marginTop:36, fontSize:8, color:CF, letterSpacing:".2em", display:"flex", justifyContent:"space-between" }}>
          <span>FACULEAKS · ALPHA</span><span>NEONDEV STUDIO</span>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import useInjectedStyles from "@/hooks/useInjectedStyles";
import useRegister from "@/hooks/useRegister";
import { registerStyles } from "./registerStyles";
import { FACULTADES, siglasFacultad } from "@/lib/facultades";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: app/register/page.js — completar el registro (por pasos)
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: cuando alguien se loguea con Google por primera vez, NextAuth
// sabe que existe en Google pero el backend todavía no tiene una fila para
// esa persona — acá se completa: elegir username, facultad y contraseña, y
// al confirmar se manda todo a POST /api/auth/register. Toda la lógica de
// pasos/validación vive en hooks/useRegister.js; este archivo es el JSX +
// la transición visual entre pasos.
//
// REDISEÑO 2026-09-11 (a pedido explícito de Erick, con lienzo de diseño
// aprobado antes de tocar código): deja la estética terminal por la misma
// dirección "Holographic" del resto de la app. El FLUJO de useRegister.js
// no cambió (mismos 7 pasos, misma validación) — ver registerStyles.js
// para el detalle de qué cambió y por qué.
//
// CON QUÉ SE CONECTA: hooks/useRegister.js, lib/facultades.js.
// ════════════════════════════════════════════════════════════════════════

const EyeIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3.5-8 10-8 10 8 10 8-3.5 8-10 8-10-8-10-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-10-8-10-8a18.4 18.4 0 0 1 4.22-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.42 18.42 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);
const CheckIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffd23d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
// Escudo "Contorno" — idéntico al de components/Navbar.js, para que la
// marca de esta pantalla sea la misma que la del resto de la app.
const ShieldLogo = ({ size = 19 }) => (
  <svg width={size} height={size * (21 / 19)} viewBox="0 0 160 178" fill="none" aria-hidden="true">
    <path d="M14 14 Q80 4 146 14 L146 66 Q146 128 80 158 Q14 128 14 66 Z" fill="none" stroke="#F4EEDD" strokeWidth="9" />
    <path d="M14 42 L146 42" stroke="#F4EEDD" strokeWidth="7" />
    <text x="80" y="128" fontFamily="'Cormorant Garamond',serif" fontWeight="700" fontSize="108" fill="#F4EEDD" textAnchor="middle">FL</text>
  </svg>
);

// Anima el cambio de un paso a otro: espera a que la salida termine antes
// de montar el contenido del paso nuevo (si no, se ven los dos pisados un
// instante) — mismo patrón que se probó en el lienzo de diseño. Respeta
// prefers-reduced-motion saltando directo al contenido nuevo.
function useStepTransition(step) {
  const [displayStep, setDisplayStep] = useState(step);
  const [animClass, setAnimClass] = useState("");
  const timers = useRef([]);

  useEffect(() => {
    if (step === displayStep) return;
    timers.current.forEach(clearTimeout);
    timers.current = [];

    const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { timers.current.push(setTimeout(() => { setDisplayStep(step); setAnimClass(""); }, 0)); return; }

    timers.current.push(setTimeout(() => {
      setAnimClass("reg-stage-leave");
      timers.current.push(setTimeout(() => {
        setDisplayStep(step);
        setAnimClass("reg-stage-enter");
        timers.current.push(setTimeout(() => setAnimClass(""), 420));
      }, 210));
    }, 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  return { displayStep, animClass };
}

const progressPct = { 1: 25, 2: 50, 3: 75, 4: 100 };

export default function RegisterPage() {
  const { data: session, status } = useSession();

  const {
    checking, step, inputRef, introText,
    username, setUsername, facultad, password, setPassword, confirm, setConfirm,
    error, setError, progress, pwReqs,
    handleUsername, handleFacultad, handlePassword, handleConfirm,
  } = useRegister({ status, session });

  useInjectedStyles("register-styles", registerStyles);

  const [showPw, setShowPw] = useState(false);
  // "Entrando a FacuLeaks": arranca ~900ms después de llegar al paso 6
  // (deja un respiro para leer "Listo, @usuario"), la tarjeta se apaga y
  // la marca se enciende de oscura a color antes de que useRegister.js
  // navegue de verdad a /feed.
  const [entering, setEntering] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [bloom, setBloom] = useState(false);

  const { displayStep, animClass } = useStepTransition(step);

  useEffect(() => {
    if (step !== 6) {
      const reset = setTimeout(() => { setEntering(false); setOverlayVisible(false); setBloom(false); }, 0);
      return () => clearTimeout(reset);
    }
    const t = setTimeout(() => setEntering(true), 900);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    if (!entering) return undefined;
    const raf = requestAnimationFrame(() => setOverlayVisible(true));
    const t = setTimeout(() => setBloom(true), 500);
    return () => { cancelAnimationFrame(raf); clearTimeout(t); };
  }, [entering]);

  if (status === "loading" || checking) return null;

  const doneRows = (upTo) => (
    <div className="reg-done-stack">
      {upTo >= 1 && <div className="reg-done-row">@{username} <span className="dim">✓ confirmado</span></div>}
      {upTo >= 2 && facultad && (
        <div className="reg-done-row">
          <img src={`/facultades/${FACULTADES.find(f => f.value === facultad)?.archivo}`} alt="" />
          {siglasFacultad(facultad)} <span className="dim">✓ confirmado</span>
        </div>
      )}
      {upTo >= 3 && <div className="reg-done-row">contraseña establecida <span className="dim">✓</span></div>}
    </div>
  );

  const progressBlock = (n) => (
    <div className="reg-kicker-row">
      <span className="reg-kicker">{`// registro · paso ${n} de 4`}</span>
      <div className="reg-progress-track"><div className="reg-progress-fill" style={{ width: `${progressPct[n]}%` }} /></div>
    </div>
  );

  const statusLine = (label, start, doneAt) => {
    if (progress >= doneAt) return <span className="done">✓ {label}</span>;
    if (progress >= start) return <span className="active"><span className="reg-dot-pulse" /> {label}</span>;
    return <span className="pending">○ {label}</span>;
  };

  let content = null;

  if (displayStep === 0) {
    content = (
      <div style={{ minHeight: 58, fontFamily: "'Inter',sans-serif", fontSize: 14, color: "rgba(242,240,248,.75)", lineHeight: 1.7 }}>
        {introText}
      </div>
    );
  } else if (displayStep === 1) {
    content = (
      <>
        {progressBlock(1)}
        <div className="reg-head">
          <h1>Hola — armemos tu cuenta</h1>
          <p>Elegí un nombre de usuario. Va a ser tu identificador público y tu login.</p>
        </div>
        <form onSubmit={handleUsername}>
          <div className="reg-field">
            <label htmlFor="reg-username">Usuario</label>
            <div className="reg-input-row">
              <span className="at">@</span>
              <input ref={inputRef} id="reg-username" value={username}
                onChange={e => { setUsername(e.target.value); setError(""); }}
                placeholder="tu_nombre" maxLength={20} autoComplete="off" spellCheck={false} />
            </div>
            <div className="reg-hint-row">
              <span>{username.length}/20</span>
              <span>letras, números y guión bajo</span>
            </div>
            {error && <div className="reg-error">{error}</div>}
          </div>
          <button type="submit" className="reg-cta" style={{ marginTop: 20 }}
            disabled={!/^[a-zA-Z0-9_]+$/.test(username) || username.length < 3}>
            Continuar
          </button>
        </form>
      </>
    );
  } else if (displayStep === 2) {
    content = (
      <>
        {progressBlock(2)}
        {doneRows(1)}
        <div className="reg-head">
          <h1>¿A qué facultad vas?</h1>
          <p>Así te va a identificar el resto de la comunidad.</p>
        </div>
        <div className="reg-campus-group">
          {["San Nicolás", "Mederos"].map(campus => (
            <div key={campus} className="reg-campus">
              <span className="reg-campus-label">{campus}</span>
              <div className="reg-fac-grid">
                {FACULTADES.filter(f => f.campus === campus).map(f => (
                  <button key={f.value} type="button"
                    className={`reg-fac-card${facultad === f.value ? " selected" : ""}`}
                    onClick={() => handleFacultad(f.value)} title={f.nombre}>
                    <img src={`/facultades/${f.archivo}`} alt="" />
                    <span>{f.siglas}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  } else if (displayStep === 3) {
    content = (
      <>
        {progressBlock(3)}
        {doneRows(2)}
        <div className="reg-head">
          <h1>Definí tu contraseña</h1>
          <p>Entre 8 y 14 caracteres, con al menos una mayúscula y un número.</p>
        </div>
        <form onSubmit={handlePassword}>
          <div className="reg-field">
            <label htmlFor="reg-password">Contraseña</label>
            <div className="reg-input-row">
              <input ref={inputRef} id="reg-password" type={showPw ? "text" : "password"} value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                placeholder="••••••••" maxLength={14} autoComplete="new-password" />
              <button type="button" className="reg-eye-btn" onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? "ocultar contraseña" : "mostrar contraseña"}>
                {showPw ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            <div className="reg-reqs">
              {pwReqs.map((r, i) => <span key={i} className={r.ok ? "ok" : ""}>{r.ok ? "✓" : "○"} {r.label}</span>)}
            </div>
            {error && <div className="reg-error">{error}</div>}
          </div>
          <button type="submit" className="reg-cta" style={{ marginTop: 20 }} disabled={!pwReqs.every(r => r.ok)}>
            Continuar
          </button>
        </form>
      </>
    );
  } else if (displayStep === 4) {
    const match = confirm.length > 0 && confirm === password;
    content = (
      <>
        {progressBlock(4)}
        {doneRows(3)}
        <div className="reg-head">
          <h1>Confirmá tu contraseña</h1>
          <p>Una vez más, para estar seguros de que no hay errores de tipeo.</p>
        </div>
        <form onSubmit={handleConfirm}>
          <div className="reg-field">
            <label htmlFor="reg-confirm">Confirmar contraseña</label>
            <div className="reg-input-row">
              <input ref={inputRef} id="reg-confirm" type={showPw ? "text" : "password"} value={confirm}
                onChange={e => { setConfirm(e.target.value); setError(""); }}
                placeholder="••••••••" maxLength={14} autoComplete="new-password" />
              <button type="button" className="reg-eye-btn" onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? "ocultar contraseña" : "mostrar contraseña"}>
                {showPw ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {confirm.length > 0 && (
              <div className={`reg-match-hint ${match ? "ok" : "bad"}`}>{match ? "✓ coinciden" : "✗ no coinciden"}</div>
            )}
            {error && <div className="reg-error">{error}</div>}
          </div>
          <button type="submit" className="reg-cta" style={{ marginTop: 20 }} disabled={!match}>
            Crear cuenta
          </button>
        </form>
      </>
    );
  } else if (displayStep === 5) {
    content = (
      <div className="reg-loading">
        <h1>Preparando tu cuenta</h1>
        <div className="reg-progress-track" style={{ width: "100%" }}>
          <div className="reg-progress-fill" style={{ width: `${Math.max(progress, 6)}%` }} />
        </div>
        <div className="reg-status-stack">
          {statusLine("creando tu perfil", 0, 45)}
          {statusLine("configurando tu muro", 45, 90)}
          {statusLine("casi listo", 90, 101)}
        </div>
      </div>
    );
  } else if (displayStep === 6) {
    content = (
      <div className="reg-welcome">
        <div className="reg-check-badge"><CheckIcon /></div>
        <h1>Listo, @{username}</h1>
        <p>Tu cuenta está creada. Te llevamos a FacuLeaks.</p>
      </div>
    );
  }

  return (
    <div className="reg-page">
      <div className={`reg-shell${entering ? " reg-shell--exit" : ""}`}>
        <div className="reg-brand"><ShieldLogo /><span>FACULEAKS</span></div>
        <div className="reg-card"><div id="reg-stage" className={animClass}>{content}</div></div>
        <span className="reg-foot">FacuLeaks · alpha</span>
      </div>

      {entering && (
        <div className={`reg-enter-overlay${overlayVisible ? " show" : ""}`}>
          <div className={`reg-enter-content${bloom ? " bloom" : ""}`} style={{ position: "relative" }}>
            <div className="reg-enter-glow" />
            <ShieldLogo size={44} />
            <p>entrando a faculeaks</p>
          </div>
        </div>
      )}
    </div>
  );
}

// MÓDULO: app/register/registerStyles.js
// CSS de la página de registro. Se inyecta con hooks/useInjectedStyles.js
// ("register-styles", …) desde app/register/page.js.
//
// Rediseño 2026-09-11 (a pedido explícito de Erick, con lienzo de diseño
// aprobado antes de tocar código): esta página deja la estética terminal
// (Share Tech Mono, scanline, cursor parpadeante) y pasa a la misma
// dirección "Holographic" que ya usan Muro/Perfil/Chat/Foro/Amigos —
// Cinzel + Inter + Space Mono, fondo casi negro, tarjeta con hairlines.
// El flujo de pasos de hooks/useRegister.js NO cambió, solo el vestuario.
import { FONT_IMPORT_MAIN, KF, HOLO_THEME } from "@/lib/theme";

export const registerStyles = `
      ${FONT_IMPORT_MAIN}
      @import url('https://fonts.googleapis.com/css2?family=Marcellus+SC&display=swap');
      ${KF.fadeIn}
      body { background:${HOLO_THEME.bg}; color:${HOLO_THEME.text}; font-family:'Inter',sans-serif; overflow:hidden; }

      .reg-page { min-height:100vh; display:flex; align-items:center; justify-content:center; padding-block:40px; padding-inline:16px; box-sizing:border-box; }
      .reg-shell { width:100%; max-width:420px; display:flex; flex-direction:column; align-items:center; gap:24px; transition:opacity .45s ease, transform .45s ease; }
      .reg-shell--exit { opacity:0; transform:scale(.97); }

      .reg-brand { display:flex; align-items:center; gap:8px; }
      .reg-brand span { font-family:'Marcellus SC',serif; font-size:13px; letter-spacing:.18em; color:#F4EEDD; }

      .reg-card { width:100%; box-sizing:border-box; background:${HOLO_THEME.panel}; border:1px solid ${HOLO_THEME.hairlineSoft}; border-radius:18px; padding:30px 26px 26px; box-shadow:0 30px 80px rgba(0,0,0,.5); overflow:hidden; }
      #reg-stage { display:flex; flex-direction:column; gap:22px; }

      .reg-kicker-row { display:flex; flex-direction:column; gap:8px; }
      .reg-kicker { font-family:'Space Mono',monospace; font-size:10px; letter-spacing:.14em; color:${HOLO_THEME.textDim}; }
      .reg-progress-track { height:3px; border-radius:999px; background:${HOLO_THEME.hairlineSoft}; overflow:hidden; }
      .reg-progress-fill { height:100%; background:rgba(242,240,248,.55); border-radius:999px; transition:width .5s cubic-bezier(.2,.7,.3,1); }

      .reg-done-stack { display:flex; flex-direction:column; gap:6px; }
      .reg-done-row { display:flex; align-items:center; gap:6px; font-family:'Inter',sans-serif; font-size:12px; color:rgba(100,220,120,.9); }
      .reg-done-row img { width:14px; height:14px; object-fit:contain; }
      .reg-done-row .dim { color:rgba(100,220,120,.5); font-size:10px; }

      .reg-head { display:flex; flex-direction:column; gap:8px; }
      .reg-head h1 { font-family:'Cinzel',serif; font-weight:600; font-size:22px; color:${HOLO_THEME.text}; letter-spacing:.015em; line-height:1.3; margin:0; text-wrap:balance; }
      .reg-head p { font-family:'Inter',sans-serif; font-size:13px; color:${HOLO_THEME.textDim}; line-height:1.65; margin:0; max-width:32ch; }

      .reg-field { display:flex; flex-direction:column; gap:8px; }
      .reg-field label { font-family:'Inter',sans-serif; font-size:11px; color:${HOLO_THEME.textDim}; letter-spacing:.04em; }
      .reg-input-row { display:flex; align-items:center; gap:8px; background:rgba(255,255,255,.05); border:1px solid ${HOLO_THEME.hairline}; border-radius:8px; padding:13px 15px; transition:border-color .15s, background .15s; }
      .reg-input-row:focus-within { border-color:rgba(255,255,255,.4); background:rgba(255,255,255,.07); }
      .reg-input-row .at { font-size:14px; color:${HOLO_THEME.textDim}; flex-shrink:0; }
      .reg-input-row input { flex:1; min-width:0; background:none; border:none; outline:none; font-family:'Inter',sans-serif; font-size:14px; color:${HOLO_THEME.text}; }
      .reg-input-row input::placeholder { color:rgba(242,240,248,.28); }
      .reg-eye-btn { background:none; border:none; padding:0; display:flex; color:rgba(255,255,255,.4); cursor:pointer; flex-shrink:0; }
      .reg-eye-btn:hover { color:#fff; }
      .reg-eye-btn:focus-visible { outline:2px solid rgba(242,240,248,.6); outline-offset:2px; border-radius:3px; }

      .reg-hint-row { display:flex; justify-content:space-between; font-family:'Space Mono',monospace; font-size:10px; color:${HOLO_THEME.textDim}; }
      .reg-match-hint { font-family:'Inter',sans-serif; font-size:11px; min-height:15px; }
      .reg-match-hint.ok { color:rgba(100,220,120,.9); }
      .reg-match-hint.bad { color:rgba(220,90,90,.85); }
      .reg-error { font-family:'Inter',sans-serif; font-size:11px; color:rgba(220,90,90,.85); }

      .reg-reqs { display:grid; grid-template-columns:1fr 1fr; gap:6px 14px; }
      .reg-reqs span { font-family:'Inter',sans-serif; font-size:11px; color:#5c596b; transition:color .2s; }
      .reg-reqs span.ok { color:rgba(100,220,120,.9); }

      .reg-campus-group { display:flex; flex-direction:column; gap:14px; max-height:52vh; overflow-y:auto; padding-right:2px; }
      .reg-campus { display:flex; flex-direction:column; gap:8px; }
      .reg-campus-label { font-family:'Space Mono',monospace; font-size:9px; letter-spacing:.16em; color:${HOLO_THEME.textDim}; }
      .reg-fac-grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; }
      .reg-fac-card { display:flex; flex-direction:column; align-items:center; gap:6px; background:rgba(255,255,255,.03); border:1px solid ${HOLO_THEME.hairlineSoft}; border-radius:10px; padding:12px 4px; cursor:pointer; transition:background .15s, border-color .15s; }
      .reg-fac-card:hover { border-color:rgba(255,255,255,.22); }
      .reg-fac-card:focus-visible { outline:2px solid rgba(242,240,248,.6); outline-offset:2px; }
      .reg-fac-card.selected { background:rgba(255,255,255,.07); border-color:rgba(255,255,255,.42); }
      .reg-fac-card img { width:26px; height:26px; object-fit:contain; }
      .reg-fac-card span { font-family:'Space Mono',monospace; font-size:8.5px; color:${HOLO_THEME.textDim}; text-align:center; line-height:1.3; }
      .reg-fac-card.selected span { color:${HOLO_THEME.text}; }

      .reg-cta { width:100%; box-sizing:border-box; background:rgba(242,240,248,.92); color:#111; border:none; border-radius:10px; padding:14px 20px; font-family:'Inter',sans-serif; font-size:14px; font-weight:600; cursor:pointer; transition:background .15s, opacity .15s, transform .1s; }
      .reg-cta:hover:not(:disabled) { background:#fff; }
      .reg-cta:active:not(:disabled) { transform:scale(.98); }
      .reg-cta:disabled { opacity:.32; cursor:not-allowed; }
      .reg-cta:focus-visible { outline:2px solid rgba(242,240,248,.6); outline-offset:2px; }

      .reg-foot { font-family:'Space Mono',monospace; font-size:9px; letter-spacing:.14em; color:rgba(138,135,160,.55); }

      .reg-loading { display:flex; flex-direction:column; align-items:center; text-align:center; gap:22px; }
      .reg-loading h1 { font-family:'Cinzel',serif; font-weight:600; font-size:20px; color:${HOLO_THEME.text}; margin:0; }
      .reg-status-stack { display:flex; flex-direction:column; gap:10px; align-items:flex-start; width:100%; }
      .reg-status-stack .pending { font-family:'Inter',sans-serif; font-size:12px; color:#5c596b; }
      .reg-status-stack .done { font-family:'Inter',sans-serif; font-size:12px; color:rgba(100,220,120,.9); }
      .reg-status-stack .active { display:flex; align-items:center; gap:7px; font-family:'Inter',sans-serif; font-size:12px; color:${HOLO_THEME.text}; }
      .reg-dot-pulse { width:5px; height:5px; border-radius:50%; background:${HOLO_THEME.text}; animation:regDotPulse 1.4s ease-in-out infinite; }

      .reg-welcome { display:flex; flex-direction:column; align-items:center; text-align:center; gap:20px; position:relative; padding-block:6px; }
      .reg-welcome h1 { font-family:'Cinzel',serif; font-weight:600; font-size:24px; color:${HOLO_THEME.text}; margin:0; }
      .reg-welcome p { font-family:'Inter',sans-serif; font-size:13px; color:${HOLO_THEME.textDim}; line-height:1.65; margin:0; max-width:28ch; }
      .reg-check-badge { position:relative; width:60px; height:60px; border-radius:50%; background:rgba(255,210,61,.1); border:1px solid rgba(255,210,61,.4); display:flex; align-items:center; justify-content:center; }

      /* ── "Entrando a FacuLeaks" — pantalla completa que reemplaza a la
         tarjeta al terminar: arranca oscura y sin color, y el logo/resplandor
         se van "encendiendo" antes de pasar al muro real. Un solo efecto
         (filter), nada más se mueve al mismo tiempo. ── */
      .reg-enter-overlay { position:fixed; inset:0; z-index:50; background:${HOLO_THEME.bg}; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:22px; opacity:0; transition:opacity .5s ease; pointer-events:none; }
      .reg-enter-overlay.show { opacity:1; pointer-events:auto; }
      .reg-enter-content { display:flex; flex-direction:column; align-items:center; gap:22px; filter:grayscale(1) brightness(.4) saturate(0); transition:filter 1.3s cubic-bezier(.22,.7,.3,1); }
      .reg-enter-content.bloom { filter:grayscale(0) brightness(1) saturate(1); }
      .reg-enter-glow { position:absolute; top:50%; left:50%; width:340px; height:340px; margin:-170px 0 0 -170px; border-radius:50%; background:radial-gradient(circle, rgba(255,210,61,.16), rgba(197,90,160,.08) 45%, transparent 72%); pointer-events:none; animation:regGlow 2.6s ease-in-out infinite; }
      .reg-enter-content p { font-family:'Space Mono',monospace; font-size:10px; letter-spacing:.16em; color:${HOLO_THEME.textDim}; margin:0; }

      @keyframes regDotPulse { 0%,100%{opacity:.35} 50%{opacity:1} }
      @keyframes regGlow { 0%,100%{opacity:.7; transform:scale(1)} 50%{opacity:1; transform:scale(1.05)} }
      @keyframes regStageIn  { from{opacity:0; transform:translateX(22px)} to{opacity:1; transform:none} }
      @keyframes regStageOut { from{opacity:1; transform:none} to{opacity:0; transform:translateX(-22px)} }
      .reg-stage-enter { animation:regStageIn .4s cubic-bezier(.2,.8,.2,1) both; }
      .reg-stage-leave { animation:regStageOut .2s ease both; }

      @media (prefers-reduced-motion: reduce) {
        .reg-dot-pulse, .reg-enter-glow, .reg-stage-enter, .reg-stage-leave,
        .reg-progress-fill, .reg-shell, .reg-enter-overlay, .reg-enter-content { animation:none !important; transition:none !important; }
      }

      @media (max-width:480px) {
        .reg-card { padding:26px 20px 22px; border-radius:16px; }
        .reg-head h1 { font-size:20px; }
      }
    `;

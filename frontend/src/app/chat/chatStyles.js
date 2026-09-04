// MÓDULO: app/chat/chatStyles.js
// CSS de la página de chat (burbujas, animaciones de escribiendo/grabando,
// scrollbar). Se inyecta con hooks/useInjectedStyles.js ("chat-styles", …)
// desde app/chat/page.js. Es puro texto CSS, no tiene lógica. Comparte
// fuentes/animaciones con las demás páginas vía lib/theme.js; `fadeIn`,
// `flicker` y `micPulse` son propias de esta página (no se repiten en
// ningún otro lado, por eso se quedan acá en vez de en el archivo compartido).
import { FONT_IMPORT_CHAT, NOISE_TEXTURE, KF } from "@/lib/theme";

export const chatStyles = `
      ${FONT_IMPORT_CHAT}
      ${KF.spin}
      @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
      ${KF.fadeUp}
      ${KF.blink}
      @keyframes flicker  { 0%,100%{opacity:1;transform:scaleY(1)} 33%{opacity:.92;transform:scaleY(.97) scaleX(1.02)} 66%{opacity:.96;transform:scaleY(1.02) scaleX(.98)} }
      ${KF.pulse}
      ${KF.wave}
      @keyframes micPulse { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
      body { background:#000; color:#e8e4d9; font-family:'IBM Plex Mono',monospace; font-size:13px; overflow:hidden; }
      ${NOISE_TEXTURE}
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

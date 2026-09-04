// MÓDULO: app/feed/feedStyles.js
// CSS de la página de feed (animaciones, fondo con ruido, hairlines, fuentes
// de Google Fonts propias de esta página). Se inyecta con
// hooks/useInjectedStyles.js ("feed-styles", …) desde app/feed/page.js.
// Es puro texto CSS, no tiene lógica.
export const feedStyles = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Mono:wght@400;700&family=Cinzel:wght@400;600;900&display=swap');
      @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      body { background:#000; color:#e8e4d9; font-family:'Inter',sans-serif; font-size:13px; overflow-x:hidden; }
      body::before { content:''; position:fixed; inset:0; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E"); opacity:.04; pointer-events:none; z-index:9998; }
      ::-webkit-scrollbar { width:4px } ::-webkit-scrollbar-track { background:#000 } ::-webkit-scrollbar-thumb { background:#222 }
      .feed-wrap { padding:68px 28px 48px; max-width:860px; margin:0 auto; animation:fadeIn .5s ease; }
      .post-title-input { width:100%; background:transparent; border:none; outline:none; font-family:'Inter',sans-serif; font-size:14px; font-weight:500; color:rgba(232,228,217,.5); padding:4px 0; margin-bottom:6px; border-bottom:1px solid rgba(255,255,255,.04); }
      .post-title-input::placeholder { color:rgba(232,228,217,.2); }
      .post-title-input:focus { color:#e8e4d9; border-bottom-color:rgba(255,255,255,.1); }
      .post-body-input { width:100%; background:transparent; border:none; outline:none; font-family:'Inter',sans-serif; font-size:13px; color:rgba(232,228,217,.4); padding:4px 0; margin-bottom:8px; resize:none; min-height:36px; border-bottom:1px solid rgba(255,255,255,.08); }
      .post-body-input::placeholder { color:rgba(232,228,217,.2); }
      .post-body-input:focus { color:#e8e4d9; border-bottom-color:rgba(255,255,255,.2); }
      .publish-btn { background:transparent; border:1px solid rgba(255,255,255,.2); color:rgba(255,255,255,.6); font-family:'Space Mono',monospace; font-size:11px; padding:6px 18px; cursor:pointer; letter-spacing:.2em; transition:all .2s; }
      .publish-btn:hover { background:rgba(255,255,255,.06); color:#fff; border-color:rgba(255,255,255,.4); }
      .publish-btn:disabled { opacity:.3; cursor:not-allowed; }
      .spinner { width:14px; height:14px; border:1px solid rgba(255,255,255,.15); border-top-color:rgba(255,255,255,.5); border-radius:50%; animation:spin .7s linear infinite; display:inline-block; }
      .new-badge { background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); color:rgba(255,255,255,.6); font-family:'Inter',sans-serif; font-size:11px; padding:5px 16px; cursor:pointer; transition:all .2s; display:block; width:100%; text-align:center; margin-bottom:12px; }
      .new-badge:hover { background:rgba(255,255,255,.1); color:#fff; }
      .imagen-preview { position:relative; margin-bottom:10px; }
      .imagen-preview img { width:100%; max-height:200px; object-fit:contain; background:#050505; border:1px solid rgba(255,255,255,.08); }
      .imagen-preview-remove { position:absolute; top:6px; right:6px; background:#000; border:1px solid rgba(255,255,255,.2); color:rgba(255,255,255,.6); width:22px; height:22px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:12px; }
    `;

// MÓDULO: app/foro/foroStyles.js
// CSS del foro. Se inyecta con hooks/useInjectedStyles.js ("foro-styles", …)
// desde app/foro/page.js.
//
// Fase 3 (2026-09-06): el foro pasa a ser FUNCIONAL — dirección "Tablón" con
// paleta "Grafito" (acento gris #9a9aa6, sobrio). Canales a la izquierda, un
// tema central arriba (lo crea solo el admin), lista de comentarios abajo
// (SIN título), y para escribir un comentario se abre un composer a pantalla
// completa (estilo "un hilo por pantalla"). Fondo plano igual que Perfil.
import { FONT_IMPORT_MAIN, HOLO_THEME } from "@/lib/theme";

const AC = "#9a9aa6";                 // acento grafito
const AC_SOFT = "rgba(154,154,166,.14)";

export const foroStyles = `
      ${FONT_IMPORT_MAIN}
      @keyframes fadeIn { from{opacity:0} to{opacity:1} }
      @keyframes rise   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
      @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      body { background:${HOLO_THEME.bg}; color:${HOLO_THEME.text}; font-family:'Inter',sans-serif; font-size:13px; overflow:hidden; }
      ::-webkit-scrollbar { width:5px } ::-webkit-scrollbar-track { background:transparent } ::-webkit-scrollbar-thumb { background:rgba(255,255,255,.14); border-radius:99px }

      .foro { display:flex; height:calc(100vh - 48px); margin-top:48px; }

      /* ── canales ── */
      .foro-side { width:200px; flex-shrink:0; border-right:1px solid ${HOLO_THEME.hairlineSoft}; background:${HOLO_THEME.panel}; display:flex; flex-direction:column; }
      .foro-side__h { font-family:'Space Mono',monospace; font-size:9px; letter-spacing:.24em; color:${HOLO_THEME.textDim}; padding:18px 18px 8px; }
      .foro-side__list { flex:1; overflow-y:auto; padding-bottom:10px; }
      .foro-side__empty { padding:14px 18px; font-family:'Space Mono',monospace; font-size:10px; line-height:1.6; color:${HOLO_THEME.textDim}; letter-spacing:.04em; }
      .canal { display:flex; align-items:center; gap:8px; padding:9px 14px 9px 18px; font-size:13px; color:rgba(242,240,248,.58); cursor:pointer; border-left:2px solid transparent; transition:color .14s, background .14s, border-color .14s; }
      .canal:hover { color:${HOLO_THEME.text}; background:rgba(255,255,255,.02); }
      .canal.on { color:${HOLO_THEME.text}; border-left-color:${AC}; background:${AC_SOFT}; }
      .canal__t { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .canal .cnt { font-family:'Space Mono',monospace; font-size:10px; color:${HOLO_THEME.textDim}; }
      .canal__del { flex:none; background:none; border:0; padding:2px; cursor:pointer; color:rgba(242,240,248,.22); display:flex; opacity:0; transition:color .14s, opacity .14s; }
      .canal:hover .canal__del { opacity:1; }
      .canal__del:hover { color:rgba(255,90,90,.9); }
      .canal-add { display:block; width:calc(100% - 24px); margin:10px 12px 4px; background:none; border:1px dashed ${HOLO_THEME.hairline}; color:${HOLO_THEME.textDim}; font-family:'Space Mono',monospace; font-size:10px; letter-spacing:.12em; padding:8px 10px; border-radius:9px; cursor:pointer; transition:color .14s, border-color .14s; }
      .canal-add:hover { color:${HOLO_THEME.text}; border-color:${AC}; }
      .foro-newcanal { margin:10px 12px 4px; display:flex; flex-direction:column; gap:7px; }
      .foro-newcanal input { background:${HOLO_THEME.bg}; border:1px solid ${HOLO_THEME.hairline}; border-radius:9px; padding:8px 11px; color:${HOLO_THEME.text}; font-family:'Inter',sans-serif; font-size:13px; outline:0; }
      .foro-newcanal input::placeholder { color:rgba(242,240,248,.3); }
      .foro-newcanal input:focus { border-color:${AC}; }
      .foro-newcanal__row { display:flex; gap:6px; }
      .foro-newcanal__row button { flex:1; background:${AC}; color:#0b0b0e; border:0; font-family:'Space Mono',monospace; font-weight:700; font-size:10px; letter-spacing:.12em; padding:8px 0; border-radius:8px; cursor:pointer; }
      .foro-newcanal__row .ghost { flex:0 0 34px; background:none; border:1px solid ${HOLO_THEME.hairline}; color:${HOLO_THEME.textDim}; font-weight:400; }
      .foro-side__me { padding:12px 16px; border-top:1px solid rgba(255,255,255,.07); font-family:'Space Mono',monospace; font-size:10px; color:rgba(255,255,255,.3); letter-spacing:.1em; }

      /* ── tablero ── */
      .foro-board { flex:1; min-width:0; display:flex; flex-direction:column; position:relative; }

      .foro-theme { position:relative; margin:22px 24px 12px; padding:26px 30px 24px; border:1px solid ${HOLO_THEME.hairline}; border-radius:14px; background:linear-gradient(180deg, ${AC_SOFT}, transparent 82%), ${HOLO_THEME.panel}; text-align:center; animation:rise .3s both; }
      .foro-theme__k { font-family:'Space Mono',monospace; font-size:9px; letter-spacing:.24em; color:${AC}; }
      .foro-theme__t { font-family:'Cinzel',serif; font-size:22px; color:${HOLO_THEME.text}; margin:10px auto 0; line-height:1.4; max-width:680px; text-wrap:balance; }
      .foro-theme__meta { font-family:'Space Mono',monospace; font-size:10px; color:${HOLO_THEME.textDim}; margin-top:12px; }
      .foro-theme__go { margin-top:16px; background:${AC}; color:#0b0b0e; border:0; font-family:'Space Mono',monospace; font-weight:700; font-size:10px; letter-spacing:.16em; padding:10px 24px; border-radius:20px; cursor:pointer; transition:filter .15s; }
      .foro-theme__go:hover { filter:brightness(1.1); }
      .foro-theme__del { position:absolute; top:14px; right:18px; background:none; border:0; color:rgba(242,240,248,.28); cursor:pointer; padding:4px; display:flex; transition:color .15s; }
      .foro-theme__del:hover { color:rgba(255,90,90,.9); }

      /* ── temas anteriores ── */
      .foro-prev { padding:2px 24px 8px; }
      .foro-prev__h { font-family:'Space Mono',monospace; font-size:9px; letter-spacing:.2em; color:${HOLO_THEME.textDim}; margin-bottom:7px; }
      .foro-prev__list { display:flex; gap:8px; flex-wrap:wrap; }
      .foro-prev .chip { display:inline-flex; align-items:center; gap:6px; font-family:'Space Mono',monospace; font-size:10px; color:${HOLO_THEME.textDim}; border:1px solid ${HOLO_THEME.hairlineSoft}; border-radius:99px; padding:5px 6px 5px 12px; transition:color .14s, border-color .14s; max-width:280px; }
      .foro-prev .chip:hover { border-color:${HOLO_THEME.hairline}; }
      .foro-prev .chip.on { color:${HOLO_THEME.text}; border-color:${AC}; }
      .foro-prev .chip__t { cursor:pointer; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .foro-prev .chip:hover .chip__t { color:${HOLO_THEME.text}; }
      .foro-prev .chip__del { flex:none; background:none; border:0; padding:1px; cursor:pointer; color:rgba(242,240,248,.28); display:flex; transition:color .14s; }
      .foro-prev .chip__del:hover { color:rgba(255,90,90,.9); }

      /* ── comentarios (sin título) ── */
      .foro-cmts { flex:1; overflow-y:auto; padding:6px 22px 20px; }
      .foro-empty { text-align:center; color:${HOLO_THEME.textDim}; font-family:'Space Mono',monospace; font-size:12px; letter-spacing:.06em; padding:32px 0; }
      .fcm { display:flex; gap:11px; padding:13px 4px; border-bottom:1px solid ${HOLO_THEME.hairlineSoft}; animation:fadeIn .18s ease; }
      .fcm__av { width:32px; height:32px; border-radius:50%; flex-shrink:0; background:#1c1c24; background-size:100% 100%; background-position:center; border:1px solid ${HOLO_THEME.hairline}; display:flex; align-items:center; justify-content:center; font-size:9px; color:${HOLO_THEME.textDim}; }
      .fcm__bd { flex:1; min-width:0; }
      .fcm__hd { display:flex; gap:9px; align-items:baseline; }
      .fcm__u { font-size:12.5px; color:${HOLO_THEME.text}; font-weight:500; }
      .fcm__ti { font-family:'Space Mono',monospace; font-size:10px; color:${HOLO_THEME.textDim}; }
      .fcm__del { margin-left:auto; background:none; border:0; padding:2px; cursor:pointer; color:rgba(242,240,248,.25); display:flex; transition:color .14s; }
      .fcm__del:hover { color:rgba(255,90,90,.85); }
      .fcm__tx { font-size:13px; color:rgba(242,240,248,.74); line-height:1.65; margin-top:3px; white-space:pre-wrap; word-break:break-word; overflow-wrap:anywhere; }

      /* ── composer estilo "un hilo por pantalla" ── */
      .foro-c02 { position:absolute; inset:0; background:${HOLO_THEME.bg}; display:flex; flex-direction:column; justify-content:center; padding:0 clamp(24px,7vw,72px); opacity:0; pointer-events:none; transform:translateY(12px); transition:opacity .24s ease, transform .24s ease; z-index:5; }
      .foro-c02.open { opacity:1; pointer-events:auto; transform:none; }
      .foro-c02__ctx { font-family:'Space Mono',monospace; font-size:10px; letter-spacing:.14em; color:${HOLO_THEME.textDim}; }
      .foro-c02__ctx b { color:${AC}; font-weight:400; }
      .foro-c02__ta { width:100%; margin-top:14px; background:none; border:0; outline:0; resize:none; color:${HOLO_THEME.text}; font-family:'Inter',sans-serif; font-size:17px; line-height:1.6; min-height:130px; max-height:46vh; }
      .foro-c02__ta::placeholder { color:rgba(242,240,248,.3); }
      .foro-c02__row { display:flex; gap:10px; justify-content:flex-end; margin-top:16px; }
      .foro-c02__cancel { background:none; border:1px solid ${HOLO_THEME.hairline}; color:${HOLO_THEME.textDim}; font-family:'Space Mono',monospace; font-size:10px; letter-spacing:.14em; padding:10px 18px; border-radius:20px; cursor:pointer; transition:color .14s, border-color .14s; }
      .foro-c02__cancel:hover { color:${HOLO_THEME.text}; border-color:${HOLO_THEME.hairline}; }
      .foro-c02__send { background:${AC}; color:#0b0b0e; border:0; font-family:'Space Mono',monospace; font-weight:700; font-size:10px; letter-spacing:.16em; padding:11px 22px; border-radius:20px; cursor:pointer; transition:filter .15s; }
      .foro-c02__send:hover:not(:disabled) { filter:brightness(1.1); }
      .foro-c02__send:disabled { opacity:.4; cursor:not-allowed; }
      .foro-c02__hint { margin-top:12px; font-family:'Space Mono',monospace; font-size:9px; color:${HOLO_THEME.textDim}; letter-spacing:.1em; }

      /* ── form nuevo tema (admin) ── */
      .foro-newtema { margin:12px 20px; display:flex; gap:8px; }
      .foro-newtema input { flex:1; background:${HOLO_THEME.panel}; border:1px solid ${HOLO_THEME.hairline}; border-radius:10px; padding:10px 14px; color:${HOLO_THEME.text}; font-family:'Inter',sans-serif; font-size:14px; outline:0; }
      .foro-newtema input::placeholder { color:rgba(242,240,248,.3); }
      .foro-newtema input:focus { border-color:${AC}; }
      .foro-newtema button { background:${AC}; color:#0b0b0e; border:0; font-family:'Space Mono',monospace; font-weight:700; font-size:10px; letter-spacing:.14em; padding:0 18px; border-radius:10px; cursor:pointer; }
      .foro-newtema .ghost { background:none; border:1px solid ${HOLO_THEME.hairline}; color:${HOLO_THEME.textDim}; }
      .foro-admin { padding:10px 20px 0; }
      .foro-admin button { background:none; border:1px dashed ${HOLO_THEME.hairline}; color:${HOLO_THEME.textDim}; font-family:'Space Mono',monospace; font-size:10px; letter-spacing:.14em; padding:9px 16px; border-radius:10px; cursor:pointer; width:100%; transition:color .14s, border-color .14s; }
      .foro-admin button:hover { color:${HOLO_THEME.text}; border-color:${HOLO_THEME.hairline}; }

      .spinner { width:12px; height:12px; border:1px solid rgba(255,255,255,.15); border-top-color:rgba(255,255,255,.55); border-radius:50%; animation:spin .7s linear infinite; display:inline-block; }
    `;

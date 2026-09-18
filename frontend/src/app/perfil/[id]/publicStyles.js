// MÓDULO: app/perfil/[id]/publicStyles.js
// CSS de la página de perfil público (de otro usuario). Se inyecta con
// hooks/useInjectedStyles.js ("perfil-pub-styles", …) desde
// app/perfil/[id]/page.js. Es puro texto CSS, no tiene lógica. Es
// prácticamente idéntica a profileStyles.js (comparten `.sec-title`,
// fuentes, ruido de fondo) salvo el nombre de la clase wrapper
// (acá `.pub-wrap`) y que esta página no tiene el toast de "guardado".
import { FONT_IMPORT_MAIN, NOISE_TEXTURE, SCROLLBAR_THIN, KF } from "@/lib/theme";

export const publicStyles = `
      ${FONT_IMPORT_MAIN}
      ${KF.fadeIn}
      ${KF.blink}
      body { background:#000; color:#e8e4d9; font-family:'Inter',sans-serif; font-size:13px; overflow-x:hidden; }
      ${NOISE_TEXTURE}
      ${SCROLLBAR_THIN}
      .pub-wrap { padding:68px 28px 48px; max-width:960px; margin:0 auto; animation:fadeIn .5s ease; }
      .pub-grid { display:grid; grid-template-columns:210px 1fr 230px; }
      .sec-title { font-family:'Cinzel',serif; font-size:12px; letter-spacing:.18em; margin-bottom:12px; color:rgba(255,255,255,.7); }

      /* Íconos de redes al lado del nombre — solo formato PC (ver @media
         abajo). El div wrapper (antes el className iba directo en
         <SocialLinks>) es a propósito: SocialLinks.js trae su propio
         display:flex inline, que como estilo inline le gana a esta clase —
         sin el wrapper, display:none de acá abajo nunca se aplicaba. */
      .profile-social-icons { display:flex; }

      /* Fila avatar + (en celular) facultad/Instagram al lado. */
      .profile-avatar-row { display:flex; align-items:flex-start; gap:14px; }
      .profile-avatar-side { display:none; }

      /* ── Celular: mismo apilado que el perfil propio ── */
      @media (max-width:880px) {
        .pub-grid { grid-template-columns:1fr; }
      }
      @media (max-width:760px) {
        /* padding-top en 90px (no 60px): mismo motivo que .profile-wrap en
           profileStyles.js (perfil propio) — la navbar fija (58px) + el
           escudo de facultad que sobresale del avatar (-16.5px, ver
           AvatarMenu.js) dejaban el escudo recortado por la navbar con solo
           60px de aire. Este archivo se había quedado con el valor viejo
           (bug reportado 2026-09-17: perfil ajeno nunca recibió el mismo
           fix que el perfil propio ya tenía desde 2026-09-11). */
        .pub-wrap { padding:90px 16px 32px; }
        /* Mismo criterio que profileStyles.js (perfil propio): el header es
           flex con justify-content:space-between y, acá, un botón de largo
           variable al lado ("mandar solicitud de amistad" puede ser bastante
           más largo que "ACEPTAR") — sin wrap y sin poder achicar el nombre
           quedaba apretado/desbordado en celular (bug reportado 2026-09-17,
           el perfil propio nunca tuvo este problema porque ya achicaba el
           nombre y el bloque de la derecha es de ancho fijo). font-size con
           !important: el div del nombre trae style={{fontSize:30}} INLINE
           en page.js, y un inline le gana a cualquier clase sin !important
           sin importar el @media (mismo motivo que .profile-avatar-box). */
        .profile-header { gap:12px; flex-wrap:wrap; }
        .profile-name { font-size:24px !important; }
        .profile-social-icons { display:none; }
        /* Facultad e Instagram se mudan de la cabecera a al lado de la foto
           de perfil — pedido explícito de Erick (2026-09-11, con mockup). */
        .profile-header-facultad { display:none; }
        .profile-avatar-side { display:flex; flex-direction:column; align-items:flex-start; gap:10px; padding-top:8px; }
        /* Mismo agrandado que profileStyles.js: en celular la columna es de
           ancho completo, el avatar se ve chico al lado del resto si se
           queda en su tamaño de escritorio (165). !important porque
           AvatarMenu ya trae su propio width inline (prop size). */
        .profile-avatar-box { width:196px !important; }
      }
    `;

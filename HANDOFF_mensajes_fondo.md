---
name: handoff-mensajes-fondo-biblia
description: "Contexto/handoff para retomar el fondo \"estilo biblia\" del estado vacío de Mensajes (sesión reiniciada)"
metadata: 
  node_type: memory
  type: project
  originSessionId: b589faab-5937-4950-bd60-d77e93b52e2b
  modified: 2026-09-06T03:36:05.445Z
---

# HANDOFF — Fondo "estilo biblia" para Mensajes (chat)

Sesión anterior: https://claude.ai/code/session_01QRLnaDi1Hge93VFGxihbTw
Guardado el 2026-09-05 porque la sesión fallaba y se reinició la PC.
Rama git: `sandbox/pruebas` (main = `main`).

## Objetivo

En la página `/chat`, en el **estado vacío del panel derecho** (cuando no hay
ninguna conversación abierta), poner un fondo decorativo:

1. Una capa de **texto chiquito estilo biblia** (serif, justificado, muchas
   columnas, MUY pequeño, baja opacidad) que **llene todo el espacio libre**.
2. El **personaje recortado** (Kaneki, de `BG.jpg`) **encima**, centrado y
   **un poco a la derecha**, ocupando el alto disponible.
3. El buscador **"buscar personas"** por **delante de todo** (`position:relative`
   + `z-index` alto) para que el fondo **nunca** lo tape ni le compita.
   Pensar que después va a haber más gente / más UI ahí: lo pedido es
   ÚNICAMENTE el bg; el buscador manda.

Imagen de referencia: `C:\Users\neond\OneDrive\Desktop\BG.jpg`
(Tokyo Ghoul / Kaneki, 720x1280, escala de grises, viñeta oscura fuerte,
texto tipo periódico/biblia detrás del personaje).

## Lo que YA está hecho

- **Recorte del personaje**: hecho con OpenCV (`cv2` 5.0) GrabCut + limpieza
  (mayor componente conexo, relleno de huecos, morfología, feather del alpha,
  negros levantados a ~#11 y leve contraste para que la silueta lea sobre
  fondo oscuro).
  - Guardado en: `frontend/public/art/kaneki.png` (665x854, RGBA, ~450 KB).
  - Versión web optimizada (900px alto, 283 KB):
    `…/scratchpad/kaneki_web.png`
  - Base64 data-URI listo para artifact:
    `…/scratchpad/kaneki_b64.txt`
  - (scratchpad = `C:\Users\neond\AppData\Local\Temp\claude\C--Users-neond-OneDrive-Documentos-FACULK-PROJECT-FacuLeaks\b589faab-5937-4950-bd60-d77e93b52e2b\scratchpad`)
  - Si hay que rehacerlo: rect GrabCut `(35, 255, w-70, h-255)`, 10 iter.
- **Archivos revisados**:
  - `frontend/src/app/chat/page.js` — el estado vacío es el bloque
    `activeChat ? (...) : ( <div flex:1 ...> )` (aprox. líneas 306–337).
    Dentro hay `<div style={{ padding:"20px 24px", width:420 }}>` con el
    `input.buscar-input` y el dropdown `search.resultados`.
  - `frontend/src/app/chat/chatStyles.js` — CSS inyectado vía
    `useInjectedStyles("chat-styles", chatStyles)`. Tiene un comentario
    (líneas ~15–18) que dice que NO hay textura de fondo "a propósito"
    porque se iba a poner un video ASCII. **Esa decisión queda revertida**
    → actualizar ese comentario al implementar.
  - `frontend/src/lib/theme.js` — `HOLO_THEME`.

## Tokens / restricciones de diseño

- `HOLO_THEME`: bg `#0a0a0d`, panel `#111117`, text `#f2f0f8`,
  textDim `#8a87a0`, hairline `rgba(255,255,255,.12)`,
  hairlineSoft `rgba(255,255,255,.08)`, marker `#c0524a`, star `#ffd23d`.
- Fuentes de la app: **Cinzel** (display/títulos), **Inter** (cuerpo),
  **Space Mono** (labels/mono). Para el texto biblia proponer un serif de
  lectura (Georgia / Times / o una serif de Google Fonts).
- Texto biblia = **texto real**, en español, estilo Reina-Valera 1909
  (dominio público). Nada de lorem. Justificado, columnas, tamaño ~7–9px,
  color `rgba(255,255,255,.06–.09)` (marca de agua sobre oscuro).
- El personaje es casi negro → sobre fondo oscuro se ve como silueta con la
  cara como foco (buscado, igual que la referencia). Se le puede dar un
  `drop-shadow`/glow muy suave y un `mask-image` que lo funda por abajo.

## DÓNDE NOS QUEDAMOS (próximo paso)

El usuario pidió: **crear varias OPCIONES (mockups) del fondo "gran sección
de la biblia" con las herramientas de diseño, ANTES de aplicarlo al código.**

→ Siguiente acción: construir **un Artifact HTML** con 3–5 variantes del
tratamiento, mostrando cada una en un panel con la proporción del área real
(panel derecho del chat, ~16:10, fondo oscuro), con el recorte de Kaneki
encima (usar el base64 de `kaneki_b64.txt` una sola vez como
`--k: url(...)` y reutilizar) y un buscador simulado arriba a la izquierda
por delante (para demostrar el z-index).

Ideas de variantes:
- A: columnas serif justificadas, texto tenue, a sangre (página de biblia clásica).
- B: página impresa: encabezado de capítulo en Cinzel, números de versículo
  en superíndice, capitular (drop cap), 2 columnas.
- C: densa y diminuta, con leve tinte sepia/papel y viñeta.
- D: `mask-image` radial: el texto brilla más en los bordes y se apaga
  detrás del personaje.
- E: "red-letter": algunas frases en rojo apagado (`#c0524a`, el `marker`).

Skills ya cargadas en la sesión anterior: `artifact-design`, `frontend-design`.

Después de que el usuario elija, recién ahí portar el CSS elegido a
`chatStyles.js` (+ clases nuevas tipo `.empty-bg`, `.bible-layer`,
`.empty-portrait`) y tocar el JSX del estado vacío en `page.js`
(subir `z-index` del buscador, agregar las capas de fondo detrás).

## Prompt para retomar (pegar en la sesión nueva)

> Retomamos el fondo "estilo biblia" del estado vacío de Mensajes (`/chat`).
> Ya está el recorte del personaje en `frontend/public/art/kaneki.png` y el
> base64 en el scratchpad (`kaneki_b64.txt`). El contexto completo está en
> `memory/handoff-mensajes-fondo-biblia.md`. Seguí desde "DÓNDE NOS
> QUEDAMOS": armá el Artifact con 3–5 variantes del fondo (texto real
> Reina-Valera, columnas justificadas, Kaneki centrado-derecha encima,
> buscador por delante con z-index), para que elija antes de tocar el código.

## Nota: cambios git sin commitear (previos, NO son de esto)

`frontend/src/components/PostCard.js`, `components/feed/PostCard.js`,
`components/feed/PostComments.js`, `hooks/useFeedPosts.js`,
`hooks/usePostComments.js` — venían modificados de antes en `sandbox/pruebas`.

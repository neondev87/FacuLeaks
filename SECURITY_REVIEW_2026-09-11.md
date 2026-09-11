# Revisión de seguridad — 2026-09-11

Escaneo completo del backend (auth, chat, posts, foro, perfil, amigos, spotify, uploads) y
del frontend (rutas de NextAuth, middleware, componentes). `npm audit` en ambos paquetes:
0 vulnerabilidades de dependencias.

## Arreglado hoy (commiteado)

1. **CRÍTICO — Path traversal / escritura y borrado de archivo arbitrario**
   (`backend/src/modules/perfil/perfil.routes.js`)
   El multer de `/api/perfil/avatar` y `/api/perfil/fotos` armaba el nombre del archivo
   temporal con `file.originalname` (controlado 100% por el cliente, viene del header
   `Content-Disposition` del multipart). multer arma la ruta final con
   `path.join(destino, filename)` **sin validar el resultado** — un `originalname` con
   `../../../` escapaba de `uploads/tmp` y permitía escribir en cualquier ruta alcanzable
   por el proceso de Node (`.env`, código fuente, etc.), y si el "magic bytes" check
   fallaba después, el código **borraba** ese mismo archivo arbitrario
   (`fs.unlinkSync(tmpPath)`). Cualquier usuario logueado podía explotarlo.
   Fix: nombre generado con `crypto.randomBytes`, igual que en el resto de los módulos de
   upload — nunca más se usa `file.originalname` para el nombre en disco.

2. **ALTO — Control de acceso roto (IDOR) + fuga de privacidad en tiempo real**
   (`backend/src/modules/posts/posts.controller.js`)
   Los posts con privacidad `AMIGOS` o `SOLO_YO` solo se filtraban en los feeds
   (`WHERE privacidad = ...`). Los endpoints que operan por `:id` — reaccionar
   (`POST /:id/react`), comentar (`POST /:id/comments`) y listar comentarios
   (`GET /:id/comments`) — no repetían ese chequeo: cualquier usuario logueado podía
   reaccionar/comentar/leer comentarios de un post privado ajeno con solo adivinar el id
   (autoincremental, no es un UUID). Peor: `req.io.emit('post:react', ...)` y
   `req.io.emit('post:comment', ...)` son **broadcast a TODOS los sockets conectados**,
   sin filtrar privacidad — el contenido real del comentario (texto + autor) de un post
   `SOLO_YO` se difundía en vivo a cualquiera con la app abierta, no solo al que comentó.
   Fix: nueva `puedeVerPost(userId, post)` (público, autor, o amigo aceptado si es
   `AMIGOS`) gatea los tres endpoints con 404 (no 403, para no confirmar que el post
   existe); los broadcasts de socket de reacción/comentario ahora solo se emiten si
   `privacidad === 'PUBLICA'`, igual que ya hacía `post:new`.

3. **MEDIO — SSRF por DNS rebinding** (`backend/src/modules/upload/upload.security.js`,
   `upload.controller.js`)
   `sanitizarUrl()` solo miraba el **hostname como texto** (bloquea `localhost`,
   `127.0.0.1`, rangos privados escritos literalmente). Un atacante puede registrar un
   dominio público cuyo DNS resuelva a una IP interna (`127.0.0.1`, `169.254.169.254`,
   etc.) — el hostname pasa el filtro, pero cuando el servidor hace el `fetch()` real
   (import de URL para el preview del muro) termina pegándole a la red interna igual.
   Fix: nueva `esUrlSeguraParaFetch()` resuelve el hostname con `dns.lookup` y valida
   **cada IP resuelta** antes de dejar avanzar el fetch inicial y cada salto de
   redirección en `fetchSeguro()`. (La URL de `og:image`, que solo se devuelve para que
   el *navegador* la cargue, se deja con el chequeo sync — ahí no hay fetch del servidor.)
   Nota: queda un margen TOCTOU teórico (el DNS podría cambiar entre el `lookup` y el
   `fetch`) — mitigación completa requeriría pinnear la IP resuelta en la conexión real
   (agente HTTP custom); ver "Para después".

4. **MEDIO — Open redirect** (`frontend/src/app/api/auth/sync-backend/route.js`)
   El endpoint es público (lo puede pegar cualquiera en un link, no solo `proxy.js`) y
   armaba `new URL(callbackUrl, SITE_URL)` sin validar: si `callbackUrl` era una URL
   absoluta (`?callbackUrl=https://evil.com`), `new URL()` la toma tal cual e ignora la
   base — terminaba redirigiendo (justo después de sincronizar la cookie de sesión) al
   sitio del atacante. Explotable mandándole ese link a un usuario ya logueado (phishing).
   Fix: solo se acepta `callbackUrl` si es una ruta relativa propia (`/algo`), rechazando
   además el bypass con backslash (`/\evil.com`, que el parser de URL trata como `//`).

## Para después (no crítico, no se tocó hoy)

- **Imágenes de posts privados servidas como estáticas públicas.**
  `/uploads/imagenes/*` no está gateado (a diferencia de `/uploads/audios/*`, que sí
  chequea que el pedido sea el emisor/receptor del mensaje) — cualquiera con la URL
  exacta puede ver la imagen de un post `SOLO_YO`, aunque el nombre sea un hash random
  de 128 bits (no adivinable por fuerza bruta). Es "seguridad por oscuridad" a propósito,
  pero si en algún momento se comparte una URL de imagen fuera de la app, queda expuesta
  para siempre aunque se borre el post o se cambie la privacidad. Si esto importa,
  requiere el mismo patrón de `serveAudio()` (ruta gateada + `authMiddleware`), pero es
  un cambio de mayor alcance porque esa misma carpeta también sirve avatares, fotos de
  galería e imágenes de chat (esas sí deberían seguir públicas/gateadas distinto).
- **Nombre de archivo de audio de chat predecible.** `chat.routes.js` nombra el audio
  `audio_<userId>_<timestamp>.webm` en vez de un hash random. Hoy no es explotable
  porque `serveAudio()` igual exige ser emisor/receptor del mensaje, pero rompe el
  patrón "nombre random" que se usa en el resto de los módulos — alinearlo es barato.
- **Sin headers de seguridad** (CSP, `X-Frame-Options`, `X-Content-Type-Options`, HSTS)
  en ninguna de las dos apps. No es una vulnerabilidad puntual, es hardening general.
- **TOCTOU residual en el anti-SSRF** (ver punto 3) — pinnear la IP resuelta en la
  conexión real en vez de solo pre-validar el hostname.

## Lo que YA estaba bien (verificado, no se tocó)

Auth (`middleware/auth.js`, `auth.controller.js`, `auth.service.js`): JWT con algoritmo
fijo (`HS256`, sin confusión de algoritmo), cookie `httpOnly`/`sameSite`, comparación en
tiempo constante del secreto interno, password con bcrypt (aunque el login real es por
Google). Socket del chat (`chat.socket.js`): identidad siempre sale del JWT verificado,
nunca del payload del cliente — cerraba el bug viejo de DMs cruzados. Magic bytes reales
(no solo extensión/mimetype) en todos los uploads de imagen/documento. Sin SQL crudo en
ningún módulo (Prisma parametriza todo). Sin `dangerouslySetInnerHTML`/`eval`/`innerHTML`
en el frontend. `amigos.controller.js`, `foro.controller.js`, `spotify.controller.js`
(state HMAC-firmado contra CSRF de OAuth) y `perfil.controller.js` con los chequeos de
ownership/privacidad correctos donde correspondía.

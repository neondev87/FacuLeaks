// ════════════════════════════════════════════════════════════════════════
// MÓDULO: lib/api.js — la única fuente de la URL del backend
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: exporta dos constantes con la URL del backend Express (puerto
// 4000):
//   - API          → para llamadas desde el NAVEGADOR (hooks, componentes).
//                    Configurable con NEXT_PUBLIC_API_URL.
//   - API_INTERNAL → para llamadas SERVIDOR-A-SERVIDOR (route handlers de
//                    Next, callbacks de NextAuth). Permite apuntar a una URL
//                    interna distinta; si no se configura, usa la misma
//                    que API.
// Si ninguna variable de entorno está seteada, las dos caen a
// "http://localhost:4000" — así funciona en desarrollo sin configurar nada.
//
// PARA QUÉ SIRVE: antes había un `const API = "http://localhost:4000"`
// copiado y pegado en 15 archivos distintos — cambiar de entorno (por
// ejemplo, subir a producción) significaba editar 15 lugares. Ahora es uno
// solo: TODO archivo que necesite hablarle al backend importa de acá.
//
// CON QUÉ SE CONECTA: literalmente todos los hooks y componentes del
// frontend que hacen fetch() al backend, más next.config.js (los rewrites
// usan la misma variable de entorno).
// ════════════════════════════════════════════════════════════════════════
export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
export const API_INTERNAL = process.env.API_INTERNAL_URL || API;

// A dónde conecta el cliente de Socket.io. Normalmente es lo mismo que API
// (browser habla directo con el backend), PERO cuando el REST pasa por los
// rewrites de next.config.js (API apunta al propio frontend, para que las
// cookies de sesión sean same-site — ver next.config.js), el socket sigue
// necesitando ir DIRECTO al backend, así que se puede separar con
// NEXT_PUBLIC_SOCKET_URL.
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || API;

// URL pública del frontend, para construir redirects absolutos en código de
// servidor (proxy.js, route handlers) SIN confiar en el header Host de la
// petición — Next 16.3 endurece cómo resuelve ese header detrás de un proxy
// (túnel, balanceador, etc.) y `new URL(path, req.url)` puede terminar
// devolviendo "localhost:PORT" en vez del dominio real. Usar esta constante
// como base evita ese problema.
export const SITE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

// URL completa de una imagen (avatar, foto de post, etc.) guardada como
// ruta relativa (`/uploads/...`) o ya absoluta (viene de una URL externa).
export const avatarSrc = (imagen) =>
  !imagen ? null : imagen.startsWith("http") ? imagen : `${API}${imagen}`;

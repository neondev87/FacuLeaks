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

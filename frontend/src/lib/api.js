// URL base del backend Express. Única fuente de verdad para TODO el frontend.
// Antes esto estaba hardcodeado como `const API = "http://localhost:4000"` en 15
// archivos — ya no: todos importan de acá.
//
// - API           → llamadas desde el browser. Configurable con NEXT_PUBLIC_API_URL.
// - API_INTERNAL  → llamadas server-to-server (route handlers, callbacks NextAuth).
//                   Permite una URL interna distinta; si no, usa la misma que API.
export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
export const API_INTERNAL = process.env.API_INTERNAL_URL || API;

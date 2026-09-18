/** @type {import('next').NextConfig} */

// Misma fuente que src/lib/api.js pero para el server de Next (rewrites),
// que corren DENTRO del servidor de Next — por eso preferimos
// API_INTERNAL_URL (server-to-server, típicamente localhost) por sobre
// NEXT_PUBLIC_API_URL (pensada para el navegador, puede ser un dominio
// público distinto — ver la nota grande de SITE_URL/API en lib/api.js).
// Ojo: NO reescribir /api/auth/* en general — eso lo maneja NextAuth en el
// propio frontend. EXCEPCIÓN: /api/auth/check/:googleId es un endpoint
// propio del backend (useRegister.js lo llama desde el navegador con
// NEXT_PUBLIC_API_URL) que por nombrado comparte el prefijo /api/auth —
// localmente no colisiona porque NEXT_PUBLIC_API_URL apunta directo al
// backend (puerto 4000), pero cuando apunta al propio dominio del frontend
// (túnel/demo, cookie same-site) el catch-all [...nextauth] lo intercepta y
// devuelve 400 ("action not supported") en vez de JSON del backend.
// /api/auth/register YA NO se reescribe acá a propósito (pentest
// 2026-09-17): antes esto lo mandaba directo y sin sesión al backend, que
// confiaba ciegamente en el googleId del body — el endpoint propio de Next
// en app/api/auth/register/route.js es el único que puede llamarlo ahora
// (valida la sesión de NextAuth server-side primero). Mismo criterio que
// /api/auth/login, que tampoco se reescribe.
const API = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Cuando el sitio se sirve por un dominio público (túnel/demo) en vez de
// localhost, `next dev` bloquea por defecto los recursos de HMR pedidos
// desde ese origen ("Blocked cross-origin request"). Se deriva de
// NEXTAUTH_URL (la misma fuente que SITE_URL en lib/api.js) para no
// hardcodear el dominio del túnel, que cambia cada vez que se reinicia.
const siteHost = (() => {
  try { return new URL(process.env.NEXTAUTH_URL || '').hostname; } catch { return null; }
})();

const nextConfig = {
  // Oculta el indicador de desarrollo de Next (el círculo con la "N").
  // Antes estaba en next.config.mjs, que Next ignora porque gana el .js.
  devIndicators: false,
  ...(siteHost && siteHost !== 'localhost' ? { allowedDevOrigins: [siteHost] } : {}),
  async rewrites() {
    return [
      { source: '/api/auth/check/:path*',    destination: `${API}/api/auth/check/:path*` },
      { source: '/api/perfil/:path*',  destination: `${API}/api/perfil/:path*` },
      { source: '/api/posts/:path*',   destination: `${API}/api/posts/:path*` },
      { source: '/api/chat/:path*',    destination: `${API}/api/chat/:path*` },
      { source: '/api/amigos/:path*',  destination: `${API}/api/amigos/:path*` },
      { source: '/api/foro/:path*',    destination: `${API}/api/foro/:path*` },
      { source: '/api/spotify/:path*', destination: `${API}/api/spotify/:path*` },
      { source: '/api/upload/:path*',  destination: `${API}/api/upload/:path*` },
      // Archivos subidos (avatares, fotos, imágenes de posts/chat) — el
      // backend los sirve como estáticos bajo /uploads.
      { source: '/uploads/:path*',     destination: `${API}/uploads/:path*` },
    ];
  },
};

export default nextConfig;

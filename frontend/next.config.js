/** @type {import('next').NextConfig} */

// Misma fuente que src/lib/api.js pero para el server de Next (rewrites),
// que corren DENTRO del servidor de Next — por eso preferimos
// API_INTERNAL_URL (server-to-server, típicamente localhost) por sobre
// NEXT_PUBLIC_API_URL (pensada para el navegador, puede ser un dominio
// público distinto — ver la nota grande de SITE_URL/API en lib/api.js).
// Ojo: NO reescribir /api/auth/* — eso lo maneja NextAuth en el propio frontend.
const API = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const nextConfig = {
  // Oculta el indicador de desarrollo de Next (el círculo con la "N").
  // Antes estaba en next.config.mjs, que Next ignora porque gana el .js.
  devIndicators: false,
  // Preview temporal por túnel (cloudflared): sin esto, Next dev rechaza el
  // WebSocket de HMR viniendo de un origen que no sea localhost (hardening
  // agregado en 16.3.x) — se reconecta en loop y la página nunca termina de
  // montar. Borrar esta línea cuando termine la demo.
  allowedDevOrigins: ['throwing-sullivan-expansion-comparative.trycloudflare.com'],
  async rewrites() {
    return [
      { source: '/api/perfil/:path*',  destination: `${API}/api/perfil/:path*` },
      { source: '/api/posts/:path*',   destination: `${API}/api/posts/:path*` },
      { source: '/api/chat/:path*',    destination: `${API}/api/chat/:path*` },
      { source: '/api/amigos/:path*',  destination: `${API}/api/amigos/:path*` },
      { source: '/api/spotify/:path*', destination: `${API}/api/spotify/:path*` },
      { source: '/api/upload/:path*',  destination: `${API}/api/upload/:path*` },
      // Archivos subidos (avatares, fotos, imágenes de posts/chat) — el
      // backend los sirve como estáticos bajo /uploads.
      { source: '/uploads/:path*',     destination: `${API}/uploads/:path*` },
    ];
  },
};

export default nextConfig;

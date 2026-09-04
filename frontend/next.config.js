/** @type {import('next').NextConfig} */

// Misma fuente que src/lib/api.js pero para el server de Next (rewrites).
// Ojo: NO reescribir /api/auth/* — eso lo maneja NextAuth en el propio frontend.
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const nextConfig = {
  // Oculta el indicador de desarrollo de Next (el círculo con la "N").
  // Antes estaba en next.config.mjs, que Next ignora porque gana el .js.
  devIndicators: false,
  async rewrites() {
    return [
      { source: '/api/perfil/:path*',  destination: `${API}/api/perfil/:path*` },
      { source: '/api/posts/:path*',   destination: `${API}/api/posts/:path*` },
      { source: '/api/chat/:path*',    destination: `${API}/api/chat/:path*` },
      { source: '/api/amigos/:path*',  destination: `${API}/api/amigos/:path*` },
      { source: '/api/spotify/:path*', destination: `${API}/api/spotify/:path*` },
      { source: '/api/upload/:path*',  destination: `${API}/api/upload/:path*` },
    ];
  },
};

export default nextConfig;

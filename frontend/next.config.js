/** @type {import('next').NextConfig} */
const nextConfig = {
  // Oculta el indicador de desarrollo de Next (el círculo con la "N").
  // Antes estaba en next.config.mjs, que Next ignora porque gana el .js.
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: '/api/perfil/:path*',
        destination: 'http://localhost:4000/api/perfil/:path*',
      },
      {
        source: '/api/posts/:path*',
        destination: 'http://localhost:4000/api/posts/:path*',
      },
      {
        source: '/api/chat/:path*',
        destination: 'http://localhost:4000/api/chat/:path*',
      },
      {
        source: '/api/amigos/:path*',
        destination: 'http://localhost:4000/api/amigos/:path*',
      },
      {
        source: '/api/spotify/:path*',
        destination: 'http://localhost:4000/api/spotify/:path*',
      },
      {
        source: '/api/upload/:path*',
        destination: 'http://localhost:4000/api/upload/:path*',
      },
    ];
  },
};

export default nextConfig;
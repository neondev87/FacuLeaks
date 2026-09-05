// ════════════════════════════════════════════════════════════════════════
// MÓDULO: proxy.js — el middleware de Next.js (se ejecuta ANTES de cada página)
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: revisa, antes de que cargue una página protegida (/feed,
// /perfil, /chat), si el usuario tiene sesión válida:
//   1. Sin sesión de Google → redirige a /auth.
//   2. Con sesión de Google pero sin cuenta en la BD → redirige a /register.
//   3. Con cuenta pero sin la cookie del BACKEND (puede pasar si el backend
//      se reinició, o es la primera vez en esta sesión) → redirige a
//      /api/auth/sync-backend para conseguirla, y de ahí vuelve a la página
//      original (con un flag `_sync_done` para no entrar en loop).
//   4. Todo bien → deja pasar.
//
// PARA QUÉ SIRVE: es la primera línea de defensa del lado del frontend —
// evita que se vea aunque sea un parpadeo de una página protegida sin
// sesión. OJO: esto es solo UX, la seguridad real está en el backend
// (authMiddleware en cada endpoint) — este archivo NO reemplaza eso.
//
// CON QUÉ SE CONECTA:
//   - next-auth/jwt (getToken) → lee la cookie de sesión de NextAuth.
//   - app/api/auth/sync-backend/route.js → a donde redirige en el caso 3.
//   - Nombre especial: en Next 16 el middleware se llama `proxy.js` y
//     exporta una función `proxy` (antes era `middleware.js`/`middleware`)
//     — NO es un archivo muerto aunque el nombre no sea obvio.
// ════════════════════════════════════════════════════════════════════════
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/api";

const PROTECTED = ["/feed", "/perfil", "/post", "/chat"];

export async function proxy(req) {
  const { pathname, searchParams } = req.nextUrl;

  if (!PROTECTED.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Nunca interceptar rutas internas de Next.js ni APIs
  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // googleId puede estar en token.googleId (login reciente) o token.sub (sesión previa)
  const googleId = token?.googleId || token?.sub;

  if (!googleId) {
    return NextResponse.redirect(new URL("/auth", SITE_URL));
  }

  // Usuario autenticado con Google pero sin cuenta en BD → registro
  if (token?.needsRegister) {
    return NextResponse.redirect(new URL("/register", SITE_URL));
  }

  // Anti-loop: si ya pasamos por sync en esta navegación, dejar pasar
  if (searchParams.get("_sync_done")) {
    return NextResponse.next();
  }

  // Cookie del backend ausente → sincronizar primero
  const backendCookie = req.cookies.get("token");

  if (!backendCookie) {
    const syncUrl = new URL("/api/auth/sync-backend", SITE_URL);
    syncUrl.searchParams.set("callbackUrl", pathname + (req.nextUrl.search || ""));
    return NextResponse.redirect(syncUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/feed/:path*", "/perfil/:path*", "/post/:path*", "/chat/:path*"],
};

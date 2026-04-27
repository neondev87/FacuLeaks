import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

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
    return NextResponse.redirect(new URL("/auth", req.url));
  }

  // Usuario autenticado con Google pero sin cuenta en BD → registro
  if (token?.needsRegister) {
    return NextResponse.redirect(new URL("/register", req.url));
  }

  // Anti-loop: si ya pasamos por sync en esta navegación, dejar pasar
  if (searchParams.get("_sync_done")) {
    return NextResponse.next();
  }

  // Cookie del backend ausente → sincronizar primero
  const backendCookie = req.cookies.get("token");

  if (!backendCookie) {
    const syncUrl = new URL("/api/auth/sync-backend", req.url);
    syncUrl.searchParams.set("callbackUrl", pathname + (req.nextUrl.search || ""));
    return NextResponse.redirect(syncUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/feed/:path*", "/perfil/:path*", "/post/:path*", "/chat/:path*"],
};

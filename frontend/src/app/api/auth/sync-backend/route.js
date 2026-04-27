import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

// GET /api/auth/sync-backend?callbackUrl=/perfil
// Llama al backend server-to-server (sin CORS), obtiene la cookie JWT
// y la reenvía al browser antes de redirigir a callbackUrl.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const callbackUrl = searchParams.get("callbackUrl") || "/feed";

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Mismo fallback que en middleware: googleId puede estar en .googleId o .sub
  const googleId = token?.googleId || token?.sub;

  if (!googleId) {
    return NextResponse.redirect(new URL("/auth", req.url));
  }

  // Construir la URL de destino con el flag anti-loop
  const destination = new URL(callbackUrl, req.url);
  destination.searchParams.set("_sync_done", "1");

  const response = NextResponse.redirect(destination);

  try {
    const backendRes = await fetch("http://localhost:4000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ googleId }),
    });

    if (backendRes.ok) {
      // Reenviar la Set-Cookie del backend al browser
      const setCookie = backendRes.headers.get("set-cookie");
      if (setCookie) {
        response.headers.set("set-cookie", setCookie);
      }
    }
  } catch (err) {
    // Backend caído — redirigimos igual; las páginas tienen fallback de 401
    console.error("[sync-backend] Error llamando al backend:", err.message);
  }

  return response;
}

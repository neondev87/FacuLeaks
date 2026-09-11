// ════════════════════════════════════════════════════════════════════════
// MÓDULO: api/auth/sync-backend/route.js — puente entre la sesión de
// NextAuth y la cookie del backend
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: este proyecto tiene DOS sistemas de sesión que conviven:
//   1. La sesión de NextAuth (sabe que iniciaste con Google).
//   2. La cookie JWT del backend Express (la que valida authMiddleware en
//      CADA endpoint de la API).
// Este archivo es el puente: agarra el googleId de la sesión de NextAuth,
// le pide al backend "dame la cookie de este usuario" (POST /api/auth/login,
// protegido con un secreto interno para que solo el propio servidor de Next
// pueda pedirlo) y reenvía esa cookie al navegador antes de redirigir a
// donde el usuario iba.
//
// PARA QUÉ SIRVE: sin esto, tener sesión de Google no alcanza — las
// llamadas a la API del backend (feed, chat, perfil, todo) fallarían con
// 401 porque nunca tendrían la cookie que el backend entiende.
//
// CON QUÉ SE CONECTA:
//   - lib/api.js (API_INTERNAL) → la URL del backend para esta llamada
//     servidor-a-servidor.
//   - backend: POST /api/auth/login (auth.controller.js) → quien realmente
//     valida el secreto interno y devuelve la cookie.
//   - Lo llaman proxy.js (cuando detecta que falta la cookie del backend) y
//     hooks/useOwnProfile.js (como recuperación si el backend responde 401).
// ════════════════════════════════════════════════════════════════════════
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { API_INTERNAL, SITE_URL } from "@/lib/api";

// GET /api/auth/sync-backend?callbackUrl=/perfil
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const rawCallbackUrl = searchParams.get("callbackUrl") || "/feed";
  // Open redirect: esta ruta es pública (cualquiera puede pegar el link, no
  // solo proxy.js) y antes armaba `new URL(callbackUrl, SITE_URL)` sin
  // chequear el resultado — si callbackUrl era una URL absoluta
  // ("https://evil.com"), new URL() la toma tal cual e IGNORA el base, así
  // que terminaba redirigiendo (con la sesión recién sincronizada) al sitio
  // del atacante. Solo se acepta una ruta relativa propia ("/algo").
  // Normaliza backslashes primero: el parser de URL (WHATWG) trata "\" igual
  // que "/" en esquemas http(s) — "/\evil.com" sin esto se cuela como si
  // empezara con "/" pero se resuelve como "//evil.com" (protocol-relative).
  const normalizado = rawCallbackUrl.replace(/\\/g, "/");
  const callbackUrl = normalizado.startsWith("/") && !normalizado.startsWith("//")
    ? rawCallbackUrl
    : "/feed";

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Mismo fallback que en middleware: googleId puede estar en .googleId o .sub
  const googleId = token?.googleId || token?.sub;

  if (!googleId) {
    return NextResponse.redirect(new URL("/auth", SITE_URL));
  }

  // Construir la URL de destino con el flag anti-loop. Base = SITE_URL, NO
  // req.url — detrás de un proxy/túnel, Next 16.3 puede resolver req.url al
  // host/puerto interno (localhost:3000) en vez del dominio público real.
  const destination = new URL(callbackUrl, SITE_URL);
  destination.searchParams.set("_sync_done", "1");

  const response = NextResponse.redirect(destination);

  try {
    const backendRes = await fetch(`${API_INTERNAL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Secreto interno server-to-server: el browser nunca lo ve, así que
        // no puede forjar un login para un googleId ajeno.
        "x-internal-secret": process.env.INTERNAL_API_SECRET || "",
      },
      body: JSON.stringify({ googleId }),
    });

    if (!backendRes.ok) {
      console.error("[sync-backend] backend respondió", backendRes.status);
    }

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

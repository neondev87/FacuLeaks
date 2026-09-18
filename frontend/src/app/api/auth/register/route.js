// ════════════════════════════════════════════════════════════════════════
// MÓDULO: api/auth/register/route.js — puente server-to-server para el registro
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: hooks/useRegister.js llamaba antes DIRECTO al backend
// (POST ${API}/api/auth/register) mandando googleId/email/nombre en el
// body — un atacante podía pegarle a ese endpoint con curl usando CUALQUIER
// googleId/email inventado y sacarse una cookie de sesión válida sin pasar
// nunca por Google (bypass total de autenticación, pentest 2026-09-17).
//
// Este route handler es el arreglo: corre en el SERVIDOR de Next, así que
// puede leer la sesión de NextAuth ya verificada (getToken, firmada con
// NEXTAUTH_SECRET) y sacar googleId/email/nombre DE AHÍ — no del body que
// mande el cliente. Solo username/password/facultad (elección real del
// usuario, no identidad) vienen del body. Reenvía todo al backend con el
// mismo secreto interno que ya usa sync-backend/route.js para /login.
//
// CON QUÉ SE CONECTA:
//   - lib/authOptions.js (NEXTAUTH_SECRET) → para decodificar el token.
//   - backend: POST /api/auth/register (auth.controller.js), ahora también
//     gateado por x-internal-secret, igual que /login.
//   - Lo llama hooks/useRegister.js (same-origin, en vez de pegarle al
//     backend directo).
// ════════════════════════════════════════════════════════════════════════
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { API_INTERNAL } from "@/lib/api";

export async function POST(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const googleId = token?.googleId || token?.sub;

  if (!googleId || !token?.email || !token?.name) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body = {};
  try { body = await req.json(); } catch {}
  const { username, password, facultad } = body || {};

  try {
    const backendRes = await fetch(`${API_INTERNAL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": process.env.INTERNAL_API_SECRET || "",
      },
      body: JSON.stringify({
        googleId,
        email:  token.email,
        nombre: token.name,
        username, password, facultad,
      }),
    });

    const data = await backendRes.json().catch(() => ({}));
    const response = NextResponse.json(data, { status: backendRes.status });

    const setCookie = backendRes.headers.get("set-cookie");
    if (setCookie) response.headers.set("set-cookie", setCookie);

    return response;
  } catch (err) {
    console.error("[register] Error llamando al backend:", err.message);
    return NextResponse.json({ error: "No se pudo conectar con el servidor" }, { status: 502 });
  }
}

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: api/auth/[...nextauth]/route.js — arranca NextAuth
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: es el archivo "oficial" que espera NextAuth para instalarse —
// atiende TODAS las rutas bajo /api/auth/* que la propia librería necesita
// (/api/auth/signin, /api/auth/callback/google, /api/auth/session, etc.),
// usando la configuración de lib/authOptions.js. No hay lógica propia acá,
// es prácticamente el ejemplo de la documentación de NextAuth v4.
//
// CON QUÉ SE CONECTA: lib/authOptions.js (toda la configuración real vive
// ahí). Por convención del proyecto, next.config.js NO reescribe estas
// rutas hacia el backend — quedan siempre atendidas acá, por Next.
// ════════════════════════════════════════════════════════════════════════
import NextAuth from "next-auth";
import { authOptions } from "@/lib/authOptions";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

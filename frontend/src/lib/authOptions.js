// ════════════════════════════════════════════════════════════════════════
// MÓDULO: lib/authOptions.js — configuración de NextAuth (login con Google)
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: le dice a NextAuth (la librería de autenticación) CÓMO manejar
// el login de Google en esta app. Tres momentos clave:
//   - jwt(): se ejecuta cada vez que hay un token — al loguearse por primera
//     vez, le pregunta al backend "¿este googleId ya tiene cuenta acá?"
//     (GET /api/auth/check/:googleId) y guarda el resultado (dbId, imagen,
//     si necesita registrarse) DENTRO del propio token JWT de NextAuth.
//   - session(): arma el objeto `session.user` que se usa en TODA la app —
//     acá es donde se define `session.user.dbId` (el id de MySQL — la
//     convención del proyecto es usar SIEMPRE este campo, nunca
//     `session.user.id`, que es el id de Google, no el de la base de datos).
//
// PARA QUÉ SIRVE: es el pegamento entre "Google dice que sos vos" y "el
// backend tiene una fila tuya en MySQL". Sin esto, tener sesión de Google
// no alcanza para usar la app.
//
// CON QUÉ SE CONECTA:
//   - Google OAuth (GOOGLE_CLIENT_ID/SECRET en frontend/.env).
//   - backend: GET /api/auth/check/:googleId (vía API_INTERNAL, servidor a
//     servidor — no pasa por el navegador).
//   - Lo usa app/api/auth/[...nextauth]/route.js (arranca NextAuth con esta
//     config) y proxy.js / cualquier página con useSession() (lee lo que
//     esto arma).
// ════════════════════════════════════════════════════════════════════════
import GoogleProvider from "next-auth/providers/google";
import { API_INTERNAL } from "@/lib/api";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn() {
      return true;
    },
    async redirect({ url, baseUrl }) {
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        // Primer login con Google — guardar googleId y verificar BD
        const googleId = profile.sub;
        token.googleId = googleId;
        try {
          const res  = await fetch(`${API_INTERNAL}/api/auth/check/${googleId}`);
          const data = await res.json();
          token.dbId          = data.exists ? data.user.id    : null;
          token.imagen        = data.exists ? data.user.imagen : null;
          token.needsRegister = !data.exists;
        } catch {
          token.dbId          = null;
          token.needsRegister = true;
        }
      } else if (!token.dbId && (token.googleId || token.sub)) {
        // Token existente sin dbId: sesión previa, token viejo, o registro recién completado
        const resolvedId = token.googleId || token.sub;
        if (!token.googleId) token.googleId = resolvedId;
        try {
          const res  = await fetch(`${API_INTERNAL}/api/auth/check/${resolvedId}`);
          const data = await res.json();
          token.dbId          = data.exists ? data.user.id    : null;
          token.imagen        = data.exists ? data.user.imagen : null;
          token.needsRegister = !data.exists;
        } catch {}
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id            = token.sub;
      session.user.dbId          = token.dbId          || null;
      session.user.imagen        = token.imagen        || null;
      session.user.needsRegister = token.needsRegister || false;
      session.user.googleId      = token.googleId      || token.sub;
      return session;
    },
  },
  pages: {
    signIn: "/auth",
  },
};

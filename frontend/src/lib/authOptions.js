import GoogleProvider from "next-auth/providers/google";

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
          const res  = await fetch(`http://localhost:4000/api/auth/check/${googleId}`);
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
          const res  = await fetch(`http://localhost:4000/api/auth/check/${resolvedId}`);
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

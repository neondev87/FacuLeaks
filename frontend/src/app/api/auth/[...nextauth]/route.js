import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      return true;
    },
    async redirect({ url, baseUrl }) {
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        // Primer login — guardar googleId y verificar BD
        const googleId = profile.sub;
        token.googleId = googleId;
        try {
          const checkRes  = await fetch(`http://localhost:4000/api/auth/check/${googleId}`);
          const checkData = await checkRes.json();
          token.dbId          = checkData.exists ? checkData.user.id    : null;
          token.imagen        = checkData.exists ? checkData.user.imagen : null;
          token.needsRegister = !checkData.exists;
        } catch {
          token.dbId = null;
          token.needsRegister = true;
        }
      } else if (!token.dbId && token.googleId) {
        // Token existente sin dbId (registro recién completado o token viejo)
        try {
          const checkRes  = await fetch(`http://localhost:4000/api/auth/check/${token.googleId}`);
          const checkData = await checkRes.json();
          token.dbId          = checkData.exists ? checkData.user.id    : null;
          token.imagen        = checkData.exists ? checkData.user.imagen : null;
          token.needsRegister = !checkData.exists;
        } catch {}
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id             = token.sub;
      session.user.dbId           = token.dbId   || null;
      session.user.imagen         = token.imagen || null;
      session.user.needsRegister  = token.needsRegister || false;
      session.user.googleId       = token.googleId || token.sub;
      return session;
    },
  },
  pages: {
    signIn: "/auth",
  },
});

export { handler as GET, handler as POST };
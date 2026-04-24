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
    async signIn({ user }) {
      return true;
    },
    async redirect({ url, baseUrl }) {
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
    async jwt({ token }) {
      if (!token.dbId) {
        try {
          const res  = await fetch(`http://localhost:4000/api/auth/check/${token.sub}`);
          const data = await res.json();
          if (data.exists) token.dbId = data.user.id;
        } catch {}
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id  = token.sub;
      session.user.dbId = token.dbId || null;
      return session;
    },
  },
  pages: {
    signIn: "/auth",
  },
});

export { handler as GET, handler as POST };
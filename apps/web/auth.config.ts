import type { NextAuthConfig } from 'next-auth';

// Extra claims carried on the session. Declared here rather than in auth.ts so
// middleware (which only imports this file) sees the same shape.
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      role: 'LEARNER' | 'ADMIN';
      batchId: string | null;
    } & DefaultSession['user'];
  }
}
import type { DefaultSession } from 'next-auth';

// The edge-safe half of the auth config. Middleware runs on the edge runtime,
// which cannot load Prisma — so anything that touches the database (the
// Credentials provider's authorize) lives in auth.ts and is added on top of
// this. Middleware only needs to answer "is there a valid session token", and
// that is pure JWT verification.
export const authConfig = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const signedIn = Boolean(auth?.user);
      const { pathname } = request.nextUrl;

      // Already signed in and heading for login/signup — send them to the app.
      if (signedIn && (pathname === '/login' || pathname === '/signup')) {
        return Response.redirect(new URL('/', request.nextUrl));
      }
      if (pathname === '/login' || pathname === '/signup') return true;

      // Everything else the matcher covers requires a session. Returning false
      // redirects to `pages.signIn`.
      return signedIn;
    },
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as { id: string; role: string; batchId: string | null };
        token.uid = u.id;
        token.role = u.role;
        token.batchId = u.batchId;
      }
      return token;
    },
    async session({ session, token }) {
      // Spread rather than replace: Auth.js's own user fields (and the adapter
      // shape TypeScript insists on) stay intact; we only add our claims.
      session.user = {
        ...session.user,
        id: String(token.uid ?? ''),
        email: String(token.email ?? ''),
        role: (token.role as 'LEARNER' | 'ADMIN') ?? 'LEARNER',
        batchId: (token.batchId as string | null) ?? null,
      };
      return session;
    },
  },
} satisfies NextAuthConfig;

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@judge/db';
import { authConfig } from './auth.config';

// Email + password auth. Explicitly an interim measure — the plan is to
// federate to "Login with Scaler" SSO, which is why this uses Auth.js rather
// than a hand-rolled cookie: swapping in an OIDC provider later is a config
// change, not a rewrite.
//
// This is the Node-runtime half: it adds the Credentials provider (which needs
// Prisma) on top of the edge-safe `authConfig` that middleware uses.
//
// JWT sessions, not database sessions: the journey is a client-side SPA that
// checks the session on every screen, and a stateless token avoids a DB round
// trip per check. Role and batch ride in the token so guards don't query.

// A real bcrypt hash of a value no password can be, used to keep the
// wrong-email and wrong-password paths the same cost.
const DUMMY_HASH = '$2a$12$C6UzMDM.H6dfI/f/IKcEe.7Q6Zn3aP3KcU5r0m5ZzTQpLxQhV3Xy2';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const email = String(raw?.email ?? '')
          .trim()
          .toLowerCase();
        const password = String(raw?.password ?? '');
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        // Always run a comparison, even with no user — otherwise a wrong email
        // returns measurably faster than a wrong password, which tells an
        // attacker which addresses are registered.
        const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
        if (!user || !ok) return null;

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          batchId: user.batchId,
        } as never;
      },
    }),
  ],
});

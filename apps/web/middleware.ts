import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

// Edge-safe: authConfig has no providers and no Prisma, so this is pure JWT
// verification. The Credentials provider lives in auth.ts (Node runtime only).
export const { auth: middleware } = NextAuth(authConfig);
export default middleware;

export const config = {
  // Guard the journey and the problem API. Deliberately NOT matched:
  //   /api/auth/*  — sign-in and signup must be reachable while signed out
  //   /_next/*, /icon.svg, /brand/*, *.wasm — static assets
  matcher: [
    '/',
    '/login',
    '/signup',
    '/api/problems/:path*',
  ],
};

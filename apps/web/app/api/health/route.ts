import { prisma } from '@judge/db';

// Deploy health check. Deliberately NOT in the middleware matcher, so it stays
// reachable while signed out — `/` now redirects to /login, which a health
// check reads as a failure.
//
// Always 200 when the process is serving. The database is reported but does
// not gate the result: a transient DB blip should not fail a deploy and roll
// back a good build. Use the `db` field for monitoring, not liveness.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  let db: 'up' | 'down' = 'down';
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = 'up';
  } catch (err) {
    console.error('[api/health] database unreachable:', err);
  }

  return Response.json(
    { status: 'ok', db, ts: new Date().toISOString() },
    { headers: { 'cache-control': 'no-store' } }
  );
}

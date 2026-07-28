import { z } from 'zod';
import { auth } from '../../../../auth';
import { prisma } from '@judge/db';

// Managing who is an admin.
//
// Adding an email does two things, and both are needed: it promotes the account
// if one exists, and it records the email so a LATER signup is promoted too. The
// people you want as admins usually have not created an account at the moment you
// decide it, and "ask them to sign up first, then tell me again" is a step
// everyone forgets.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  note: z.string().trim().max(120).optional(),
});

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return { error: Response.json({ error: 'unauthenticated' }, { status: 401 }) };
  if (session.user.role !== 'ADMIN') return { error: Response.json({ error: 'forbidden' }, { status: 403 }) };
  return { user: session.user };
}

/** Current admins, plus listed emails that have not signed up yet. */
export async function GET() {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const [admins, allowlist] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, email: true, createdAt: true },
      orderBy: { email: 'asc' },
    }),
    prisma.adminAllowlist.findMany({ orderBy: { createdAt: 'desc' } }),
  ]);

  const adminEmails = new Set(admins.map((a) => a.email));

  return Response.json({
    admins: admins.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() })),
    // Only the entries with nobody attached — an email that is already an admin
    // would just be the same row twice on screen.
    pending: allowlist
      .filter((a) => !adminEmails.has(a.email))
      .map((a) => ({ email: a.email, note: a.note, addedBy: a.addedBy, createdAt: a.createdAt.toISOString() })),
  });
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: 'bad_request' }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ error: 'invalid_input', message: parsed.error.errors[0]?.message }, { status: 400 });
  }
  const { email, note } = parsed.data;

  await prisma.adminAllowlist.upsert({
    where: { email },
    update: { note: note ?? null, addedBy: gate.user.email },
    create: { email, note: note ?? null, addedBy: gate.user.email },
  });

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });
  if (existing && existing.role !== 'ADMIN') {
    await prisma.user.update({ where: { id: existing.id }, data: { role: 'ADMIN' } });
  }

  return Response.json({
    email,
    promoted: Boolean(existing),
    // The role is carried in the sign-in token, so a promoted user who is already
    // signed in keeps their old role until they sign out and back in. Saying so
    // here is the difference between "it works" and "it looks broken".
    message: existing
      ? 'Now an admin. They need to sign out and back in for it to take effect.'
      : 'Saved. They will become an admin the moment they sign up.',
  });
}

export async function DELETE(req: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const email = new URL(req.url).searchParams.get('email')?.trim().toLowerCase();
  if (!email) return Response.json({ error: 'email_required' }, { status: 400 });

  // Removing your own admin rights locks you out of this page with no way back
  // except the database. Refuse rather than be helpful.
  if (email === gate.user.email?.toLowerCase()) {
    return Response.json({ error: 'cannot_remove_self', message: 'You cannot remove your own admin access.' }, { status: 400 });
  }

  await prisma.adminAllowlist.deleteMany({ where: { email } });
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    await prisma.user.update({ where: { id: existing.id }, data: { role: 'LEARNER' } });
  }

  return Response.json({ email, demoted: Boolean(existing) });
}

import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@judge/db';

// Self-signup gated by a batch invite code. The code is what ties a learner to
// a Batch (and through it a Program), which is how problems get assigned — so
// signup without a valid code has nowhere to put the user.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BCRYPT_ROUNDS = 12;

const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(200),
  inviteCode: z.string().trim().min(1, 'An invite code is required.'),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'bad_request' }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid_input', message: parsed.error.errors[0]?.message ?? 'Check your details.' },
      { status: 400 }
    );
  }
  const { email, password, inviteCode } = parsed.data;

  try {
    // Invite codes are issued per batch and shared within a cohort, so compare
    // case-insensitively — learners retype them from slides and chat messages.
    const batch = await prisma.batch.findFirst({
      where: { inviteCode: { equals: inviteCode, mode: 'insensitive' } },
    });
    if (!batch) {
      return Response.json(
        { error: 'invalid_invite', message: 'That invite code isn’t recognised.' },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json(
        { error: 'email_taken', message: 'An account with that email already exists.' },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
        role: 'LEARNER',
        batchId: batch.id,
      },
      select: { id: true, email: true, role: true, batchId: true },
    });

    return Response.json({ user }, { status: 201 });
  } catch (err) {
    // A concurrent signup with the same email loses the unique-constraint race.
    if ((err as { code?: string }).code === 'P2002') {
      return Response.json(
        { error: 'email_taken', message: 'An account with that email already exists.' },
        { status: 409 }
      );
    }
    console.error('[api/auth/signup] failed:', err);
    return Response.json({ error: 'signup_failed' }, { status: 500 });
  }
}

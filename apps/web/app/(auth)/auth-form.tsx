'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';

// One form for both login and signup — the two differ only by an invite-code
// field and which request fires first. Styled with the app's CSS custom
// properties (no raw hex, zero radius on chrome) to match the journey.

const wrap: React.CSSProperties = {
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  background: 'var(--surface-1, #F4F5F7)',
  padding: 24,
};

const card: React.CSSProperties = {
  width: '100%',
  maxWidth: 400,
  background: 'var(--surface-0, #fff)',
  border: '1px solid var(--border-subtle, #E3E5E9)',
  padding: 32,
  display: 'grid',
  gap: 16,
};

const label: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--fg-2, #565C69)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: 6,
  display: 'block',
};

const input: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: 14,
  fontFamily: 'inherit',
  color: 'var(--fg-1, #14161A)',
  background: 'var(--surface-0, #fff)',
  border: '1px solid var(--border-strong, #C9CDD4)',
  borderRadius: 0,
  outline: 'none',
};

const button: React.CSSProperties = {
  width: '100%',
  padding: '11px 16px',
  fontSize: 14,
  fontWeight: 600,
  fontFamily: 'inherit',
  color: '#fff',
  background: 'var(--brand-primary, #0055FF)',
  border: 'none',
  borderRadius: 0,
  cursor: 'pointer',
};

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const isSignup = mode === 'signup';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    try {
      if (isSignup) {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email, password, inviteCode }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.message ?? 'Could not create your account.');
          setBusy(false);
          return;
        }
      }

      // Signup signs you straight in — making a new learner log in again
      // immediately after proving who they are is friction with no benefit.
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        setError(isSignup ? 'Account created, but sign-in failed. Try logging in.' : 'Wrong email or password.');
        setBusy(false);
        return;
      }
      window.location.href = '/';
    } catch {
      setError('Something went wrong. Please try again.');
      setBusy(false);
    }
  }

  return (
    <div style={wrap}>
      <form style={card} onSubmit={onSubmit}>
        <div>
          <div
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--brand-primary, #0055FF)',
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            Agent Builder · Judge
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: 'var(--fg-1, #14161A)', margin: 0 }}>
            {isSignup ? 'Create your account' : 'Sign in'}
          </h1>
        </div>

        <div>
          <label style={label} htmlFor="email">Email</label>
          <input
            id="email"
            style={input}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label style={label} htmlFor="password">Password</label>
          <input
            id="password"
            style={input}
            type="password"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            required
            minLength={isSignup ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {isSignup ? (
            <div style={{ fontSize: 12, color: 'var(--fg-3, #8A909C)', marginTop: 6 }}>At least 8 characters.</div>
          ) : null}
        </div>

        {isSignup ? (
          <div>
            <label style={label} htmlFor="inviteCode">Batch invite code</label>
            <input
              id="inviteCode"
              style={input}
              required
              placeholder="e.g. AIML-DEMO"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
            />
            <div style={{ fontSize: 12, color: 'var(--fg-3, #8A909C)', marginTop: 6 }}>
              From your batch. This is what links you to your cohort.
            </div>
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            style={{
              fontSize: 13,
              color: 'var(--status-danger-fg, #B42318)',
              background: 'var(--status-danger-bg, #FEF3F2)',
              border: '1px solid var(--status-danger-border, #FDA29B)',
              padding: '10px 12px',
            }}
          >
            {error}
          </div>
        ) : null}

        <button style={{ ...button, opacity: busy ? 0.6 : 1 }} type="submit" disabled={busy}>
          {busy ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
        </button>

        <div style={{ fontSize: 13, color: 'var(--fg-2, #565C69)', textAlign: 'center' }}>
          {isSignup ? (
            <>Already have an account? <a href="/login" style={{ color: 'var(--brand-primary, #0055FF)' }}>Sign in</a></>
          ) : (
            <>Need an account? <a href="/signup" style={{ color: 'var(--brand-primary, #0055FF)' }}>Sign up</a></>
          )}
        </div>
      </form>
    </div>
  );
}

import { useEffect, useState } from 'react';

// Who is signed in, client side.
//
// There is no <SessionProvider> mounted — the journey is a dynamically-imported,
// client-only SPA under a single #root, and adding one means restructuring that
// boundary — so next-auth/react's `useSession` is not available here. This reads
// `/api/auth/session` directly, which is what TopBar's UserMenu has always done.
// Shared rather than copied, so two places can never disagree about who the
// learner is.
//
// Returns `null` while the request is in flight AND when genuinely signed out.
// Callers must therefore have something to show for "no name yet": the Result
// screen greets by first name, so it falls back to a greeting that works without
// one rather than flashing an empty slot.
export function useSignedInUser() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setUser(data?.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return user;
}

/**
 * First name only, for a greeting. `null` when there is nothing usable, so the
 * caller picks the wording rather than interpolating an empty string.
 */
export function firstNameOf(user) {
  const raw = String(user?.name ?? '').trim();
  if (!raw) return null;
  return raw.split(/\s+/)[0];
}

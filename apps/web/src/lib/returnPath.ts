// Where to send someone after they sign in.
//
// The journey is behind auth, so a shared challenge link (`/?problem=<slug>`)
// hits the middleware first and NextAuth appends the original URL as
// `?callbackUrl=…`. The form used to ignore that and always go to `/`, which
// meant every link a learner was sent landed them on Home with no idea a
// specific challenge had been picked for them.
//
// Honouring it turns the login form into an open redirect unless the value is
// checked, so this is the one place that decides what is safe: somewhere on this
// site, and nothing else. Anything odd resolves to Home rather than erroring —
// the learner is signed in either way, and the worst outcome should be one extra
// click, not a dead end.
//
// NextAuth writes the callback as an ABSOLUTE url (`http://host/?problem=…`),
// not a path, which is why this takes an origin and compares against it rather
// than simply requiring a leading slash.

const HOME = '/';

// Bouncing back to the page they just came from would show the login form again
// to someone who is now signed in.
const AUTH_PATHS = ['/login', '/signup'];

export function safeReturnPath(raw: string | null | undefined, origin: string): string {
  if (!raw) return HOME;

  let value = raw;
  // The value arrives percent-encoded inside a query string, and may or may not
  // have been decoded already depending on how it was read.
  try {
    value = decodeURIComponent(raw);
  } catch {
    return HOME;
  }

  let url: URL;
  try {
    url = new URL(value, origin);
  } catch {
    return HOME;
  }

  // The origin comparison is the whole guard. It rejects another site's URL and
  // also `//host` / `/\host`, which look like paths but resolve to a new host.
  if (url.origin !== new URL(origin).origin) return HOME;
  if (AUTH_PATHS.includes(url.pathname)) return HOME;

  // A path, never an absolute URL: this is assigned to `location.href`, and
  // keeping it relative means one less way to leave the site.
  return `${url.pathname}${url.search}${url.hash}`;
}

// The `callbackUrl` NextAuth put in the current address bar, if any. Read from
// `window` rather than `useSearchParams()` on purpose: this is needed once, in a
// submit handler, and the hook would force a Suspense boundary around a form
// that has no other reason to have one.
export function returnPathFromUrl(): string {
  if (typeof window === 'undefined') return HOME;
  return safeReturnPath(
    new URLSearchParams(window.location.search).get('callbackUrl'),
    window.location.origin
  );
}

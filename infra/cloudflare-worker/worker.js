// Reverse proxy in front of the Railway deployment, so learners on networks that
// refuse to resolve *.up.railway.app can still reach Judge.
//
// WHY THIS EXISTS
// Jio (and some office WiFi) fails to resolve `n8n-judge-production.up.railway.app`
// at all — Chrome reports DNS_PROBE_FINISHED_BAD_CONFIG, "server IP address could
// not be found", while the same host resolves and answers 200 everywhere else. It
// is the NAME that is blocked, not the address, which is why a custom domain
// CNAME'd at Railway would not have helped: the resolver still has to follow the
// chain to the blocked name. A *.workers.dev hostname is served by Cloudflare and
// resolves on those networks, and Cloudflare reaches Railway from its own network,
// where nothing is blocked.
//
// This is the no-domain option, chosen because there is no zone to delegate. If a
// domain ever becomes available, a proxied (orange-cloud) CNAME does the same job
// with no code to maintain, and this worker should be deleted.
//
// WHAT IT MUST GET RIGHT
//   - The Host header stays the Railway host: Railway's edge routes by Host, so
//     rewriting it to the workers.dev name returns someone else's 404.
//   - The PUBLIC host therefore travels as x-forwarded-host, which is what Next
//     and Auth.js read to build absolute URLs. Paired with AUTH_URL on the Railway
//     service (see README), sign-in callbacks land on workers.dev.
//   - Redirects are rewritten anyway, as a backstop. NextAuth bounces a signed-out
//     learner to /login?callbackUrl=<absolute url>, and the app only honours a
//     callback whose origin matches the browser's (safeReturnPath). A Location
//     still naming the Railway host would silently drop every shared challenge
//     link back to Home.
//   - The body is streamed through untouched, because Ask Iris streams its answer
//     and the voice clips are served with Range requests.

export default {
  async fetch(request, env, ctx) {
    const inbound = new URL(request.url);
    const originHost = env.ORIGIN_HOST;

    const target = new URL(request.url);
    target.protocol = 'https:';
    target.hostname = originHost;
    target.port = '';

    const headers = new Headers(request.headers);
    headers.set('x-forwarded-host', inbound.host);
    headers.set('x-forwarded-proto', 'https');

    const proxied = new Request(target, {
      method: request.method,
      headers,
      // GET/HEAD carry no body, and passing one is a TypeError.
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
      // Manual, so a 3xx arrives here to be rewritten instead of being followed
      // inside the worker and returned as a 200 from the wrong URL.
      redirect: 'manual',
    });

    // Next's build output is content-hashed and public, so it is the one thing
    // safe to hold at the edge. Nothing under /api is cached: the voice clips and
    // the problem payloads are auth-gated, and a cached copy would serve them to
    // anyone with the URL.
    const cacheable = inbound.pathname.startsWith('/_next/static/');
    const res = await fetch(proxied, cacheable ? { cf: { cacheEverything: true, cacheTtl: 86400 } } : undefined);

    const location = res.headers.get('location');
    if (!location) return res;

    const out = new Response(res.body, res);
    // replaceAll, not a URL rewrite: the Railway host appears twice in a login
    // bounce — once as the redirect target and once inside the percent-encoded
    // callbackUrl, where the hostname survives encoding intact.
    out.headers.set('location', location.replaceAll(originHost, inbound.host));
    return out;
  },
};

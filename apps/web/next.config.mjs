import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Next loads .env relative to the app directory, but this is a monorepo and the
// single .env lives at the repo root (Prisma, pg-boss and the web app all share
// it). Load it here, without overwriting anything already in the environment —
// so Railway's injected variables always win in production.
function loadRootEnv() {
  const here = dirname(fileURLToPath(import.meta.url));
  const file = join(here, '..', '..', '.env');
  if (!existsSync(file)) return;

  for (const raw of readFileSync(file, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).replace(/^export\s+/, '').trim();
    if (!key || process.env[key] !== undefined) continue;
    process.env[key] = line
      .slice(eq + 1)
      .trim()
      .replace(/^(['"])(.*)\1$/s, '$2');
  }
}
loadRootEnv();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Workspace packages ship raw .ts/.js sources — Next transpiles them.
  transpilePackages: [
    '@judge/engine',
    '@judge/catalog',
    '@judge/problems',
    '@judge/problem-schema',
    '@judge/trace',
    '@judge/queue',
    '@judge/llm',
    '@judge/db',
  ],
  // Node-only dependencies that must not be bundled: pg-boss (via @judge/queue)
  // and the Prisma client (via @judge/db), whose generated engine is loaded at
  // runtime from node_modules rather than traced into the bundle.
  serverExternalPackages: ['pg-boss', '@prisma/client', '.prisma/client'],
};

export default nextConfig;

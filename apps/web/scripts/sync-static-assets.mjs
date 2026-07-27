// Copies the dotLottie WASM renderer from node_modules into public/ so the
// app serves it itself (offline/CSP-safe — never the unpkg CDN fallback).
// Runs on postinstall and before dev/build.
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

// The package's exports map hides package.json from require.resolve — walk up
// the node_modules chain instead (hoisted install lives at the repo root).
let from = null;
for (let dir = root; ; dir = dirname(dir)) {
  const candidate = resolve(dir, 'node_modules/@lottiefiles/dotlottie-web/dist/dotlottie-player.wasm');
  if (existsSync(candidate)) {
    from = candidate;
    break;
  }
  if (dirname(dir) === dir) break;
}
const to = join(root, 'public', 'dotlottie-player.wasm');

if (!from || !existsSync(from)) {
  console.warn(`[sync-static-assets] dotlottie wasm not found at ${from} — mascot will not render`);
} else {
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
  console.log(`[sync-static-assets] copied dotlottie wasm -> ${to}`);
}

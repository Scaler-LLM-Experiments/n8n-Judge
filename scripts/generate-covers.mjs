// Render each problem's Home-card cover art, once, on this machine.
//
//   npm run covers:generate            # only what is missing
//   npm run covers:generate -- --force # redraw everything
//   npm run covers:generate -- --only email-triage
//   npm run covers:generate -- --process-only  # re-crop existing PNGs to 21:9
//
// Same shape as the voice pipeline, for the same reasons: nothing is generated at
// runtime, the vendor is called from a laptop, and the output is committed. A card
// that waits on an image API is a card that sometimes has no image.
//
// The AUTHORED half of each prompt lives in the problem data
// (`coverImage.prompt`) — colour field + one unique geometric motif. The STYLE
// half lives here, once, so every card in the catalogue reads as one set. Motifs
// must not repeat across problems (assign X, sparkles, chevron, ring, etc. once).
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { problemList } from '../packages/problems/index.js';

const OUT_DIR = path.join(process.cwd(), 'apps/web/public/covers');
const MODEL = 'gpt-image-1';
// gpt-image-1 has no true 21:9 size. Generate the widest landscape the API offers,
// then centre-crop to 21:9 so the Home card (aspect-ratio 21/9) can use cover
// without letterboxing or stretching.
const SIZE = '1536x1024';
// 1536 × (9/21) ≈ 658. Even height for cleaner codecs.
const CROP_W = 1536;
const CROP_H = 658;

// Shared look: full-bleed abstract posters like the design references (spray grain,
// soft atmospheric fields, one simple symbol). Per-problem colour and motif live in
// coverImage.prompt — never here, or every card would paint the same icon.
//
// Brightness is load-bearing: muted navy/dusty rose read as dead tiles on a white
// catalogue. Prefer saturated mid-to-high key colour; dark corners only as accent.
const STYLE = [
  'Abstract atmospheric digital painting, full-bleed edge to edge, ultra-wide 21:9 cinematic banner.',
  'BRIGHT, vivid, high-chroma colour — cheerful and energetic, not muted, not pastel-grey, not near-black. Think bold poster ink, not a dim gradient.',
  'Heavy fine film grain and soft spray-paint noise over smooth luminous colour gradients.',
  'Exactly ONE simple geometric motif family (described in the subject line above) — large, soft-edged or slightly out of focus, not photorealistic, not a 3D render.',
  'No second motif family, no repeating wallpaper of the same icon, no characters, no UI chrome, no screens, no envelopes, no computers, no isometric objects.',
  'No text, no letters, no numbers, no logos, no watermarks, no people, no faces.',
  'Poster background energy: empty space is part of the composition; the motif sits off-centre, not stuck in the middle like a logo.',
  'The colour field fills every edge — no white border, no studio backdrop, no framed canvas, no letterboxing.',
].join(' ');

const args = process.argv.slice(2);
const force = args.includes('--force');
// Re-crop art that already exists, without spending an image call.
const processOnly = args.includes('--process-only');
const onlyIdx = args.indexOf('--only');
const only = onlyIdx >= 0 ? args[onlyIdx + 1] : null;

const key = process.env.OPENAI_API_KEY;
if (!key && !processOnly) {
  console.error('OPENAI_API_KEY is not set. Run with: node --env-file=.env scripts/generate-covers.mjs');
  process.exit(1);
}

// Resize/crop to CROP_W×CROP_H centre-band. Full-bleed abstract art is meant to
// fill the frame; we do NOT flood-fill or trim transparent margins (that was for
// the old flat-vector style sitting on a studio white).
//
// Prefer ImageMagick; fall back to macOS `sips` so a laptop without brew still
// ships true 21:9 files.
function toBanner(file) {
  if (haveMagick()) {
    execFileSync('magick', [
      file,
      '-resize', `${CROP_W}x${CROP_H}^`,
      '-gravity', 'center',
      '-extent', `${CROP_W}x${CROP_H}`,
      file,
    ]);
    return;
  }
  if (haveSips()) {
    // sips crops from the centre when the source is larger than the target box.
    execFileSync('sips', ['--cropToHeightWidth', String(CROP_H), String(CROP_W), file, '--out', file], {
      stdio: 'ignore',
    });
    return;
  }
  throw new Error('need ImageMagick (`magick`) or macOS `sips` to crop to 21:9');
}

function haveMagick() {
  try {
    execFileSync('magick', ['-version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function haveSips() {
  try {
    execFileSync('sips', ['--help'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const canCrop = haveMagick() || haveSips();
if (!canCrop) {
  console.warn('! Neither ImageMagick nor sips found — art will stay at the API size (~3:2), not 21:9.');
}

mkdirSync(OUT_DIR, { recursive: true });

/**
 * Load one case straight from its folder, registered or not.
 *
 * Art needs exactly one authored value — `coverImage.prompt` — which exists the
 * moment the author stage finishes. Filtering `problemList` was the only thing
 * making the cover wait for registration, and registration cannot move earlier
 * (voice.js is still a scaffold full of TODOs at that point). So the cover stage
 * reads the disk instead, and stops being on the critical path.
 */
async function fromDisk(slug) {
  const file = path.resolve(`packages/problems/${slug}/index.js`);
  if (!existsSync(file)) return null;
  const mod = await import(`file://${file}`);
  return Object.values(mod).find((v) => v && typeof v === 'object' && 'coverImage' in v) ?? null;
}

let targets = problemList.filter((p) => (only ? p.id === only : true));
if (!targets.length && only) {
  const unregistered = await fromDisk(only);
  if (unregistered) {
    console.log(`- ${only}: not registered yet, loaded from disk`);
    targets = [unregistered];
  }
}
if (!targets.length) {
  console.error(only ? `No problem with id "${only}", registered or on disk.` : 'No problems found.');
  process.exit(1);
}

let made = 0;
let skipped = 0;

for (const problem of targets) {
  const subject = problem.coverImage?.prompt;
  const file = path.join(OUT_DIR, `${problem.id}.png`);

  if (processOnly) {
    if (!existsSync(file)) {
      console.log(`- ${problem.id}: nothing drawn yet, skipping`);
      skipped += 1;
      continue;
    }
    if (!canCrop) {
      skipped += 1;
      continue;
    }
    toBanner(file);
    made += 1;
    console.log(`- ${problem.id}: cropped 21:9 → apps/web/public/covers/${problem.id}.png`);
    continue;
  }

  if (!subject) {
    console.log(`- ${problem.id}: no coverImage.prompt authored, skipping`);
    skipped += 1;
    continue;
  }

  if (existsSync(file) && !force) {
    console.log(`- ${problem.id}: already drawn (pass --force to redraw)`);
    skipped += 1;
    continue;
  }

  const prompt = `${subject}\n\n${STYLE}`;
  process.stdout.write(`- ${problem.id}: drawing… `);

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: MODEL, prompt, n: 1, size: SIZE, quality: 'high' }),
  });

  if (!res.ok) {
    // Print the vendor's own message: "your prompt was rejected" and "you are out
    // of credit" are different problems and only one of them is worth retrying.
    const detail = await res.text().catch(() => '');
    console.log('FAILED');
    console.error(`  ${res.status} ${res.statusText}: ${detail.slice(0, 400)}`);
    process.exitCode = 1;
    continue;
  }

  const body = await res.json();
  const b64 = body?.data?.[0]?.b64_json;
  if (!b64) {
    console.log('FAILED');
    console.error('  no image payload in the response');
    process.exitCode = 1;
    continue;
  }

  writeFileSync(file, Buffer.from(b64, 'base64'));
  if (canCrop) {
    try {
      toBanner(file);
    } catch (err) {
      console.log('drawn, crop FAILED');
      console.error(`  ${err.message || err}`);
      process.exitCode = 1;
      continue;
    }
  } else {
    console.log('drawn (not cropped to 21:9)');
  }
  made += 1;
  console.log(`done → apps/web/public/covers/${problem.id}.png`);
}

console.log(`\n${made} drawn, ${skipped} skipped.`);
if (made) {
  console.log('Set each problem\'s coverImage.src to "/covers/<id>.png", then run: npm run db:seed');
}

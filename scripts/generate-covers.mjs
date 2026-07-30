// Render each problem's Home-card cover art, once, on this machine.
//
//   npm run covers:generate            # only what is missing
//   npm run covers:generate -- --force # redraw everything
//   npm run covers:generate -- --only email-triage
//
// Same shape as the voice pipeline, for the same reasons: nothing is generated at
// runtime, the vendor is called from a laptop, and the output is committed. A card
// that waits on an image API is a card that sometimes has no image.
//
// The AUTHORED half of each prompt lives in the problem data
// (`coverImage.prompt`) so the art can be redrawn from the same description that
// produced it. The STYLE half lives here, once, because four cards sitting in a row
// have to look like one set — a per-problem style string drifts by the third
// problem.
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { problemList } from '../packages/problems/index.js';

const OUT_DIR = path.join(process.cwd(), 'apps/web/public/covers');
const MODEL = 'gpt-image-1';
// Landscape, matching the card's 16/9 cover slot. Generating square art and
// cropping it to fit throws away the composition the prompt asked for.
const SIZE = '1536x1024';

// One palette for the set. Brand blue rather than the reference's green: these sit
// on a blue-and-white UI, and four green cards would be the loudest thing on the
// page. Swap these two lines to restyle the whole catalogue.
const PALETTE =
  'Palette strictly limited to: bright brand blue #0055FF, a paler blue tint #E6F0FF, ' +
  'off-white #FAFAFA, light grey #E4E4E4, and thin black outlines. No other hues.';

const STYLE = [
  'Flat vector isometric illustration, editorial tech-magazine style.',
  'Clean 1px black outlines, flat fills, no gradients except soft fades, no textures, no drop shadows beyond a faint grey ground shadow.',
  PALETTE,
  // Must match COVER_BG in HomeScreen.jsx: the card pads the art and fills the gap
  // with this colour, so any drift shows up as a visible rectangle around the scene.
  'Background is a plain flat warm off-white #F9F6F2 studio backdrop with a few soft flat grey clouds, edge to edge.',
  'Include retro pixel-art computer or server towers drawn isometrically, and vertical streams of falling binary digits as connecting beams.',
  'No text, no words, no numbers other than binary 0s and 1s, no logos, no people, no faces.',
  'Composed as a wide banner with generous empty space around the subject.',
].join(' ');

const args = process.argv.slice(2);
const force = args.includes('--force');
// Re-cut the backdrop out of art that already exists, without spending an image
// call. What you want after changing only the post-processing.
const processOnly = args.includes('--process-only');
const onlyIdx = args.indexOf('--only');
const only = onlyIdx >= 0 ? args[onlyIdx + 1] : null;

const key = process.env.OPENAI_API_KEY;
if (!key && !processOnly) {
  console.error('OPENAI_API_KEY is not set. Run with: node --env-file=.env scripts/generate-covers.mjs');
  process.exit(1);
}

// Cut the backdrop away and crop to the art itself.
//
// The model paints a full rectangular scene on a solid backdrop. Dropped into a card
// that is a different white, that backdrop reads as a pale box sitting inside the
// card — a frame nobody designed. So: make it transparent and trim it off, and let
// the card's own padding be the only margin.
//
// Flood-filled from the four CORNERS rather than by colour match, deliberately. A
// plain `-transparent #F9F6F2` also eats every same-coloured pixel INSIDE the
// illustration (the computer housings and the paper are near-white), which hollows
// the drawing out. Flood fill only takes backdrop that is connected to the edge, so
// the clouds and the scene survive intact.
function cutBackdrop(file) {
  const size = execFileSync('magick', ['identify', '-format', '%w %h', file], { encoding: 'utf8' }).trim().split(' ');
  const w = Number(size[0]) - 1;
  const h = Number(size[1]) - 1;
  execFileSync('magick', [
    file,
    '-alpha', 'set',
    '-fuzz', '8%',
    '-fill', 'none',
    '-draw', 'alpha 0,0 floodfill',
    '-draw', `alpha ${w},0 floodfill`,
    '-draw', `alpha 0,${h} floodfill`,
    '-draw', `alpha ${w},${h} floodfill`,
    // Trim the now-transparent margin so every cover is the art and nothing else.
    // Without this the images keep wildly different amounts of built-in padding and
    // the illustrations sit at visibly different sizes across a row of cards.
    '-trim', '+repage',
    file,
  ]);
}

function haveMagick() {
  try {
    execFileSync('magick', ['-version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const magick = haveMagick();
if (!magick) {
  console.warn('! ImageMagick (`magick`) not found — the backdrop will be left in place.');
  console.warn('  brew install imagemagick, then re-run with --process-only.');
}

mkdirSync(OUT_DIR, { recursive: true });

const targets = problemList.filter((p) => (only ? p.id === only : true));
if (!targets.length) {
  console.error(only ? `No problem with id "${only}".` : 'No problems found.');
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
    if (!magick) {
      skipped += 1;
      continue;
    }
    cutBackdrop(file);
    made += 1;
    console.log(`- ${problem.id}: backdrop cut → apps/web/public/covers/${problem.id}.png`);
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
  if (magick) cutBackdrop(file);
  made += 1;
  console.log(`done → apps/web/public/covers/${problem.id}.png`);
}

console.log(`\n${made} drawn, ${skipped} skipped.`);
if (made) {
  console.log('Set each problem\'s coverImage.src to "/covers/<id>.png", then run: npm run db:seed');
}

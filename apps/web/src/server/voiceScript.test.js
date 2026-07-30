import { describe, expect, it } from 'vitest';
import { problems } from '@judge/problems';
import { NODE_CATALOG } from '@judge/catalog';
import { buildScript } from './voiceScript.js';
import { clipId } from '../lib/voicePath.js';
import { enumerateSpeakable } from '../lib/voiceCatalogue.js';

const VOICE = { voiceId: 'v-test', modelId: 'eleven_v3' };
const build = (slug) => buildScript(problems[slug], NODE_CATALOG, VOICE);

describe('buildScript', () => {
  it('names every line the browser can ask for', () => {
    // The failure this exists to stop: the browser derives an id, finds nothing in
    // the table, and silently drops to a caption. Enumerating from the same problem
    // data the browser holds is the only way to know the table is complete.
    for (const [slug, problem] of Object.entries(problems)) {
      const table = build(slug);
      for (const item of enumerateSpeakable(problem, NODE_CATALOG)) {
        for (const variant of item.variants) {
          const id = clipId(item.moment, item.key, item.vars, variant.index);
          expect(table.clips[id], `${slug} is missing ${id}`).toBeTruthy();
          expect(table.clips[id].text).toBe(variant.spoken);
        }
      }
    }
  });

  it('records what the fingerprints were computed against', () => {
    expect(build('email-triage').renderedWith).toBe('elevenlabs/v-test/eleven_v3');
  });
});

describe('across the whole catalogue', () => {
  /** file -> every distinct sentence stored under it. */
  const byFile = new Map();
  /** the sentence each id holds, per problem. */
  let entries = 0;
  for (const slug of Object.keys(problems)) {
    for (const [, clip] of Object.entries(build(slug).clips)) {
      entries += 1;
      if (!byFile.has(clip.file)) byFile.set(clip.file, new Set());
      byFile.get(clip.file).add(clip.text);
    }
  }

  it('never stores two different sentences under one file', () => {
    // 17 files hold 2-3 different sentences under the old scheme, so a learner hears
    // the explanation for a different node. This is the invariant that stops it.
    const collided = [...byFile.entries()].filter(([, texts]) => texts.size > 1);
    expect(collided.map(([file]) => file)).toEqual([]);
  });

  it('renders a line every problem says exactly once', () => {
    const shared = [...byFile.keys()].filter((f) => f.startsWith('shared/'));
    expect(shared.length).toBeGreaterThan(0);
    // Shared files are reached from several problems' tables, so entries outnumber
    // files. That gap IS the saving.
    expect(byFile.size).toBeLessThan(entries);
  });

  it('gives a reworded line a different file, and an untouched line the same one', () => {
    const before = build('email-triage');
    const again = buildScript(problems['email-triage'], NODE_CATALOG, VOICE);
    expect(again).toEqual(before);

    const reworded = buildScript(
      { ...problems['email-triage'], voice: { welcome: ['[warm] Completely different words.'] } },
      NODE_CATALOG,
      VOICE
    );
    const id = clipId('welcome', null, {}, 0);
    expect(reworded.clips[id].file).not.toBe(before.clips[id].file);
  });

  it('gives every clip a new file when the voice changes', () => {
    // Switching voice or model makes every stored clip wrong in the same way a
    // rewrite does, so re-rendering everything is the correct behaviour.
    const other = buildScript(problems['email-triage'], NODE_CATALOG, { ...VOICE, voiceId: 'v-other' });
    const id = clipId('welcome', null, {}, 0);
    expect(other.clips[id].file).not.toBe(build('email-triage').clips[id].file);
  });
});

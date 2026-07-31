import { describe, it, expect } from 'vitest';
import { urlWithSlug } from './problemsApi.js';

// The shareable-link half of `?problem=<slug>`. `slugFromUrl()` reads it; this
// writes it, and the two have to agree on the same query key.
describe('urlWithSlug', () => {
  it('adds the slug — this is the link that gets shared', () => {
    expect(urlWithSlug('http://localhost:3000/', 'email-triage')).toBe('/?problem=email-triage');
  });

  it('replaces the slug already there, rather than appending a second one', () => {
    expect(urlWithSlug('http://localhost:3000/?problem=old', 'email-triage')).toBe(
      '/?problem=email-triage'
    );
  });

  it('removes it on the way back to Home, leaving no bare "?" behind', () => {
    expect(urlWithSlug('http://localhost:3000/?problem=email-triage', null)).toBe('/');
  });

  it('leaves every other query param alone — it owns one key, not the URL', () => {
    expect(urlWithSlug('http://localhost:3000/?utm=slack', 'email-triage')).toBe(
      '/?utm=slack&problem=email-triage'
    );
    expect(urlWithSlug('http://localhost:3000/?utm=slack&problem=x', null)).toBe('/?utm=slack');
  });

  it('preserves the hash, because the dev routes live in it', () => {
    expect(urlWithSlug('http://localhost:3000/#build', 'email-triage')).toBe(
      '/?problem=email-triage#build'
    );
  });
});

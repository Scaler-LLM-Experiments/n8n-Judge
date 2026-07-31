import { describe, it, expect } from 'vitest';
import { safeReturnPath } from './returnPath.ts';

const HERE = 'http://localhost:3000';

describe('safeReturnPath', () => {
  it('keeps a same-origin absolute URL as a path — this is the shape NextAuth actually sends', () => {
    expect(safeReturnPath('http://localhost:3000/?problem=email-triage', HERE)).toBe(
      '/?problem=email-triage'
    );
  });

  it('decodes what NextAuth encoded into the query string', () => {
    expect(safeReturnPath('http%3A%2F%2Flocalhost%3A3000%2F%3Fproblem%3Demail-triage', HERE)).toBe(
      '/?problem=email-triage'
    );
  });

  it('keeps a plain same-site path too', () => {
    expect(safeReturnPath('/?problem=email-triage', HERE)).toBe('/?problem=email-triage');
    expect(safeReturnPath('%2F%3Fproblem%3Demail-triage', HERE)).toBe('/?problem=email-triage');
  });

  it('preserves a hash, since the dev routes live there', () => {
    expect(safeReturnPath('/?problem=email-triage#build', HERE)).toBe('/?problem=email-triage#build');
  });

  it('falls back to Home when there is nothing to return to', () => {
    expect(safeReturnPath(null, HERE)).toBe('/');
    expect(safeReturnPath(undefined, HERE)).toBe('/');
    expect(safeReturnPath('', HERE)).toBe('/');
  });

  it('refuses another origin — honouring this blindly is an open redirect', () => {
    expect(safeReturnPath('https://evil.example/steal', HERE)).toBe('/');
    expect(safeReturnPath('http://localhost:4000/', HERE)).toBe('/');
    expect(safeReturnPath('http%3A%2F%2Fevil.example', HERE)).toBe('/');
  });

  it('refuses protocol-relative URLs, which look like paths but resolve to a new host', () => {
    expect(safeReturnPath('//evil.example/steal', HERE)).toBe('/');
    expect(safeReturnPath('/\\evil.example/steal', HERE)).toBe('/');
    expect(safeReturnPath('%2F%2Fevil.example', HERE)).toBe('/');
  });

  it('never returns to login or signup — the learner is signed in by the time this runs', () => {
    expect(safeReturnPath('/login', HERE)).toBe('/');
    expect(safeReturnPath('http://localhost:3000/signup?invite=AIML-DEMO', HERE)).toBe('/');
  });

  it('survives a malformed escape instead of throwing at the learner', () => {
    expect(safeReturnPath('/%E0%A4%A', HERE)).toBe('/');
  });
});

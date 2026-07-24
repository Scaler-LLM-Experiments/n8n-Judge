import React from 'react';
import { ArrowRight, EnvelopeSimpleOpen, UsersThree, Robot } from '@phosphor-icons/react';
import { MascotPlayer } from '../mascot/MascotPlayer.jsx';
import { Button } from '../design-system/Button.jsx';
const scalerLogo = '/brand/scaler-logo.svg';

// A Phosphor icon per problem (falls back to a generic agent icon).
const ICONS = { 'email-triage': EnvelopeSimpleOpen, 'lead-triage': UsersThree };

// Landing page: pick a challenge, each launches its own build journey.
export function HomeScreen({ problems, onSelect }) {
  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--surface-0)' }}>
      {/* brand bar */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 24px' }}>
        <img src={scalerLogo} alt="Scaler" style={{ height: 22, width: 'auto', display: 'block' }} />
      </div>

      <div style={{ maxWidth: 940, margin: '0 auto', padding: '12px 24px 64px' }}>
        {/* hero */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12, marginBottom: 40 }}>
          <div style={{ width: 96, height: 96 }}>
            <MascotPlayer clip="hello" once={false} onceDone={() => {}} />
          </div>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--brand-primary)', fontWeight: 700 }}>Agent Builder · Judge</div>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: 38, fontWeight: 600, color: 'var(--fg-1)', lineHeight: 1.15, margin: 0 }}>Build a real AI agent — no code.</h1>
          <p style={{ fontSize: 15, color: 'var(--fg-2)', lineHeight: 1.6, maxWidth: 540, margin: 0 }}>
            Pick a challenge. Wire up the nodes on an n8n-style canvas, run it against real cases, and prove you understand how it behaves. Iris guides you the whole way.
          </p>
        </div>

        {/* problem cards */}
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--fg-2)', fontWeight: 700, marginBottom: 12 }}>Choose a challenge</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {problems.map((p) => {
            const Icon = ICONS[p.id] || Robot;
            return (
              <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 22, background: 'var(--surface-0)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ width: 46, height: 46, flex: 'none', background: 'var(--brand-blue-50, rgba(0,85,255,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={24} weight="regular" color="var(--brand-primary)" />
                </span>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--fg-1)', marginBottom: 6 }}>{p.title}</div>
                  <div style={{ fontSize: 13.5, color: 'var(--fg-2)', lineHeight: 1.55 }}>{p.tagline || p.statement}</div>
                </div>
                <Button variant="primary" size="lg" iconRight={<ArrowRight size={16} weight="bold" />} onClick={() => onSelect(p)} style={{ marginTop: 'auto', width: '100%', justifyContent: 'center' }}>
                  Try this judge
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

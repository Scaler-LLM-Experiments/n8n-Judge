import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { X, Lightbulb, Microphone, PaperPlaneRight } from '@phosphor-icons/react';
import { MascotPlayer } from '../mascot/MascotPlayer.jsx';

// Opening prompts — generic to the problem or to n8n setup, so they make sense
// on any screen.
const SUGGESTIONS = [
  'Help me understand this problem',
  'Explain the n8n concept here',
  'Walk me through a different approach',
  'How do I set up this node?',
];

// Shown when the chat can't reach a live model (e.g. no API key on this deploy)
// or a request errors — the drawer degrades gracefully instead of breaking.
const UNCONFIGURED_REPLY =
  "Live answers aren’t switched on in this environment yet. For now: open any node to set it up step by step, tap the “?” glossary to see what each node does, and hit Run to watch your flow on real cases.";
const ERROR_REPLY = 'Iris hit a snag answering just now — please try again in a moment.';

// Right-hand chat drawer, opened from the nav-bar "Ask AI" button. Streams real
// answers from Iris (Claude) scoped to the current problem via `context`.
export function AskAiDrawer({ onClose, context, learnerName }) {
  const panelRef = useRef(null);
  const scrollRef = useRef(null);
  const [text, setText] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [messages, setMessages] = useState([]); // { role: 'user' | 'iris', text }

  useEffect(() => {
    if (panelRef.current) gsap.fromTo(panelRef.current, { xPercent: 100 }, { xPercent: 0, duration: 0.32, ease: 'power3.out' });
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Replace the text of the last (in-progress) Iris message.
  const setLastIris = (value) =>
    setMessages((m) => {
      const copy = [...m];
      for (let i = copy.length - 1; i >= 0; i--) {
        if (copy[i].role === 'iris') {
          copy[i] = { role: 'iris', text: value };
          break;
        }
      }
      return copy;
    });

  const send = async (value) => {
    const t = (value ?? text).trim();
    if (!t || streaming) return;
    const history = [...messages, { role: 'user', text: t }];
    setMessages([...history, { role: 'iris', text: '' }]); // user turn + empty Iris placeholder
    setText('');
    setStreaming(true);

    try {
      const res = await fetch('/api/ask-ai', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role === 'iris' ? 'assistant' : 'user', content: m.text })),
          context: context ?? {},
        }),
      });

      if (!res.ok || !res.body) {
        setLastIris(res.status === 503 ? UNCONFIGURED_REPLY : ERROR_REPLY);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      for (;;) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        acc += decoder.decode(chunk, { stream: true });
        setLastIris(acc);
      }
      if (!acc.trim()) setLastIris(ERROR_REPLY);
    } catch {
      setLastIris(ERROR_REPLY);
    } finally {
      setStreaming(false);
    }
  };

  const started = messages.length > 0;
  const greeting = learnerName ? `Hello ${learnerName}!` : 'Hello there!';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(1,24,69,0.35)', zIndex: 200, display: 'flex', justifyContent: 'flex-end' }} onClick={onClose}>
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        style={{ width: 460, maxWidth: '94%', height: '100%', background: 'var(--surface-0)', borderLeft: '1px solid var(--border-strong)', boxShadow: '-16px 0 46px rgba(1,24,69,0.18)', display: 'flex', flexDirection: 'column' }}
      >
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', flex: 'none' }}>
          <span style={{ width: 30, height: 30, flex: 'none' }}>
            <MascotPlayer clip="idle" once={false} onceDone={() => {}} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--fg-1)' }}>Ask Iris</div>
            <div style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>Your AI mentor</div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-2)', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {/* body */}
        <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {!started ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 22px 16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: 40 }}>
                <div style={{ width: 84, height: 84, marginBottom: 6 }}>
                  <MascotPlayer clip="hello" once={false} onceDone={() => {}} />
                </div>
                <div style={{ fontFamily: 'var(--font-headline)', fontSize: 30, fontWeight: 600, color: 'var(--fg-1)' }}>{greeting}</div>
                <div style={{ fontSize: 16, color: 'var(--fg-3)', marginTop: 6 }}>How can I help you today?</div>
              </div>

              <div style={{ flex: 1 }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start', textAlign: 'left', padding: '14px 15px', border: '1px solid var(--border-subtle)', background: 'var(--surface-0)', cursor: 'pointer', fontFamily: 'var(--font-body)', minHeight: 118 }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--brand-primary)'; e.currentTarget.style.background = 'var(--brand-blue-50, rgba(0,85,255,0.05))'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--surface-0)'; }}
                  >
                    <Lightbulb size={20} color="#ED7700" weight="regular" />
                    <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--fg-1)', lineHeight: 1.35 }}>{s}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ padding: '18px 18px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.map((m, i) => (m.role === 'user' ? (
                <div key={i} style={{ alignSelf: 'flex-end', maxWidth: '82%', background: 'var(--brand-primary)', color: 'var(--fg-on-brand, #fff)', padding: '10px 13px', fontSize: 13.5, lineHeight: 1.5 }}>{m.text}</div>
              ) : (
                <div key={i} style={{ alignSelf: 'flex-start', display: 'flex', gap: 9, maxWidth: '90%' }}>
                  <span style={{ width: 30, height: 30, flex: 'none' }}><MascotPlayer clip="idle" once={false} onceDone={() => {}} /></span>
                  <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', color: 'var(--fg-1)', padding: '10px 13px', fontSize: 13.5, lineHeight: 1.5 }}>
                    {m.text || (streaming ? 'Iris is thinking…' : '')}
                  </div>
                </div>
              )))}
            </div>
          )}
        </div>

        {/* input bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderTop: '1px solid var(--border-subtle)', flex: 'none' }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            placeholder={streaming ? 'Iris is replying…' : 'Ask anything…'}
            disabled={streaming}
            style={{ flex: 1, minWidth: 0, boxSizing: 'border-box', border: '1px solid var(--border-subtle)', background: 'var(--surface-0)', padding: '12px 14px', fontSize: 14, fontFamily: 'var(--font-body)', color: 'var(--fg-1)', opacity: streaming ? 0.6 : 1 }}
          />
          <button type="button" title="Voice — coming soon" style={{ width: 44, height: 44, flex: 'none', border: '1px solid var(--border-subtle)', background: 'var(--surface-0)', color: 'var(--fg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Microphone size={18} />
          </button>
          <button type="button" onClick={() => send()} disabled={streaming} aria-label="Send" style={{ width: 44, height: 44, flex: 'none', border: 'none', background: streaming ? 'var(--fg-3)' : 'var(--fg-1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: streaming ? 'default' : 'pointer' }}>
            <PaperPlaneRight size={18} weight="fill" />
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { X, BookOpen } from '@phosphor-icons/react';
import { NodeIcon, categoryMeta } from '../nodes/nodeIcons.js';

// A plain-language reference of every node the builder offers, grouped by the
// same categories as the palette. Opened from the nav-bar "?" button.
const GLOSSARY = [
  {
    category: 'trigger',
    nodes: [
      { type: 'trigger', name: 'New Email (Gmail Trigger)', desc: 'Starts the workflow the moment a new email lands in the connected inbox.' },
      { type: 'chat-trigger', name: 'On Chat Message', desc: 'Kicks off the flow when a user sends a chat message — the entry point for AI chatbots.' },
      { type: 'webhook', name: 'On Webhook Call', desc: 'Runs the flow whenever it receives an incoming HTTP request from another service.' },
      { type: 'schedule', name: 'On a Schedule', desc: 'Runs the flow on a timer — every few minutes, hourly, or once a day.' },
      { type: 'manual', name: 'Trigger Manually', desc: 'Runs the flow when you click Execute. Handy while testing.' },
    ],
  },
  {
    category: 'ai',
    nodes: [
      { type: 'classify', name: 'Classify with AI (AI Agent)', desc: 'An AI step that reads its input and returns a decision — here, the email’s category and urgency. Needs a Chat Model plugged into its bottom port.' },
    ],
  },
  {
    category: 'model',
    nodes: [
      { type: 'chat-gemini', name: 'Gemini Chat Model', desc: 'The language model that powers an AI node. It doesn’t run on its own — it plugs into the AI node’s Chat Model port.' },
    ],
  },
  {
    category: 'core',
    nodes: [
      { type: 'parse', name: 'Parse Result (Edit Fields)', desc: 'Turns the AI’s raw text into clean, structured fields the rest of the flow can route on.' },
      { type: 'switch', name: 'Switch', desc: 'Routes each item down a different branch based on rules you define.' },
      { type: 'if', name: 'If', desc: 'Splits the flow into true / false paths from a single condition.' },
      { type: 'code', name: 'Code', desc: 'Runs a snippet of custom JavaScript on the items passing through.' },
      { type: 'web-search', name: 'Web Search', desc: 'Looks up information on the web for the flow to use.' },
    ],
  },
  {
    category: 'action',
    nodes: [
      { type: 'action', name: 'Send Reply (Gmail — Send)', desc: 'Sends an email reply through the connected Gmail account.' },
      { type: 'slack-message', name: 'Slack — Send Message', desc: 'Posts a message to a Slack channel.' },
      { type: 'calendar-event', name: 'Google Calendar — Create Event', desc: 'Creates an event on a Google Calendar.' },
      { type: 'notion-page', name: 'Notion — Create Page', desc: 'Adds a new page to a Notion database.' },
      { type: 'google-docs', name: 'Google Docs — Create Document', desc: 'Creates or appends to a Google Doc.' },
    ],
  },
];

export function GlossaryDrawer({ onClose }) {
  const panelRef = useRef(null);
  useEffect(() => {
    if (panelRef.current) gsap.fromTo(panelRef.current, { xPercent: 100 }, { xPercent: 0, duration: 0.32, ease: 'power3.out' });
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(1,24,69,0.35)', zIndex: 200, display: 'flex', justifyContent: 'flex-end' }} onClick={onClose}>
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        style={{ width: 460, maxWidth: '92%', height: '100%', background: 'var(--surface-0)', borderLeft: '1px solid var(--border-strong)', boxShadow: '-16px 0 46px rgba(1,24,69,0.18)', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <BookOpen size={19} weight="fill" color="var(--brand-primary)" />
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: 16 }}>Node glossary</h4>
            <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 1 }}>Every node the builder offers, and what it does.</div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close glossary" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-2)', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '8px 20px 24px', overflowY: 'auto' }}>
          {GLOSSARY.map((group) => {
            const meta = categoryMeta[group.category];
            return (
              <div key={group.category} style={{ marginTop: 18 }}>
                <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: meta.color, fontWeight: 800, marginBottom: 10 }}>
                  {meta.label}
                </div>
                {group.nodes.map((n) => (
                  <div key={n.type} style={{ display: 'flex', gap: 12, padding: '11px 0', borderBottom: '1px solid var(--surface-1)' }}>
                    <span style={{ width: 34, height: 34, flex: 'none', borderRadius: 8, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <NodeIcon type={n.type} size={20} />
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-1)', marginBottom: 2 }}>{n.name}</div>
                      <div style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>{n.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

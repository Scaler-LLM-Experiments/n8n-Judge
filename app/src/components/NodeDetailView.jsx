import React from 'react';
import { X, CaretRight, Brain, CheckCircle, WarningCircle } from '@phosphor-icons/react';
import { nodeIcons, nodeIconColor, metaOf, nodeParams } from '../nodes/nodeIcons.js';

function Field({ children }) {
  return <div style={{ marginBottom: 16 }}>{children}</div>;
}

function Label({ children }) {
  return (
    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--fg-1)', marginBottom: 6 }}>
      {children}
    </label>
  );
}

function inputBox(extra) {
  return {
    border: '1px solid var(--border-subtle)',
    background: 'var(--surface-0)',
    padding: '8px 10px',
    fontSize: 12.5,
    color: 'var(--fg-1)',
    fontFamily: 'var(--font-body)',
    ...extra,
  };
}

function ConnectionField({ param, connectedModelType }) {
  const connected = Boolean(connectedModelType);
  const modelLabel = connectedModelType === 'chat-gemini' ? 'Gemini Chat Model' : 'a Chat Model';
  return (
    <Field>
      <Label>{param.label}</Label>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          border: `1px solid ${connected ? 'var(--status-success-border)' : 'var(--status-warning-border)'}`,
          background: connected ? 'var(--status-success-bg)' : 'var(--status-warning-bg)',
          padding: '9px 10px',
          fontSize: 12.5,
          fontWeight: 600,
          color: connected ? 'var(--status-success)' : 'var(--status-warning)',
        }}
      >
        {connected ? <CheckCircle size={15} weight="fill" /> : <WarningCircle size={15} weight="fill" />}
        {connected ? `Connected: ${modelLabel}` : 'Connect a Chat Model'}
      </div>
      {!connected ? (
        <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 5 }}>{param.hint}</div>
      ) : null}
    </Field>
  );
}

export function NodeDetailView({ node, studentGraph, onClose }) {
  if (!node) return null;

  const meta = metaOf(node.type);
  const Icon = nodeIcons[node.type];
  const iconColor = nodeIconColor[node.type] || meta.color;
  const params = nodeParams[node.type] || [];

  const connectedModelType = (() => {
    if (node.type !== 'classify') return null;
    const edge = studentGraph.edges.find((e) => e.target === node.id && e.targetHandle === 'ai_model');
    if (!edge) return null;
    const src = studentGraph.nodes.find((n) => n.id === edge.source);
    return src ? src.type : null;
  })();

  return (
    <div style={{ width: 320, flex: 'none', borderLeft: '1px solid var(--border-strong)', background: 'var(--surface-0)', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 24px rgba(1,24,69,0.05)' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ width: 36, height: 36, flex: 'none', borderRadius: 8, background: meta.tint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {Icon ? <Icon size={19} color={iconColor} /> : null}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: meta.color, fontWeight: 700 }}>
            {meta.label}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>{node.data.label}</div>
        </div>
        <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-3)' }}>
          <X size={16} />
        </button>
      </div>

      {/* tabs (cosmetic) */}
      <div style={{ display: 'flex', gap: 18, padding: '0 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        {['Parameters', 'Settings', 'Docs'].map((tab, i) => (
          <div
            key={tab}
            style={{
              padding: '11px 0',
              fontSize: 12.5,
              fontWeight: 600,
              color: i === 0 ? 'var(--brand-primary)' : 'var(--fg-3)',
              borderBottom: i === 0 ? '2px solid var(--brand-primary)' : '2px solid transparent',
              marginBottom: -1,
              cursor: 'default',
            }}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {params.map((param, idx) => {
          if (param.kind === 'connection') {
            return <ConnectionField key={idx} param={param} connectedModelType={connectedModelType} />;
          }
          if (param.kind === 'textarea') {
            return (
              <Field key={idx}>
                <Label>{param.label}</Label>
                <div style={inputBox({ whiteSpace: 'pre-wrap', lineHeight: 1.5, color: 'var(--fg-2)', minHeight: 40 })}>
                  {param.value}
                </div>
              </Field>
            );
          }
          if (param.kind === 'select') {
            return (
              <Field key={idx}>
                <Label>{param.label}</Label>
                <div style={inputBox({ display: 'flex', alignItems: 'center', justifyContent: 'space-between' })}>
                  <span>{param.value}</span>
                  <CaretRight size={13} color="var(--fg-3)" style={{ transform: 'rotate(90deg)' }} />
                </div>
              </Field>
            );
          }
          if (param.kind === 'rules') {
            return (
              <Field key={idx}>
                <Label>{param.label}</Label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {param.rules.map((rule, ri) => (
                    <div key={ri} style={{ border: '1px solid var(--border-subtle)', background: 'var(--surface-1)', padding: '8px 10px' }}>
                      <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 3 }}>
                        Output {ri} — <span style={{ color: 'var(--fg-1)', fontWeight: 600 }}>{rule.out}</span>
                      </div>
                      <div style={{ fontSize: 11.5, fontFamily: 'var(--font-mono, monospace)', color: 'var(--fg-2)' }}>{rule.expr}</div>
                    </div>
                  ))}
                </div>
              </Field>
            );
          }
          return (
            <Field key={idx}>
              <Label>{param.label}</Label>
              <div style={inputBox()}>{param.value}</div>
            </Field>
          );
        })}
      </div>

      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--fg-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Brain size={13} /> Preview — parameters are read-only in this prototype.
      </div>
    </div>
  );
}

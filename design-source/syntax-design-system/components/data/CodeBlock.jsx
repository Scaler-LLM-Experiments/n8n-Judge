import React from 'react';

const DARK = {
  bg: '#0F182F', fg: '#C9D2E3', bar: '#16213E', barBorder: 'rgba(255,255,255,0.08)',
  lang: '#82B0FF', file: '#8794AE', nums: '#5A6884', numsBg: '#0A1124', numsBorder: 'rgba(255,255,255,0.06)',
  copyBorder: 'rgba(255,255,255,0.16)', copyHover: 'rgba(255,255,255,0.06)', hl: 'rgba(61,130,255,0.10)', hlEdge: '#3D82FF',
  k: '#82B0FF', s: '#FFB47A', n: '#FFD27A', c: '#5A6884', f: '#8FE0B7', pn: '#C9D2E3',
};
const LIGHT = {
  bg: '#FAFAFA', fg: '#0C0C0C', bar: '#F0F0F0', barBorder: '#ECECEC', border: '#ECECEC',
  lang: '#0055FF', file: '#616161', nums: '#AAAAAA', numsBg: '#F5F5F5', numsBorder: '#ECECEC',
  copyBorder: '#D1D1D1', copyHover: '#EBF8FF', hl: 'rgba(0,85,255,0.07)', hlEdge: '#0055FF',
  k: '#0055FF', s: '#8A4F00', n: '#8B1B1B', c: '#AAAAAA', f: '#15663A', pn: '#262626',
};

const KEYWORDS = new Set('const let var function return if else for while await async export import from class new typeof in of try catch throw default extends super this null undefined true false void yield switch case break continue do public private static interface type enum'.split(' '));

// Lightweight, language-agnostic tokenizer — comments, strings, numbers,
// keywords, function calls. Honest about scope: it is a highlighter, not a parser.
function tokenizeLine(line, t, key) {
  const out = [];
  const re = /(\/\/[^\n]*|#[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d[\d_.]*\b)|([A-Za-z_$][\w$]*)(\s*\()?|([^\w\s]+)|(\s+)/g;
  let m, i = 0;
  while ((m = re.exec(line)) !== null) {
    let color, text = m[0];
    if (m[1]) color = t.c;
    else if (m[2]) color = t.s;
    else if (m[3]) color = t.n;
    else if (m[4] != null) {
      if (KEYWORDS.has(m[4])) color = t.k;
      else if (m[5]) { out.push(React.createElement('span', { key: key + '-' + i++, style: { color: t.f } }, m[4])); text = m[5]; color = t.pn; }
      else color = t.fg;
    } else if (m[6]) color = t.pn;
    else color = undefined;
    out.push(React.createElement('span', color ? { key: key + '-' + i++, style: { color } } : { key: key + '-' + i++ }, text));
  }
  return out.length ? out : '\u200b';
}

/**
 * CodeBlock — dark or light code surface with a language tag, optional filename,
 * line numbers, line highlights and a copy button. Sharp corners.
 * Highlighting is a lightweight token pass (keywords / strings / numbers /
 * comments / calls), not full language parsing — pass `highlight={false}` for raw.
 */
export function CodeBlock({ code = '', language, filename, theme = 'dark', showLineNumbers = true, highlightLines = [], highlight = true, wrap = false, copyable = true, style, ...rest }) {
  const t = theme === 'light' ? LIGHT : DARK;
  const [copied, setCopied] = React.useState(false);
  const lines = String(code).replace(/\n$/, '').split('\n');
  const hl = new Set(highlightLines);
  const doCopy = () => {
    try { navigator.clipboard.writeText(code); } catch (e) { /* noop */ }
    setCopied(true); setTimeout(() => setCopied(false), 1400);
  };
  return (
    <div style={{ background: t.bg, color: t.fg, fontFamily: 'var(--font-mono)', fontSize: 12.5, lineHeight: 1.6, border: theme === 'light' ? `1px solid ${t.border}` : 'none', overflow: 'hidden', ...style }} {...rest}>
      {(language || filename || copyable) ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: t.bar, borderBottom: `1px solid ${t.barBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0 }}>
            {language ? <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: t.lang }}>{language}</span> : null}
            {filename ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: t.file, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{filename}</span> : null}
          </div>
          {copyable ? (
            <button type="button" onClick={doCopy} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', border: `1px solid ${t.copyBorder}`, color: t.fg, padding: '4px 10px', fontFamily: 'var(--font-body)', fontSize: 11, cursor: 'pointer', borderRadius: 0, transition: 'background 120ms ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = t.copyHover; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
              {copied ? (
                <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square"><path d="M20 6 9 17l-5-5" /></svg>Copied</>
              ) : (
                <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><rect x="9" y="9" width="11" height="11" /><path d="M5 15V5h10" /></svg>Copy</>
              )}
            </button>
          ) : null}
        </div>
      ) : null}
      <div style={{ display: 'grid', gridTemplateColumns: showLineNumbers ? 'auto 1fr' : '1fr' }}>
        {showLineNumbers ? (
          <div style={{ padding: '14px 12px', textAlign: 'right', userSelect: 'none', color: t.nums, background: t.numsBg, borderRight: `1px solid ${t.numsBorder}` }}>
            {lines.map((_, i) => <div key={i} style={{ minHeight: '1.6em', background: hl.has(i + 1) ? t.hl : 'transparent' }}>{i + 1}</div>)}
          </div>
        ) : null}
        <div style={{ padding: '14px 0', overflowX: 'auto' }}>
          {lines.map((ln, i) => (
            <div key={i} style={{ minHeight: '1.6em', padding: '0 16px', whiteSpace: wrap ? 'pre-wrap' : 'pre', wordBreak: wrap ? 'break-word' : 'normal', background: hl.has(i + 1) ? t.hl : 'transparent', borderLeft: hl.has(i + 1) ? `2px solid ${t.hlEdge}` : '2px solid transparent', paddingLeft: 14 }}>
              {highlight ? tokenizeLine(ln, t, i) : (ln || '\u200b')}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

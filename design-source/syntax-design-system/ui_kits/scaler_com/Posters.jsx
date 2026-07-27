/* Posters.jsx — the signature starburst gradient row */
function Starburst({ from, to, noOutline = false }) {
  const id = 'g' + Math.random().toString(36).slice(2, 8);
  const d = 'M 623.75 197.828 L 763.636 57.942 L 940.058 234.366 L 800.175 374.25 L 998 374.25 L 998 623.75 L 800.172 623.75 L 940.058 763.636 L 763.636 940.058 L 623.75 800.172 L 623.75 998 L 374.25 998 L 374.25 800.172 L 234.366 940.058 L 57.942 763.636 L 197.828 623.75 L 0 623.75 L 0 374.25 L 197.825 374.25 L 57.942 234.366 L 234.366 57.942 L 374.25 197.825 L 374.25 0 L 623.75 0 L 623.75 197.828 Z';
  return (
    <svg viewBox="0 0 998 998" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${id})`} />
      {!noOutline && <path d={d} fill="none" stroke="#FFFFFF" strokeWidth="8" />}
    </svg>
  );
}

function Posters() {
  const posters = [
    { from: '#0055FF', to: '#C4FF00', label: 'Build for the future of work' },
    { from: '#0055FF', to: 'rgba(0,225,173,0.5)', label: 'Ship real AI systems' },
    { from: '#8000FF', to: 'rgba(119,81,255,0.4)', label: 'Learn with practitioners' },
    { from: '#ED7700', to: 'rgba(119,81,255,0.55)', label: 'Join a global cohort' },
  ];
  return (
    <div className="sc-posters">
      {posters.map((p, i) => (
        <div className="sc-poster" key={i}>
          <Starburst from={p.from} to={p.to} />
          <div className="noise" />
          <div className="lbl">{p.label}</div>
        </div>
      ))}
    </div>
  );
}

window.Posters = Posters;
window.Starburst = Starburst;

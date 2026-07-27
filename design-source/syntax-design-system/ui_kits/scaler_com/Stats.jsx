/* Stats.jsx — stat strip */
function Stats() {
  const stats = [
    { n: '13×',  l: 'Salary jumps across alumni' },
    { n: '189',  l: 'AI projects shipped this year' },
    { n: '100+', l: 'Engineers on faculty' },
  ];
  return (
    <section className="sc-section" style={{ padding: '32px 40px 96px', background: '#fff' }}>
      <div className="sc-stats">
        {stats.map((s, i) => (
          <div className="sc-stat" key={i}>
            <div className="sc-stat__n">{s.n}</div>
            <div className="sc-stat__l">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
window.Stats = Stats;

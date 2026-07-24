/* Programs.jsx — split panel with program list + wordmark poster */
function Programs({ active, onSelect }) {
  const programs = ['AI/ML', 'Software Development', 'DevOps', 'Cloud Computing', 'Data Science'];
  return (
    <section className="sc-section" style={{ padding: '96px 40px', background: '#fff' }}>
      <div className="sc-split">
        <div className="sc-split__panel sc-split__panel--left">
          <div className="sc-split__kicker" style={{ color: '#616161' }}>PROGRAMS</div>
          <div className="sc-programs">
            {programs.map(p => (
              <div key={p} className={`sc-program ${p === active ? 'active' : ''}`} onClick={() => onSelect(p)}>
                {p}
              </div>
            ))}
          </div>
        </div>
        <div className="sc-split__panel sc-split__panel--right">
          <div className="sc-split__kicker">SCALER&rsquo;S</div>
          <div className="sc-split__h">SCHOOL<br/>OF BUSINESS</div>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 18, lineHeight: 1.5, maxWidth: 440 }}>
            An MBA for builders. Product, leadership and capital — taught by operators who&rsquo;ve shipped.
          </p>
          <div className="sc-split__accent" />
        </div>
      </div>
    </section>
  );
}
window.Programs = Programs;

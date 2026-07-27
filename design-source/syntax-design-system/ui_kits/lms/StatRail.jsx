// Right-hand stat rail — RANK / ATTN / PSP tiles + weekly day-strip.
function StatRail() {
  const Icon = window.Icon;
  const stats = [
    { k: 'RANK', v: '#12', sub: 'of 150', dot: null },
    { k: 'ATTN.', v: '98%', sub: '120', dot: 'gold' },
    { k: 'PSP', v: '98%', sub: '120', dot: 'orange' },
  ];
  // each day: two stacked markers (top, bottom)
  const days = [
    { lbl: 'M', top: 'gold', bot: 'orange' },
    { lbl: 'T', top: 'dot', bot: 'empty' },
    { lbl: 'W', today: true, top: 'ring', bot: 'ring' },
    { lbl: 'T', top: 'empty', bot: 'empty' },
    { lbl: 'F', top: 'blue', bot: 'empty' },
    { lbl: 'S', top: 'empty', bot: 'empty' },
    { lbl: 'S', top: 'empty', bot: 'empty' },
  ];
  function marker(type) {
    if (type === 'gold') return <span className="mk gold"><Icon name="zap" size={12} /></span>;
    if (type === 'orange') return <span className="mk orange"><Icon name="flame" size={12} /></span>;
    if (type === 'ring') return <span className="mk ring" />;
    if (type === 'blue') return <span className="mk ring" style={{ background: 'var(--brand-primary)' }} />;
    if (type === 'dot') return <span className="mk gold"><Icon name="circle" size={6} /></span>;
    return <span className="mk empty" />;
  }
  return (
    <div className="statcard">
      <div className="stat-row">
        {stats.map((s) => (
          <div className="stat" key={s.k}>
            <div className="k">{s.k}</div>
            <div className="v">{s.v}</div>
            <div className="sub">
              {s.dot ? <span className={'dot ' + s.dot}><Icon name="circle" size={9} /></span> : null}
              {s.sub}
            </div>
          </div>
        ))}
      </div>
      <div className="statcard__divider" />
      <div className="daystrip">
        {days.map((d, i) => (
          <div key={i} className={'day' + (d.today ? ' is-today' : '')}>
            <span className="lbl">{d.lbl}</span>
            {marker(d.top)}
            {marker(d.bot)}
          </div>
        ))}
      </div>
    </div>
  );
}
window.StatRail = StatRail;

/* WhyScaler.jsx — feature cards */
function WhyScaler() {
  const items = [
    { icon: 'sparkles', title: 'AI‑integrated curriculum',
      body: 'AI is not a module bolted onto an existing syllabus. Every program is built around AI from the first week.' },
    { icon: 'infinity', title: 'Lifelong learning access',
      body: 'Your enrolment does not expire. Updated curriculum, alumni circles, new cohorts — yours forever.' },
    { icon: 'shield', title: 'Strong foundations',
      body: 'AI tools make average work easier. They do not replace the judgment that comes from deep fundamentals.' },
    { icon: 'layout', title: 'AI‑powered platform',
      body: 'Practice, review and debug with an AI pair that knows your cohort, your code, and your goals.' },
  ];
  return (
    <section className="sc-section" style={{ background: 'var(--brand-primary)', color: '#fff' }}>
      <div className="sc-section__head">
        <div className="sc-section__eyebrow" style={{ color: 'rgba(255,255,255,0.7)' }}>WHY SCALER</div>
        <h2 className="sc-section__title" style={{ color: '#fff' }}>
          Built different, designed to last.
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 18, marginTop: 16, maxWidth: 640 }}>
          Three things no other program gives you — and one thing we insist on.
        </p>
      </div>
      <div className="sc-articles">
        {items.map((it, i) => (
          <div className="sc-article" key={i}>
            <Icon name={it.icon} size={32} />
            <div>
              <div className="sc-article__title">{it.title}</div>
              <div className="sc-article__body">{it.body}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ maxWidth: 1160, margin: '32px auto 0', fontSize: 12, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.12em' }}>
        AI‑FIRST CURRICULUM BUILT BY 100+ ENGINEERS FROM MICROSOFT · AMAZON · OPENAI · META · GOOGLE
      </div>
    </section>
  );
}
window.WhyScaler = WhyScaler;

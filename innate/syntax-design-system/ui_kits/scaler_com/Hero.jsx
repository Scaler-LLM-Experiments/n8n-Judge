/* Hero.jsx — "Become an AI ready engineer" */
function Hero({ onApply }) {
  return (
    <section className="sc-hero">
      <div className="sc-hero__inner">
        <div className="sc-hero__eyebrow">The market has already changed</div>
        <h1 className="sc-hero__title">
          Become an <em>AI ready</em> software engineer
        </h1>
        <p className="sc-hero__sub">
          Learn to build real‑world systems, work with AI copilots, and stay ahead
          in a world where coding is no longer enough.
        </p>
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          <button className="btn btn--primary btn--lg" onClick={onApply}>Apply now</button>
          <button className="btn btn--outline btn--lg">See the curriculum</button>
        </div>
      </div>
    </section>
  );
}
window.Hero = Hero;

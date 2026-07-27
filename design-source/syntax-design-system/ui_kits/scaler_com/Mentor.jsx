/* Mentor.jsx — mentor hero card */
function Mentor() {
  return (
    <section className="sc-section" style={{ padding: '40px 40px 96px', background: '#fff' }}>
      <div className="sc-mentor">
        <div className="sc-mentor__body">
          <div className="sc-mentor__eyebrow">YOUR MENTOR</div>
          <div className="sc-mentor__name">Rahul Sriram</div>
          <div className="sc-mentor__role">
            <span>Head of Engineering at</span>
            <img className="logo" src="../../assets/brand-mark-sample.png" alt="" />
          </div>
          <div className="sc-mentor__meta">24 years of experience</div>
          <div className="sc-mentor__meta">Building a stealth fin‑tech startup</div>
          <div style={{ marginTop: 16 }}>
            <button className="btn btn--outline btn--lg">Know more →</button>
          </div>
        </div>
        <div className="sc-mentor__photo" aria-label="Rahul Sriram, photo" />
      </div>
    </section>
  );
}
window.Mentor = Mentor;

/* ApplyCTA.jsx — bottom CTA + footer */
function ApplyCTA({ onApply }) {
  return (
    <section className="sc-section" style={{ background: '#fff', padding: '32px 40px 96px' }}>
      <div className="sc-apply">
        <div className="sc-apply__eyebrow">APPLY NOW</div>
        <div className="sc-apply__title">Scaler Academy</div>
        <p className="sc-apply__sub">
          Learn to build real‑world systems, work with AI copilots, and stay ahead
          in a world where coding is no longer enough.
        </p>
        <div>
          <button className="btn btn--white btn--xl" onClick={onApply}>Apply now</button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="sc-footer">
      <div className="sc-footer__grid">
        <div className="sc-footer__brand">
          <img src="../../assets/logo-white.svg" alt="Scaler" style={{ height: 20 }} />
          <p>An AI‑forward learning brand. We build software engineers, data scientists and operators for the decade ahead.</p>
        </div>
        <div>
          <h6>Programs</h6>
          <ul><li>Academy</li><li>School of Business</li><li>AI/ML</li><li>DevOps</li><li>Data Science</li></ul>
        </div>
        <div>
          <h6>Company</h6>
          <ul><li>About</li><li>Careers</li><li>Press</li><li>Blog</li></ul>
        </div>
        <div>
          <h6>Resources</h6>
          <ul><li>Events</li><li>Masterclass</li><li>Alumni</li><li>Podcast</li></ul>
        </div>
        <div>
          <h6>Contact</h6>
          <ul><li>hello@scaler.com</li><li>+91 80 4718 7999</li><li>Bengaluru</li></ul>
        </div>
      </div>
      <div className="sc-footer__legal">
        <div>© 2026 Scaler. All rights reserved.</div>
        <div>Privacy  ·  Terms  ·  Cookies</div>
      </div>
    </footer>
  );
}

window.ApplyCTA = ApplyCTA;
window.Footer = Footer;

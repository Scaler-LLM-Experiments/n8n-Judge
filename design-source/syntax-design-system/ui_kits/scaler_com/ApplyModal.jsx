/* ApplyModal.jsx — scaler.com apply modal (kit-local; renamed from Modal to
   avoid colliding with the system component components/overlay/Modal.jsx) */
function ApplyModal({ open, onClose }) {
  const [step, setStep] = React.useState(0);
  const [program, setProgram] = React.useState('AI/ML');
  React.useEffect(() => { if (!open) setStep(0); }, [open]);
  return (
    <div className={`sc-modal-overlay ${open ? 'open' : ''}`} onClick={onClose}>
      <div className="sc-modal" onClick={e => e.stopPropagation()}>
        {step === 0 ? (
          <>
            <div className="sc-modal__eyebrow">APPLICATION · STEP 1 / 2</div>
            <h3 className="sc-modal__title">Tell us about you.</h3>
            <p className="sc-modal__body">A short form. Two minutes. Our admissions team will reach out within a business day.</p>
            <div className="sc-modal__field"><label>Full name</label><input placeholder="e.g. Priya Nair" /></div>
            <div className="sc-modal__field"><label>Work email</label><input placeholder="you@company.com" /></div>
            <div className="sc-modal__field"><label>Phone</label><input placeholder="+91" /></div>
            <div className="sc-modal__row" style={{ marginTop: 24, justifyContent:'flex-end', gap: 12 }}>
              <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn--primary btn--lg" onClick={() => setStep(1)}>Continue</button>
            </div>
          </>
        ) : (
          <>
            <div className="sc-modal__eyebrow">APPLICATION · STEP 2 / 2</div>
            <h3 className="sc-modal__title">Pick a program.</h3>
            <p className="sc-modal__body">Choose the program you&rsquo;d like to apply for. You can change this later with your counsellor.</p>
            <div className="sc-modal__field">
              <label>Program</label>
              <select value={program} onChange={e => setProgram(e.target.value)}>
                <option>AI/ML</option>
                <option>Software Development</option>
                <option>DevOps</option>
                <option>Cloud Computing</option>
                <option>Data Science</option>
              </select>
            </div>
            <div className="sc-modal__field"><label>Years of experience</label><input placeholder="0–3" /></div>
            <div className="sc-modal__row" style={{ marginTop: 24, justifyContent:'flex-end', gap: 12 }}>
              <button className="btn btn--ghost" onClick={() => setStep(0)}>Back</button>
              <button className="btn btn--primary btn--lg" onClick={onClose}>Submit application</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
window.ApplyModal = ApplyModal;

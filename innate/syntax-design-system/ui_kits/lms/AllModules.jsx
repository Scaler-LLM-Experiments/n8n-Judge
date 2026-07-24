// All Modules view — accordion of modules; open module shows lessons + certification.
function Metric({ label, value, muted, lock }) {
  const Icon = window.Icon;
  return (
    <div className="metric">
      <div className="ml">{lock ? <Icon name="lock" size={12} /> : null}{label}</div>
      <div className={'mv' + (muted ? ' muted' : '')}>
        {!muted ? <Icon name="check" size={13} /> : null}{value}
      </div>
    </div>
  );
}

function LessonRow({ l, onOpen }) {
  const Icon = window.Icon;
  return (
    <div className={'lesson' + (l.current ? ' is-current' : '')} onClick={onOpen}>
      <div className="lesson__date"><div className="m">NOV</div><div className="d">{l.date}</div></div>
      <div className="lesson__title">{l.n}. {l.title}</div>
      <div className="lesson__metrics">
        <Metric label="Live Class" value={l.live} />
        <Metric label="Assignments" value={l.assign} />
        <Metric label={l.proj ? 'Projects' : 'Practice'} value={l.practice} lock={l.proj} />
      </div>
      <span className="lesson__chev"><Icon name="chevron-right" size={18} /></span>
    </div>
  );
}

function ModuleCertification({ onOpen }) {
  const Icon = window.Icon;
  return (
    <div>
      <div className="cert-head">
        <h3>Module Certification</h3>
        <p>Completing the mandatory items is important to unlock your jobs.</p>
      </div>
      <div className="cert">
        <div className="cert__icon"><Icon name="lock" size={18} /></div>
        <div className="cert__body">
          <div className="cert__titlerow">
            <span className="cert__title">Databases &amp; SQL Mandatory Skill Test</span>
            <span className="chip status-up"><Icon name="clock" size={13} /> Upcoming</span>
          </div>
          <div className="cert__chips">
            <span className="chip"><Icon name="code" size={13} /> Skill Test</span>
            <span className="chip"><Icon name="clock" size={13} /> 120 Mins</span>
          </div>
        </div>
        <button className="btn btn--primary" onClick={onOpen}>Start Test <Icon name="arrow-up-right" size={15} /></button>
      </div>
      <div className="cert">
        <div className="cert__icon locked"><Icon name="lock" size={18} /></div>
        <div className="cert__body">
          <div className="cert__titlerow">
            <span className="cert__title muted">Data Structures &amp; Algorithm</span>
            <span className="chip status-lock"><Icon name="lock" size={13} /> Locked</span>
          </div>
          <div className="cert__chips">
            <span className="chip"><Icon name="code" size={13} /> Mock Interview</span>
            <span className="chip"><Icon name="clock" size={13} /> 120 Mins</span>
            <span className="chip"><img src={window.LMS_MASCOT} alt="" style={{ width: 14, height: 14 }} /> Taken by Companion</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModuleHead({ m, open, onToggle }) {
  const Icon = window.Icon;
  return (
    <div
      className={'acc__head' + (open ? ' is-open' : '') + (m.locked ? ' is-locked' : '')}
      onClick={() => !m.locked && onToggle()}
    >
      <span className="acc__chev"><Icon name={m.locked ? 'lock' : 'chevron-right'} size={18} /></span>
      <span className="acc__title">{m.title}</span>
      <span className="acc__spacer" />
      {m.locked ? (
        <span className="acc__meta"><span className="m"><Icon name="calendar" size={15} /> —</span><span className="sep" /><span className="m"><Icon name="code" size={15} /> —</span></span>
      ) : (
        <span className="acc__meta">
          <span className="m"><Icon name="calendar" size={15} /> Attendance: {m.attn}</span>
          <span className="sep" />
          <span className="m"><Icon name="code" size={15} /> PSP: {m.psp}</span>
        </span>
      )}
    </div>
  );
}

function AllModules({ onOpen }) {
  const [open, setOpen] = React.useState('m3');
  const lessons = [
    { n: 1, date: '16', title: 'Intermediate DSA: Arrays – Prefix Sum', live: '100%', assign: '10/10', practice: '6/6' },
    { n: 2, date: '17', title: 'Intermediate DSA: Arrays – Prefix Sum', live: '100%', assign: '10/10', practice: '6/6' },
    { n: 3, date: '18', title: 'Advanced Graph Theory: Shortest Paths', live: '85%', assign: '5/5', practice: '8/8' },
    { n: 4, date: '19', title: 'Dynamic Programming Basics', live: '90%', assign: '7/7', practice: '9/9' },
    { n: 5, date: '20', title: 'Tree Data Structures: Traversals', live: '95%', assign: '12/12', practice: '10/10' },
    { n: 6, date: '21', title: 'Graph Theory Basics: BFS & DFS', live: '88%', assign: '8/10', practice: '3/5', proj: true, current: true },
    { n: 7, date: '22', title: 'Sorting Algorithms: QuickSort & MergeSort', live: '92%', assign: '9/10', practice: '7/8' },
    { n: 8, date: '23', title: 'Sorting Algorithms: QuickSort & MergeSort', live: '85%', assign: '6/7', practice: '4/6', proj: true },
    { n: 9, date: '24', title: 'Dynamic Programming Fundamentals', live: '90%', assign: '10/10', practice: '8/9' },
    { n: 10, date: '25', title: 'Hash Tables and Hashing Techniques', live: '87%', assign: '7/8', practice: '5/7', proj: true },
  ];
  const modules = [
    { id: 'm1', title: 'Module 1: Coding Basics', attn: '60%', psp: '60%' },
    { id: 'm2', title: 'Module 2: Coding Basics', attn: '60%', psp: '60%' },
    { id: 'm3', title: 'Module 3: Linked Lists', attn: '60%', psp: '60%' },
    { id: 'm4', title: 'Module 4: Coding Basics', attn: '60%', psp: '60%' },
    { id: 'm5', title: 'Module 5: Coding Basics', attn: '60%', psp: '60%' },
    { id: 'm6', title: 'Module 6: Coding Basics', attn: '60%', psp: '60%' },
    { id: 'm7', title: 'Module 7: Coding Basics', locked: true },
    { id: 'm8', title: 'Module 8: Coding Basics', locked: true },
  ];
  return (
    <div className="acc fade-in">
      {modules.map((m) => (
        <div key={m.id}>
          <ModuleHead m={m} open={open === m.id} onToggle={() => setOpen(open === m.id ? null : m.id)} />
          {open === m.id && !m.locked ? (
            <div className="acc__body">
              {lessons.map((l) => <LessonRow key={l.n} l={l} onOpen={onOpen} />)}
              <ModuleCertification onOpen={onOpen} />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
window.AllModules = AllModules;

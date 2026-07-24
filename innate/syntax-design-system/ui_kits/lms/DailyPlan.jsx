// Daily Plan view — To-Do banner + timeline of task cards.
const MENTOR_AV = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces';

function TaskCard({ task, onOpen }) {
  const Icon = window.Icon;
  const active = task.active;
  return (
    <div className={'task' + (active ? ' is-active' : '')}>
      <div className="task__thumbwrap">
        <div className={'task__thumb' + (active ? ' blue' : '')}>
          {task.img
            ? <img src={task.img} alt="" />
            : <Icon name={active ? 'users' : 'book-open'} size={26} />}
        </div>
        {task.kind ? <span className="task__kind">{task.kind}</span> : null}
      </div>
      <div className="task__body">
        <h4 className="task__title">{task.title}</h4>
        <p className="task__desc">{task.desc}</p>
        <div className="task__meta">
          {task.meta.map((m, i) => (
            <span className="m" key={i}><Icon name={m.icon} size={15} /> {m.label}</span>
          ))}
          <span className="m"><img src={MENTOR_AV} alt="" /> By Anshuman Singh</span>
        </div>
      </div>
      <div className="task__cta">
        {active
          ? <button className="btn btn--primary" onClick={onOpen}>Start Quiz <Icon name="arrow-up-right" size={15} /></button>
          : <button className="btn btn--outline" onClick={onOpen}>Start Reading <Icon name="arrow-up-right" size={15} /></button>}
      </div>
    </div>
  );
}

function Timeline({ rows, showNow, onOpen }) {
  return (
    <div className="timeline">
      {showNow ? (
        <div className="tl-row">
          <div className="tl-time" />
          <div className="tl-rail"><span className="tl-node is-active" /></div>
          <div className="tl-cell"><span className="tl-now-tag"><span className="now">Now</span><span className="t">7:40 AM</span></span></div>
        </div>
      ) : null}
      {rows.map((r, i) => (
        <div className="tl-row" key={i}>
          <div className={'tl-time' + (r.task.active ? ' is-now' : '')}>
            <div className="h">{r.time}</div>
            <div className="ap">{r.ap}</div>
          </div>
          <div className="tl-rail"><span className={'tl-node' + (r.task.active ? ' is-active' : '')} /></div>
          <div className="tl-cell"><TaskCard task={r.task} onOpen={onOpen} /></div>
        </div>
      ))}
    </div>
  );
}

function DailyPlan({ onOpen }) {
  const Icon = window.Icon;
  const readMeta = [{ icon: 'book-open', label: '10 Min Read' }, { icon: 'help-circle', label: '6 Quizes' }];
  const rows = [
    { time: '08:00', ap: 'PM', task: { active: true, kind: 'Pre-Read', title: 'Sliding Window — Core Patterns', desc: 'This quiz is to help us personalise the dashboard.', meta: [{ icon: 'file-text', label: '5 Questions' }, { icon: 'clock', label: '2 mins' }] } },
    { time: '09:00', ap: 'PM', task: { title: 'Arrays & Prefix Sums', desc: 'This quiz is to help us personalise the dashboard experience for you', meta: readMeta } },
    { time: '10:00', ap: 'PM', task: { title: 'Two Pointers, In Depth', desc: 'This quiz is to help us personalise the dashboard experience for you', meta: readMeta } },
    { time: '11:00', ap: 'PM', task: { title: 'Hashing for Lookups', desc: 'This quiz is to help us personalise the dashboard experience for you', meta: readMeta } },
  ];
  const rows2 = [
    { time: '08:00', ap: 'PM', task: { title: 'Linked List Traversal', desc: 'This quiz is to help us personalise the dashboard experience for you', meta: readMeta } },
    { time: '08:00', ap: 'PM', task: { title: 'Detecting Cycles', desc: 'This quiz is to help us personalise the dashboard experience for you', meta: readMeta } },
  ];
  return (
    <div className="fade-in">
      <div className="todo-banner">
        <span className="todo-banner__title">To-Dos for 4th May</span>
        <span className="todo-banner__spacer" />
        <span className="todo-banner__meta">
          <span className="m"><Icon name="shuffle" size={15} /> Onboarding</span>
          <span className="sep" />
          <span className="m"><Icon name="list" size={15} /> 5 Tasks</span>
        </span>
      </div>
      <Timeline rows={rows} showNow onOpen={onOpen} />
      <div className="todo-banner dark" style={{ marginTop: 28 }}>
        <span className="todo-banner__title">To-Dos for 5th May</span>
        <span className="todo-banner__spacer" />
        <span className="todo-banner__meta">
          <span className="m"><Icon name="shuffle" size={15} /> Onboarding</span>
          <span className="sep" />
          <span className="m"><Icon name="list" size={15} /> 5 Tasks</span>
        </span>
      </div>
      <Timeline rows={rows2} onOpen={onOpen} />
    </div>
  );
}
window.DailyPlan = DailyPlan;

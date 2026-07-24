// LMS chrome — top nav, left icon rail, floating plan toggle. Sharp / zero-radius.
const MASCOT = '../../assets/companion-mascot.svg';
const AVATAR = 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=120&h=120&fit=crop&crop=faces';

function TopNav() {
  const Icon = window.Icon;
  return (
    <header className="topnav">
      <div className="topnav__logo">
        <img src="../../assets/logo-colour.svg" alt="Scaler" />
      </div>
      <button className="switch-view"><Icon name="shuffle" size={15} /> Switch to old view</button>
      <div className="topnav__search">
        <span className="mag"><Icon name="search" size={16} /></span>
        <input placeholder="Search content, community, mentors…" />
        <span className="kbd">⌘K</span>
      </div>
      <div className="topnav__right">
        <button className="icon-btn" aria-label="Notifications"><Icon name="bell" size={19} /><span className="pip" /></button>
        <div className="topnav__me"><img src={AVATAR} alt="Kishan" /> Kishan</div>
        <button className="companion-btn"><img src={MASCOT} alt="" /> Companion</button>
      </div>
    </header>
  );
}

function IconRail({ active = 'plan', onNavigate }) {
  const Icon = window.Icon;
  const items = [
    { id: 'panel', icon: 'panel-left' },
    { id: 'plan', icon: 'workflow' },
    { id: 'modules', icon: 'list' },
    { id: 'chat', icon: 'message-circle' },
    { id: 'jobs', icon: 'briefcase' },
    { id: 'wallet', icon: 'ticket' },
    { id: 'news', icon: 'megaphone' },
    { id: 'explore', icon: 'globe' },
    { id: 'learn', icon: 'graduation-cap' },
    { id: 'rewards', icon: 'gift' },
    { id: 'support', icon: 'headset' },
  ];
  return (
    <nav className="rail">
      {items.map((it, i) => (
        <React.Fragment key={it.id}>
          {i === 1 ? <div className="rail__sep" /> : null}
          <div
            className={'rail__item' + (active === it.id ? ' is-active' : '')}
            onClick={() => onNavigate && onNavigate(it.id)}
            title={it.id}
          >
            <Icon name={it.icon} size={20} />
          </div>
        </React.Fragment>
      ))}
    </nav>
  );
}

function PlanToggle({ view, onChange }) {
  const Icon = window.Icon;
  return (
    <div className="plan-toggle">
      <button className={view === 'daily' ? 'is-active' : ''} onClick={() => onChange('daily')}>
        <Icon name="calendar" size={16} /> Daily Plan
      </button>
      <button className={view === 'modules' ? 'is-active' : ''} onClick={() => onChange('modules')}>
        <Icon name="layout-grid" size={16} /> All Modules
      </button>
    </div>
  );
}

window.TopNav = TopNav;
window.IconRail = IconRail;
window.PlanToggle = PlanToggle;
window.LMS_MASCOT = MASCOT;

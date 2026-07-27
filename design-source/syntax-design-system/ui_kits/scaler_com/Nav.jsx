/* Nav.jsx — sticky top global nav */
const { useState } = React;

function Icon({ name, size = 16, stroke = 'currentColor', strokeWidth = 2 }) {
  const paths = {
    'chevron-down': 'M6 9l6 6 6-6',
    'arrow-right': 'M5 12h14 M12 5l7 7-7 7',
    'plus': 'M5 12h14 M12 5v14',
    'menu': 'M3 6h18 M3 12h18 M3 18h18',
    'x': 'M18 6 6 18 M6 6l12 12',
    'sparkles': 'm12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z',
    'shield': 'M12 22s-8-4.5-8-11.8A5.5 5.5 0 0 1 12 3a5.5 5.5 0 0 1 8 7.2c0 7.3-8 11.8-8 11.8',
    'book-open': 'M12 7v14 M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z',
    'layout': 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
    'infinity': 'M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.739-8',
    'users': 'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
    'star': 'M12 2l2.4 7.4h7.6l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z',
    'check': 'M20 6 9 17l-5-5',
  };
  const extras = { users: <circle cx="8.5" cy="7" r="4" fill="none" stroke={stroke} strokeWidth={strokeWidth} /> };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter">
      {extras[name]}
      {(paths[name] || '').split(' M ').map((d, i) =>
        <path key={i} d={(i === 0 ? d : 'M ' + d)} />)}
    </svg>
  );
}

function Nav({ onApply }) {
  return (
    <nav className="sc-nav">
      <div className="sc-nav__logo">
        <img src="../../assets/logo-colour.svg" alt="Scaler" />
      </div>
      <div className="sc-nav__menu">
        <div className="sc-nav__item">Programs <Icon name="chevron-down" size={12} /></div>
        <div className="sc-nav__item">Masterclass</div>
        <div className="sc-nav__item">AI Labs</div>
        <div className="sc-nav__item">Alumni</div>
        <div className="sc-nav__item">Resources <Icon name="chevron-down" size={12} /></div>
      </div>
      <div className="sc-nav__cta">
        <button className="btn btn--outline">Login</button>
        <button className="btn btn--primary" onClick={onApply}>Talk to an advisor</button>
      </div>
    </nav>
  );
}

window.Nav = Nav;
window.Icon = Icon;

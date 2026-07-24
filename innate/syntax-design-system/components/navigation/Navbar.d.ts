import * as React from 'react';

export interface NavLink {
  label: React.ReactNode;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  /** Current page — renders in brand blue. */
  active?: boolean;
  /** Show a dropdown caret after the label. */
  caret?: boolean;
}

/**
 * Top app chrome — 60px white bar with a 1px bottom rule, logo, nav links and
 * a right-hand actions slot. Sharp corners.
 */
export interface NavbarProps {
  /** Logo node. Defaults to the SCALER wordmark. */
  logo?: React.ReactNode;
  links?: NavLink[];
  /** Right-aligned content — buttons, icon buttons, avatar. */
  actions?: React.ReactNode;
  /** Pin to the top of the viewport on scroll. */
  sticky?: boolean;
  style?: React.CSSProperties;
}

export function Navbar(props: NavbarProps): JSX.Element;

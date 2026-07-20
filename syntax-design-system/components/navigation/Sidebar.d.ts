import * as React from 'react';

export interface SidebarItem {
  label?: React.ReactNode;
  icon?: React.ReactNode;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  active?: boolean;
  /** Trailing count chip. */
  badge?: React.ReactNode;
  /** Render as a tracked section heading instead of a nav row. */
  section?: boolean;
}

/**
 * Persistent vertical navigation rail with optional header (logo) and footer.
 */
export interface SidebarProps {
  items: SidebarItem[];
  /** Top slot — usually a logo. */
  header?: React.ReactNode;
  /** Bottom slot — usually account / settings. */
  footer?: React.ReactNode;
  /** Icon-only 68px rail. */
  collapsed?: boolean;
  /** Expanded width in px. Default 248. */
  width?: number;
  style?: React.CSSProperties;
}

export function Sidebar(props: SidebarProps): JSX.Element;

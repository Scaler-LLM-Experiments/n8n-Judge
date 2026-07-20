import * as React from 'react';

export interface MenuItemSpec {
  label?: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  /** Render in danger red (e.g. Delete). */
  danger?: boolean;
  disabled?: boolean;
  /** Render a separator rule instead of an item. */
  divider?: boolean;
}

/**
 * Dropdown action list anchored to a trigger.
 */
export interface MenuProps {
  /** The clickable anchor (e.g. an IconButton). */
  trigger: React.ReactNode;
  items: MenuItemSpec[];
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
  /** Min width in px. Default 200. */
  width?: number;
  style?: React.CSSProperties;
}

export function Menu(props: MenuProps): JSX.Element;

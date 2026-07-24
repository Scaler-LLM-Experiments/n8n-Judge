import * as React from 'react';

/**
 * Edge-anchored sliding panel over a scrim.
 */
export interface DrawerProps {
  open: boolean;
  onClose?: () => void;
  /** Edge it anchors to. Default `right`. */
  side?: 'left' | 'right' | 'top' | 'bottom';
  /** Panel width (left/right) or height (top/bottom) in px. Default 380. */
  width?: number;
  title?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Drawer(props: DrawerProps): JSX.Element | null;

import * as React from 'react';

export interface SplitMenuItem {
  label?: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
}

/**
 * A primary action joined to a caret that opens a menu of secondary actions.
 * Shared collapsed border, sharp corners.
 */
export interface SplitButtonProps {
  children: React.ReactNode;
  /** Primary action handler. */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** Secondary actions (Menu shape). */
  items: SplitMenuItem[];
  variant?: 'primary' | 'black' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  /** Min width of the dropdown in px. Default 200. */
  menuWidth?: number;
  style?: React.CSSProperties;
}

export function SplitButton(props: SplitButtonProps): JSX.Element;

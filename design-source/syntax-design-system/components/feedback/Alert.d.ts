import * as React from 'react';

/**
 * Inline, persistent status banner. Soft tint + hairline, sharp corners.
 */
export interface AlertProps {
  tone?: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
  title?: React.ReactNode;
  /** Body copy. */
  children?: React.ReactNode;
  /** Override the leading glyph; pass null to remove it. */
  icon?: React.ReactNode;
  /** Show a dismiss button wired to this handler. */
  onClose?: () => void;
  /** Trailing action node (e.g. a Button). */
  action?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Alert(props: AlertProps): JSX.Element;

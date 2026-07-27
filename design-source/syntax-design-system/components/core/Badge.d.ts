import * as React from 'react';

export interface BadgeProps {
  /** Color tone, mapped to the system status palette. */
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
  /** Solid brand-blue fill (ignores tone) for high-emphasis labels. */
  solid?: boolean;
  /** Optional leading icon node (Lucide, 12–14px). */
  icon?: React.ReactNode;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/** Small status / category label. Sharp rectangle. */
export function Badge(props: BadgeProps): JSX.Element;

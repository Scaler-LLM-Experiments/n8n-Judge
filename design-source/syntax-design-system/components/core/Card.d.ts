import * as React from 'react';

/**
 * Surface primitive — 1px hairline border, no drop shadow, zero radius.
 */
export interface CardProps {
  /** Surface background. deep = navy panel with inverse text. */
  tone?: 'default' | 'soft' | 'blue' | 'deep';
  /** Adds hover border-darken + soft lift for clickable cards. */
  interactive?: boolean;
  /** Inner padding in px. Default 24. */
  padding?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Card(props: CardProps): JSX.Element;

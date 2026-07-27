import * as React from 'react';

/**
 * Flat, square progress bar. Determinate or indeterminate.
 */
export interface ProgressProps {
  /** 0–100. Ignored when `indeterminate`. */
  value?: number;
  /** Unknown-length work — animates a moving segment. */
  indeterminate?: boolean;
  /** Caption above the track. */
  label?: React.ReactNode;
  /** Print the percentage above the track. */
  showValue?: boolean;
  /** Track height in px. Default 6. */
  height?: number;
  tone?: 'brand' | 'success' | 'warning' | 'danger';
  style?: React.CSSProperties;
}

export function Progress(props: ProgressProps): JSX.Element;

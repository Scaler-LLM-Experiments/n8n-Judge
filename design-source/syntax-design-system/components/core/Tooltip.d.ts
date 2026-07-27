import * as React from 'react';

/**
 * Small hover/focus hint anchored to its child. Dark navy, sharp corners.
 */
export interface TooltipProps {
  /** Hint text/content. */
  content: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Open delay in ms. Default 120. */
  delay?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Tooltip(props: TooltipProps): JSX.Element;

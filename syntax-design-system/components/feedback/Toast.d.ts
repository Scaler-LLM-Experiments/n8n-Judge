import * as React from 'react';

/**
 * A single transient notification. Navy card, status-coloured edge, sharp
 * corners. Presentational — usually rendered via ToastStack.
 */
export interface ToastProps {
  tone?: 'info' | 'success' | 'warning' | 'danger';
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Dismiss handler; renders a close button when provided. */
  onClose?: () => void;
  style?: React.CSSProperties;
}

export function Toast(props: ToastProps): JSX.Element;

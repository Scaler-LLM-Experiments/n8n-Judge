import * as React from 'react';

export interface ToastItem {
  id: string | number;
  tone?: 'info' | 'success' | 'warning' | 'danger';
  title?: React.ReactNode;
  description?: React.ReactNode;
}

/**
 * Fixed-position container that stacks a controlled array of toasts in a corner.
 */
export interface ToastStackProps {
  toasts: ToastItem[];
  /** Called with the dismissed toast's id. */
  onDismiss?: (id: string | number) => void;
  placement?: 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center';
  style?: React.CSSProperties;
}

export function ToastStack(props: ToastStackProps): JSX.Element;

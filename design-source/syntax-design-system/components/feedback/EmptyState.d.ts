import * as React from 'react';

/**
 * No-data / no-results / first-run pause. Square icon frame, restrained copy.
 */
export interface EmptyStateProps {
  /** Lucide glyph node (~24px). */
  icon?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Optional action node (e.g. a Button). */
  action?: React.ReactNode;
  align?: 'center' | 'left';
  style?: React.CSSProperties;
}

export function EmptyState(props: EmptyStateProps): JSX.Element;

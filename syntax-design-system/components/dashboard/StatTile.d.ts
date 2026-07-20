import * as React from 'react';

export interface StatTileProps {
  label: React.ReactNode;
  value: React.ReactNode;
  /** Secondary line under the value (e.g. "of 150"). */
  sub?: React.ReactNode;
  /** Change indicator (e.g. "8 this week"). */
  delta?: React.ReactNode;
  deltaDir?: 'up' | 'down';
  align?: 'left' | 'center';
  style?: React.CSSProperties;
}

/**
 * Dashboard metric tile — uppercase label + large numeral + optional delta.
 */
export function StatTile(props: StatTileProps): JSX.Element;

import * as React from 'react';

export interface ListItemSpec {
  id?: string | number;
  /** Main line. */
  primary?: React.ReactNode;
  /** Secondary line under the primary. */
  secondary?: React.ReactNode;
  /** Leading glyph / avatar node. */
  leading?: React.ReactNode;
  /** Trailing node (chevron, switch, button). */
  trailing?: React.ReactNode;
  /** Right-aligned muted metadata (date, count). */
  meta?: React.ReactNode;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  selected?: boolean;
  disabled?: boolean;
  /** Replace the row body entirely. */
  render?: (item: ListItemSpec, i: number) => React.ReactNode;
}

/**
 * Vertical item-row list with hairline separators and sharp corners.
 */
export interface ListProps {
  items: ListItemSpec[];
  size?: 'sm' | 'md';
  /** Wrap in a 1px hairline border + surface. Default true. */
  bordered?: boolean;
  /** Hairline rule between rows. Default true. */
  divided?: boolean;
  style?: React.CSSProperties;
}

export function List(props: ListProps): JSX.Element;

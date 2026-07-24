import * as React from 'react';

export interface StatProps {
  /** The numeral, shown large. e.g. "13×", "189", "24". */
  value: React.ReactNode;
  /** Supporting label beneath the number. */
  label?: React.ReactNode;
  /** Numeral font-size in px. Default 80. */
  size?: number;
  align?: 'left' | 'center' | 'right';
  /** Color treatment. brand = blue numeral; inverse = on dark surface. */
  tone?: 'default' | 'brand' | 'inverse';
  style?: React.CSSProperties;
}

/** Big numeric callout. Numerals are Plus Jakarta 700, never Clash Grotesk. */
export function Stat(props: StatProps): JSX.Element;

import * as React from 'react';

export interface EyebrowProps {
  /** Color. brand = blue (default), muted = gray, inverse = on dark. */
  tone?: 'brand' | 'muted' | 'inverse';
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/** Tracked label above a headline. */
export function Eyebrow(props: EyebrowProps): JSX.Element;

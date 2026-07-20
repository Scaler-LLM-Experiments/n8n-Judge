import * as React from 'react';

/**
 * Indeterminate loading indicator — a square ring with a rotating brand edge.
 */
export interface SpinnerProps {
  /** Side length in px. Default 20. */
  size?: number;
  /** Colour of the moving edge. Default brand blue. */
  color?: string;
  /** Border thickness in px. Default 2. */
  thickness?: number;
  /** Accessible label. Default "Loading". */
  label?: string;
  style?: React.CSSProperties;
}

export function Spinner(props: SpinnerProps): JSX.Element;

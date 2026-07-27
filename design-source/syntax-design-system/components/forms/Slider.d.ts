import * as React from 'react';

/**
 * Single-value range control. Square knob, brand-blue fill.
 */
export interface SliderProps {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  /** Show the current value to the right of the track. */
  showValue?: boolean;
  /** Format the printed value, e.g. v => `$${v}k`. */
  format?: (value: number) => React.ReactNode;
  style?: React.CSSProperties;
}

export function Slider(props: SliderProps): JSX.Element;

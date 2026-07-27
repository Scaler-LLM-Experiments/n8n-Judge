import * as React from 'react';

export interface RadioOption {
  value: string;
  label: React.ReactNode;
  /** Optional secondary line under the label. */
  hint?: React.ReactNode;
  disabled?: boolean;
}

/**
 * Single choice from a set of options. Square dot with brand-blue inner fill.
 */
export interface RadioGroupProps {
  options: RadioOption[];
  value?: string;
  onChange?: (value: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Shared input `name`; auto-generated if omitted. */
  name?: string;
  /** Layout direction. Default `column`. */
  direction?: 'row' | 'column';
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function RadioGroup(props: RadioGroupProps): JSX.Element;

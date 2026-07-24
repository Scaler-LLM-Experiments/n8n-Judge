import * as React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  /** Options array; alternatively pass <option> children. */
  options?: SelectOption[];
  size?: 'md' | 'lg';
  style?: React.CSSProperties;
}

/** Styled native select with custom chevron. Sharp corners. */
export function Select(props: SelectProps): JSX.Element;

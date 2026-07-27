import * as React from 'react';

/**
 * Single-line text field with label, hint, error and optional leading icon.
 */
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  /** Error message; turns the field red and replaces the hint. */
  error?: React.ReactNode;
  icon?: React.ReactNode;
  /** Control height. lg = 48px (default), md = 36px. */
  size?: 'md' | 'lg';
  style?: React.CSSProperties;
}

export function Input(props: InputProps): JSX.Element;

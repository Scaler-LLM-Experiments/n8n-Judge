import * as React from 'react';

/**
 * Multi-line text field. Mirrors Input's label / hint / error contract.
 */
export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'style'> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  /** Error message; turns the field red and replaces the hint. */
  error?: React.ReactNode;
  /** Initial visible rows. Default 4. */
  rows?: number;
  /** Grow the field to fit content instead of scrolling. */
  autoResize?: boolean;
  style?: React.CSSProperties;
}

export function Textarea(props: TextareaProps): JSX.Element;

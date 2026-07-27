import * as React from 'react';

/**
 * Standardizes label / required marker / hint / error around any control that
 * doesn't render its own. Wrap a single control as the child.
 */
export interface FieldProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  /** Error message; replaces the hint and turns red. */
  error?: React.ReactNode;
  required?: boolean;
  /** Forwarded to the label's `htmlFor`; point at the control's id. */
  htmlFor?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Field(props: FieldProps): JSX.Element;

import * as React from 'react';

export interface ComboboxOption {
  value: string;
  label: string;
}

/**
 * Typeahead select — filters options as you type. Mirrors Input's
 * label / hint / error contract.
 */
export interface ComboboxProps {
  /** `{ value, label }` objects or plain strings. */
  options: (ComboboxOption | string)[];
  value?: string;
  onChange?: (value: string) => void;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
  /** Shown when nothing matches the query. */
  emptyText?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Combobox(props: ComboboxProps): JSX.Element;

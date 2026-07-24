import * as React from 'react';

export interface ButtonGroupItem {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

/**
 * Segmented single-select control with collapsed shared borders.
 */
export interface ButtonGroupProps {
  items: ButtonGroupItem[];
  value?: string;
  onChange?: (value: string, e: React.MouseEvent<HTMLButtonElement>) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function ButtonGroup(props: ButtonGroupProps): JSX.Element;

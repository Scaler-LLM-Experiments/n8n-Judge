import * as React from 'react';

export interface TabItem {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  /** Optional count chip after the label. */
  count?: number;
}

/**
 * Horizontal tablist with a brand-blue active underline. Renders the bar only.
 */
export interface TabsProps {
  items: TabItem[];
  value?: string;
  onChange?: (value: string, e: React.MouseEvent<HTMLButtonElement>) => void;
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
}

export function Tabs(props: TabsProps): JSX.Element;

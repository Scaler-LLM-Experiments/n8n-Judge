import * as React from 'react';

export interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: React.ReactNode;
  disabled?: boolean;
  style?: React.CSSProperties;
}

/** Sharp-cornered toggle; brand-blue track when on. */
export function Switch(props: SwitchProps): JSX.Element;

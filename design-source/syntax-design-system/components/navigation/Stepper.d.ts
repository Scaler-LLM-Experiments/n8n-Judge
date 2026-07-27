import * as React from 'react';

export interface StepSpec {
  label: React.ReactNode;
  description?: React.ReactNode;
}

/**
 * Progress through an ordered flow. Square markers, brand-blue completion.
 */
export interface StepperProps {
  steps: StepSpec[];
  /** 0-based index of the active step. */
  current?: number;
  orientation?: 'horizontal' | 'vertical';
  style?: React.CSSProperties;
}

export function Stepper(props: StepperProps): JSX.Element;

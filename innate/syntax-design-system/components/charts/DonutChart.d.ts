import * as React from 'react';

export interface DonutSegment {
  label: React.ReactNode;
  value: number;
  color?: string;
}

/** Flat donut/ring chart with an optional centre label and right-hand legend. */
export interface DonutChartProps {
  segments: DonutSegment[];
  /** Outer diameter in px. Default 132. */
  size?: number;
  /** Ring thickness in px. Default 14. */
  thickness?: number;
  /** Big number in the centre. */
  centerValue?: React.ReactNode;
  /** Small tracked caption under the centre value. */
  centerLabel?: React.ReactNode;
  /** Show the legend column. Default true. */
  legend?: boolean;
  /** Gap between segments (in circumference units). Default 0. */
  gap?: number;
  style?: React.CSSProperties;
}

export function DonutChart(props: DonutChartProps): JSX.Element;

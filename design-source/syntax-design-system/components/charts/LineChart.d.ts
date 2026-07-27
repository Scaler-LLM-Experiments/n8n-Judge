import * as React from 'react';

export interface LineDatum {
  label: React.ReactNode;
  value: number;
}

export interface LineSeries {
  name?: string;
  color?: string;
  values: number[];
}

/**
 * Flat line chart — one series via `data`, or many via `series` + `labels`.
 * Optional soft area fill (single series) and end markers.
 */
export interface LineChartProps {
  data?: LineDatum[];
  series?: LineSeries[];
  /** X-axis labels when using `series`. */
  labels?: React.ReactNode[];
  height?: number;
  color?: string;
  area?: boolean;
  markers?: boolean;
  showGrid?: boolean;
  valueFormat?: (v: number) => React.ReactNode;
  style?: React.CSSProperties;
}

export function LineChart(props: LineChartProps): JSX.Element;

import * as React from 'react';

export interface BarDatum {
  label: React.ReactNode;
  /** Simple bar value. */
  value?: number;
  /** Stacked segment values (pairs with `series` for colours/names). */
  values?: number[];
  /** Override colour for a simple bar. */
  color?: string;
}

export interface ChartSeries {
  name?: string;
  color?: string;
}

/** Flat vertical bar chart — simple or stacked. Brand palette, hairline grid. */
export interface BarChartProps {
  data: BarDatum[];
  /** Names + colours for stacked segments. */
  series?: ChartSeries[];
  /** SVG height in px. Default 200. */
  height?: number;
  /** Bar colour in simple mode. Default brand blue. */
  color?: string;
  showGrid?: boolean;
  /** Print the total above each bar. */
  showValues?: boolean;
  valueFormat?: (v: number) => React.ReactNode;
  style?: React.CSSProperties;
}

export function BarChart(props: BarChartProps): JSX.Element;

/** The shared categorical colour palette (brand blue → tints → accents). */
export const CHART_PALETTE: string[];

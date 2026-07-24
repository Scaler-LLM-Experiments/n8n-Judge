import * as React from 'react';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

/**
 * Sharp-cornered calendar — single date or a start/end range. Monday-first,
 * brand-blue selection, soft-blue in-range fill, today marker.
 */
export interface DatePickerProps {
  mode?: 'single' | 'range';
  /** Controlled value: a Date in single mode, a DateRange in range mode. */
  value?: Date | DateRange | null;
  defaultValue?: Date | DateRange | null;
  /** Date (single mode) or DateRange (range mode). */
  onChange?: (value: Date | DateRange | null) => void;
  /** Earliest selectable date. */
  min?: Date;
  /** Latest selectable date. */
  max?: Date;
  style?: React.CSSProperties;
}

export function DatePicker(props: DatePickerProps): JSX.Element;

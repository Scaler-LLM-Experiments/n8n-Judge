import * as React from 'react';

export interface TableColumn<Row = any> {
  /** Unique key; also the data accessor when no `render` is given. */
  key: string;
  header: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  /** Fixed column width, e.g. 120 or '30%'. */
  width?: number | string;
  /** Make this column header click-to-sort. */
  sortable?: boolean;
  /** Custom value used for sorting when the cell renders rich content. */
  sortAccessor?: (row: Row) => string | number;
  /** Keep cell text on one line. */
  nowrap?: boolean;
  /** Custom cell renderer; receives the row and its index. */
  render?: (row: Row, rowIndex: number) => React.ReactNode;
}

export interface TableSort {
  key: string;
  dir: 'asc' | 'desc';
}

/**
 * Sharp-cornered data table — hairline rules, uppercase tracked header,
 * brand-blue sort + selection. Sorting and selection are uncontrolled unless
 * you pass the controlled props.
 */
export interface TableProps<Row = any> {
  columns: TableColumn<Row>[];
  data: Row[];
  /** Row identity — a key name, an accessor, or omitted to use `row.id` / index. */
  rowKey?: string | ((row: Row, i: number) => string | number);
  size?: 'sm' | 'md';
  /** Render a leading checkbox column with select-all in the header. */
  selectable?: boolean;
  /** Controlled selection — array of row keys. */
  selected?: (string | number)[];
  onSelectChange?: (keys: (string | number)[]) => void;
  /** Controlled sort state. */
  sort?: TableSort | null;
  onSortChange?: (sort: TableSort) => void;
  onRowClick?: (row: Row, i: number) => void;
  /** Pin the header on vertical scroll (wrap the table in a fixed-height box). */
  stickyHeader?: boolean;
  /** Shown when `data` is empty. */
  empty?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Table<Row = any>(props: TableProps<Row>): JSX.Element;

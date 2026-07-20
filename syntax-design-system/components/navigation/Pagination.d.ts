import * as React from 'react';

/**
 * Page-through control with square cells and an ellipsis for long ranges.
 */
export interface PaginationProps {
  /** Current page, 1-based. */
  page?: number;
  /** Total number of pages. */
  pageCount: number;
  onChange?: (page: number) => void;
  /** Page numbers shown either side of the current page. Default 1. */
  siblings?: number;
  style?: React.CSSProperties;
}

export function Pagination(props: PaginationProps): JSX.Element;

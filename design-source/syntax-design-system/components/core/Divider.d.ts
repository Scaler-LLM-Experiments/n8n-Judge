import * as React from 'react';

/**
 * 1px hairline separator. Horizontal, vertical, or labelled.
 */
export interface DividerProps {
  /** Render as a vertical rule for inline use. */
  vertical?: boolean;
  /** Centered tracked label on a horizontal rule (e.g. "OR"). */
  label?: React.ReactNode;
  /** Margin around the rule in px. Default 16. */
  spacing?: number;
  style?: React.CSSProperties;
}

export function Divider(props: DividerProps): JSX.Element;

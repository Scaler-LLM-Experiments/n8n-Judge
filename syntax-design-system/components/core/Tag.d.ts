import * as React from 'react';

export interface TagProps {
  /** Selected (brand-tinted) state for active filters. */
  selected?: boolean;
  /** When provided, renders a × button; called on remove. */
  onRemove?: (e: React.MouseEvent) => void;
  onClick?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/** Filter chip — selectable, optionally removable. Sharp rectangle. */
export function Tag(props: TagProps): JSX.Element;

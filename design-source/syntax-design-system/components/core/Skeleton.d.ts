import * as React from 'react';

/**
 * Loading placeholder block with a cool shimmer. Zero radius.
 */
export interface SkeletonProps {
  /** CSS width. Defaults to 100% (block) / 70% (text). */
  width?: number | string;
  /** CSS height in px or string. Defaults to 64 (block) / 12 (text). */
  height?: number | string;
  /** `block` for media/cards, `text` for a line of copy. */
  variant?: 'block' | 'text';
  style?: React.CSSProperties;
}

export function Skeleton(props: SkeletonProps): JSX.Element;

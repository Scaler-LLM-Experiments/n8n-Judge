import * as React from 'react';

/**
 * Square icon-only action. Pass `aria-label` for accessibility.
 */
export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  /** Lucide glyph node, stroke-2, currentColor. */
  icon: React.ReactNode;
  variant?: 'primary' | 'black' | 'outline' | 'ghost';
  /** sm 28 · md 36 (default) · lg 44. */
  size?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}

export function IconButton(props: IconButtonProps): JSX.Element;

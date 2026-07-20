import * as React from 'react';

/**
 * The brand's primary action control. Sharp corners, brand blue, gentle hover ring.
 */
export interface ButtonProps {
  /** Visual style. primary = solid brand fill, black = near-black solid (high-contrast / neutral CTAs), outline = bordered, ghost = transparent, link = inline text link (underline on hover, no box). */
  variant?: 'primary' | 'black' | 'outline' | 'ghost' | 'link';
  /** Control height. xs 28 · sm 32 · md 36 (default) · lg 56 · xl 80. */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Optional leading icon node (Lucide, 16px, currentColor). */
  icon?: React.ReactNode;
  /** Optional trailing icon node. */
  iconRight?: React.ReactNode;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Button(props: ButtonProps): JSX.Element;

import * as React from 'react';

export interface ImageCardProps {
  /** Image URL (full-bleed, top of the card). */
  image: string;
  alt?: string;
  /** Tracked uppercase label above the title (brand blue). */
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
  excerpt?: React.ReactNode;
  /** Small meta line, bottom-left (e.g. "8 min read · DSA"). */
  meta?: React.ReactNode;
  /** Bottom-right call-to-action label (e.g. "Read more →"). */
  cta?: React.ReactNode;
  /** CSS aspect-ratio for the image (stacked) or the whole card (overlay). Default "16 / 10". */
  ratio?: string;
  /** Layout. "stacked" (default) = photo on top, content beneath. "overlay" = full-bleed photo fills the card, content sits inside over a dark scrim. */
  variant?: 'stacked' | 'overlay';
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}

/**
 * Image-led content card for landing pages — full-bleed photo + content.
 * @startingPoint section="Cards" subtitle="Image-led content card" viewport="380x420"
 */
export function ImageCard(props: ImageCardProps): JSX.Element;

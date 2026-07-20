import * as React from 'react';

export interface AvatarProps {
  /** Image URL. When omitted, initials from `name` are shown on a brand tile. */
  src?: string;
  /** Full name; used for initials and alt text. */
  name?: string;
  /** Square edge length in px. Default 40. */
  size?: number;
  /** Presence dot. */
  presence?: 'online' | 'away' | 'busy' | null;
  style?: React.CSSProperties;
}

/** Square identity mark — image or initials. Never round. */
export function Avatar(props: AvatarProps): JSX.Element;

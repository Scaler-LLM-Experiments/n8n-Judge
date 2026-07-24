import * as React from 'react';

export interface ProfileCardProps {
  /** Portrait photo URL. */
  photo: string;
  name: React.ReactNode;
  role?: React.ReactNode;
  company?: React.ReactNode;
  /** Optional testimonial quote, shown above the name in headline type. */
  quote?: React.ReactNode;
  /** Optional brand-blue stat line (e.g. "13× salary jump"). */
  stat?: React.ReactNode;
  /** Portrait placement. "top" (stacked) or "side" (photo left). */
  layout?: 'top' | 'side';
  style?: React.CSSProperties;
}

/** People-led card (mentor / alum / testimonial). Portrait-forward. */
export function ProfileCard(props: ProfileCardProps): JSX.Element;

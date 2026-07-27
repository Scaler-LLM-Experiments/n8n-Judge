import * as React from 'react';

/**
 * Anchored floating panel for interactive content. Click to toggle; closes on
 * outside-click and Escape.
 */
export interface PopoverProps {
  /** The clickable anchor element. */
  trigger: React.ReactNode;
  /** Panel content, or a render fn receiving { close }. */
  children: React.ReactNode | ((api: { close: () => void }) => React.ReactNode);
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
  /** Panel width in px. Default 260. */
  width?: number;
  style?: React.CSSProperties;
}

export function Popover(props: PopoverProps): JSX.Element;

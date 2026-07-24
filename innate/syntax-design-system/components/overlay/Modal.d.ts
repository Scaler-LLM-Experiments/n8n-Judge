import * as React from 'react';

/**
 * Focused, interruptive dialog. Scrim + centered sharp-cornered panel.
 */
export interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title?: React.ReactNode;
  children?: React.ReactNode;
  /** Footer node — typically a right-aligned Button cluster. */
  footer?: React.ReactNode;
  /** Panel width: sm 400 · md 520 (default) · lg 720. */
  size?: 'sm' | 'md' | 'lg';
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  style?: React.CSSProperties;
}

export function Modal(props: ModalProps): JSX.Element | null;

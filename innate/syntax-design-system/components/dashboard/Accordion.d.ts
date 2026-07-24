import * as React from 'react';

export interface AccordionItem {
  id: string;
  title: React.ReactNode;
  /** Right-aligned meta in the header (e.g. attendance / score). */
  meta?: React.ReactNode;
  content?: React.ReactNode;
  locked?: boolean;
}

export interface AccordionProps {
  items: AccordionItem[];
  /** Uncontrolled: which item starts open. */
  defaultOpenId?: string | null;
  /** Controlled open id (pair with onOpenChange). */
  openId?: string | null;
  onOpenChange?: (id: string | null) => void;
  style?: React.CSSProperties;
}

/** Sharp disclosure list; open header fills brand blue, locked items greyed. */
export function Accordion(props: AccordionProps): JSX.Element;

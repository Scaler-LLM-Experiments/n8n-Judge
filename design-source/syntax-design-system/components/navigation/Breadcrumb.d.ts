import * as React from 'react';

export interface BreadcrumbItem {
  label: React.ReactNode;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * Hierarchy trail. The last item is the current page.
 */
export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  style?: React.CSSProperties;
}

export function Breadcrumb(props: BreadcrumbProps): JSX.Element;

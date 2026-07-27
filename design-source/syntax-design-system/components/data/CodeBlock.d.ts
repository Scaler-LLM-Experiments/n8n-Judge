import * as React from 'react';

/**
 * Code surface with language tag, optional filename, line numbers, line
 * highlights and copy button. Dark (product) or light (marketing/docs) theme.
 * Highlighting is a lightweight token pass — not full language parsing.
 */
export interface CodeBlockProps {
  /** Raw source. Newlines split into rows. */
  code: string;
  /** Language label shown in the top bar (e.g. "TypeScript"). */
  language?: React.ReactNode;
  /** Filename shown next to the language. */
  filename?: React.ReactNode;
  theme?: 'dark' | 'light';
  showLineNumbers?: boolean;
  /** 1-based line numbers to highlight. */
  highlightLines?: number[];
  /** Apply the token-colour pass. Default true; false renders raw monospace. */
  highlight?: boolean;
  /** Soft-wrap long lines instead of horizontal scroll. */
  wrap?: boolean;
  /** Show the copy button. Default true. */
  copyable?: boolean;
  style?: React.CSSProperties;
}

export function CodeBlock(props: CodeBlockProps): JSX.Element;

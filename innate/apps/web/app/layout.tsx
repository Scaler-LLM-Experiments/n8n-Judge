import type { Metadata } from 'next';
import '../src/index.css';

export const metadata: Metadata = {
  title: 'Judge — Learn n8n by building',
  description:
    'An n8n simulator that teaches you to dissect a problem, build an AI-agent workflow, and stress-test it.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

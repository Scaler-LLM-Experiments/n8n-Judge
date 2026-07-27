import React from 'react';
import { Toast } from './Toast.jsx';

/**
 * ToastStack — fixed-position container that renders a controlled array of
 * toasts and stacks them in a screen corner. You own the array: push to add,
 * filter on `onDismiss` to remove. Pass each toast as
 * { id, tone, title, description }.
 */
export function ToastStack({ toasts = [], onDismiss, placement = 'bottom-right', style, ...rest }) {
  const [v, h] = placement.split('-');
  const pos = {
    top: { top: 24 },
    bottom: { bottom: 24 },
    left: { left: 24, alignItems: 'flex-start' },
    right: { right: 24, alignItems: 'flex-end' },
    center: { left: '50%', transform: 'translateX(-50%)', alignItems: 'center' },
  };

  return (
    <div
      style={{
        position: 'fixed',
        zIndex: 'var(--z-toast, 1900)',
        display: 'flex',
        flexDirection: v === 'top' ? 'column' : 'column-reverse',
        gap: 10,
        ...(pos[v] || pos.bottom),
        ...(pos[h] || pos.right),
        ...style,
      }}
      {...rest}
    >
      {toasts.map((t) => (
        <Toast
          key={t.id}
          tone={t.tone}
          title={t.title}
          description={t.description}
          onClose={onDismiss ? () => onDismiss(t.id) : undefined}
        />
      ))}
    </div>
  );
}

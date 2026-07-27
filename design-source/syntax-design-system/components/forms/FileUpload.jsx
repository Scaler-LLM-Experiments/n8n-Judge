import React from 'react';

/**
 * FileUpload — a sharp-cornered dropzone. Click or drag to select files.
 * Hairline border that brightens to brand blue on drag-over. Reports chosen
 * files via `onFiles`. Stateless about the upload itself — wire your own
 * progress with the `Progress` component.
 */
export function FileUpload({
  onFiles,
  accept,
  multiple = false,
  hint = 'PDF, PNG or JPG · up to 10MB',
  label = 'Drop a file here or click to browse',
  disabled = false,
  style,
  ...rest
}) {
  const [over, setOver] = React.useState(false);
  const inputRef = React.useRef(null);
  const emit = (list) => { if (list && list.length && onFiles) onFiles(Array.from(list)); };

  return (
    <div
      onClick={() => !disabled && inputRef.current && inputRef.current.click()}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); if (!disabled) emit(e.dataTransfer.files); }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '32px 24px',
        textAlign: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        background: over ? 'var(--brand-blue-50)' : 'var(--surface-1)',
        border: `1px dashed ${over ? 'var(--brand-primary)' : 'var(--border-strong)'}`,
        transition: 'background 120ms var(--ease-standard,ease), border-color 120ms var(--ease-standard,ease)',
        ...style,
      }}
      {...rest}
    >
      <span style={{ display: 'inline-flex', color: over ? 'var(--brand-primary)' : 'var(--fg-3)' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
          <path d="M12 3v12" /><path d="m7 8 5-5 5 5" /><path d="M5 17v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3" />
        </svg>
      </span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, color: 'var(--fg-1)' }}>{label}</span>
      {hint ? <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--fg-3)' }}>{hint}</span> : null}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => emit(e.target.files)}
        style={{ display: 'none' }}
      />
    </div>
  );
}

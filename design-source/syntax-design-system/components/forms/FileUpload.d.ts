import * as React from 'react';

/**
 * Sharp-cornered click-or-drag dropzone. Reports chosen files; does not manage
 * the upload itself — pair with Progress for status.
 */
export interface FileUploadProps {
  /** Called with the selected files. */
  onFiles?: (files: File[]) => void;
  /** Native accept filter, e.g. "image/*,.pdf". */
  accept?: string;
  multiple?: boolean;
  /** Primary instruction line. */
  label?: React.ReactNode;
  /** Secondary constraint line. */
  hint?: React.ReactNode;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function FileUpload(props: FileUploadProps): JSX.Element;

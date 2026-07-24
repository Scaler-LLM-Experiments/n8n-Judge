import { createContext, useContext } from 'react';

// Editor callbacks shared with react-flow node components.
export const EditorContext = createContext({
  openPicker: () => {},
  openNdv: () => {},
});

export const useEditor = () => useContext(EditorContext);

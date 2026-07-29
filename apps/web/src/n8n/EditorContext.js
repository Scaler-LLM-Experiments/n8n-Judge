import { createContext, useContext } from 'react';

// Editor callbacks shared with react-flow node components.
export const EditorContext = createContext({
  openPicker: () => {},
  openNdv: () => {},
  // Nodes need to delete themselves from their hover affordance. The editor also
  // exposes removeNode over its ref, which is how BuildStage clears a wrong pick.
  removeNode: () => {},
});

export const useEditor = () => useContext(EditorContext);

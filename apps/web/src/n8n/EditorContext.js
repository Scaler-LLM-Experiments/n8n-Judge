import { createContext, useContext } from 'react';

// Editor callbacks shared with react-flow node components.
export const EditorContext = createContext({
  openPicker: () => {},
  openNdv: () => {},
  // Deliberately NOT a `removeNode`. Nodes used to delete themselves from a hover
  // affordance; that affordance is gone, and the only remover left is BuildStage
  // clearing a wrong pick over the editor's ref. Putting it back on the context
  // would put the button back within reach of any node component.
});

export const useEditor = () => useContext(EditorContext);

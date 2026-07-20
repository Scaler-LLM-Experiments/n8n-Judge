import React from 'react';
import { emailTriage } from './data/problems/emailTriage.js';
import { EvalScreen } from './screens/EvalScreen.jsx';

export default function App() {
  return (
    <div style={{ height: '100vh' }}>
      <EvalScreen problem={emailTriage} onSubmit={(result) => console.log('eval result', result)} />
    </div>
  );
}

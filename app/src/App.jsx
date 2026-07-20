import React from 'react';
import { emailTriage } from './data/problems/emailTriage.js';
import { ProblemStatementScreen } from './screens/ProblemStatementScreen.jsx';

export default function App() {
  return (
    <div style={{ height: '100vh' }}>
      <ProblemStatementScreen problem={emailTriage} onStart={() => alert('Start clicked')} />
    </div>
  );
}

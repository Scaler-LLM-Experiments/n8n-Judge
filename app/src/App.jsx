import React from 'react';
import { emailTriage } from './data/problems/emailTriage.js';
import { DashboardScreen } from './screens/DashboardScreen.jsx';

export default function App() {
  return (
    <div style={{ height: '100vh' }}>
      <DashboardScreen problem={emailTriage} onAllTestsPassed={() => alert('All tests passed!')} />
    </div>
  );
}

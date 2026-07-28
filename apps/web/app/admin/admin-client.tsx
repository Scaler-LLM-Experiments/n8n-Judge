'use client';

import dynamic from 'next/dynamic';

// Client-only for the same reason as the journey: the dashboard is interactive
// and reads from the admin API after mount. Nothing here benefits from being
// rendered on the server, and the API already refuses non-admins.
const AdminDashboard = dynamic(() => import('../../src/screens/AdminDashboard.jsx').then((m) => m.AdminDashboard), {
  ssr: false,
  loading: () => (
    <div style={{ height: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-body)', color: 'var(--fg-3)' }}>
      Loading analytics…
    </div>
  ),
});

export default function AdminClient() {
  return <AdminDashboard />;
}

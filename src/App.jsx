import { useState } from 'react';
import Navbar from './components/Navbar';
import WorkoutSchedulerPage from './pages/WorkoutSchedulerPage';
import DataConsolePage from './pages/DataConsolePage';
import useFirebaseAuth from './hooks/useFirebaseAuth';

export default function App() {
  const [activePage, setActivePage] = useState('workout');
  const [syncNonce, setSyncNonce] = useState(0);
  const authState = useFirebaseAuth();
  const syncScope = authState.user?.uid || (authState.isConfigured ? 'signed-out' : 'local');
  const syncKey = `${syncScope}:${syncNonce}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        activePage={activePage}
        onNavigate={setActivePage}
        authState={authState}
        onDataRefreshed={() => setSyncNonce((n) => n + 1)}
      />
      <main>
        {activePage === 'workout'
          ? <WorkoutSchedulerPage syncKey={syncKey} />
          : <DataConsolePage key={`data-${syncKey}`} />}
      </main>
    </div>
  );
}

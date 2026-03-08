import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import WorkoutSchedulerPage from './pages/WorkoutSchedulerPage';
import DataConsolePage from './pages/DataConsolePage';
import DashboardPage from './pages/DashboardPage';
import useFirebaseAuth from './hooks/useFirebaseAuth';

export default function App() {
  const [syncNonce, setSyncNonce] = useState(0);
  const authState = useFirebaseAuth();
  const syncScope = authState.user?.uid || (authState.isConfigured ? 'signed-out' : 'local');
  const syncKey = `${syncScope}:${syncNonce}`;

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar
          authState={authState}
          onDataRefreshed={() => setSyncNonce((n) => n + 1)}
        />
        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/workout" replace />} />
            <Route path="/workout" element={<WorkoutSchedulerPage syncKey={syncKey} />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/data" element={<DataConsolePage key={`data-${syncKey}`} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

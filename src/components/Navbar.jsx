import { useState } from 'react';
import { clearLocalDataAndRehydrateFromCloud, migrateLocalDataToCloud } from '../utils/storage';

export default function Navbar({ activePage, onNavigate, authState, onDataRefreshed }) {
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [migrationNote, setMigrationNote] = useState('');
  const [confirmingClear, setConfirmingClear] = useState(false);

  const navBtn = (key) => [
    'px-3 py-1.5 rounded text-sm font-semibold transition-colors',
    activePage === key
      ? 'bg-blue-100 text-blue-700'
      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
  ].join(' ');

  const canCloud = !!authState?.isConfigured;
  const user = authState?.user;

  const handleLogin = async () => {
    if (!email || !password || !authState) return;
    try {
      setBusy(true);
      await authState.login(email.trim(), password);
      setShowLogin(false);
      setPassword('');
    } catch {
      // Hook already tracks readable errors.
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    if (!authState) return;
    try {
      setBusy(true);
      await authState.logout();
    } finally {
      setBusy(false);
    }
  };

  const handleMigrate = async () => {
    try {
      setBusy(true);
      const result = await migrateLocalDataToCloud();
      if (result.ok) {
        setMigrationNote('Local data pushed to cloud');
      } else if (result.reason === 'not-authenticated') {
        setMigrationNote('Sign in first to migrate');
      } else {
        setMigrationNote('Migration failed');
      }
    } finally {
      setBusy(false);
      setTimeout(() => setMigrationNote(''), 2500);
    }
  };

  const handleClearLocal = async () => {
    try {
      setBusy(true);
      const result = await clearLocalDataAndRehydrateFromCloud();
      if (result.ok) {
        setMigrationNote('Local data removed and reloaded from cloud');
        onDataRefreshed?.();
      } else if (result.reason === 'not-authenticated') {
        setMigrationNote('Sign in first to remove local data');
      } else {
        setMigrationNote('Failed to reload from cloud after local clear');
      }
    } finally {
      setBusy(false);
      setConfirmingClear(false);
      setTimeout(() => setMigrationNote(''), 3000);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
        <span className="text-2xl">💪</span>
        <span className="text-xl font-bold text-blue-700 tracking-tight">GymPlanner</span>
        <span className="ml-2 text-sm text-gray-400 font-medium">Daily Workout Scheduler</span>
        <div className="ml-auto flex items-center gap-2">
          <button className={navBtn('workout')} onClick={() => onNavigate('workout')}>
            Workout
          </button>
          <button className={navBtn('data')} onClick={() => onNavigate('data')}>
            Data
          </button>
        </div>

        {!canCloud && (
          <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded">
            Cloud: not configured
          </span>
        )}

        {canCloud && user && (
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span className="text-gray-500 max-w-44 truncate">{user.email}</span>
            <button
              onClick={handleMigrate}
              disabled={busy}
              className="px-3 py-1.5 rounded font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60"
            >
              Migrate Local to Cloud
            </button>
            <button
              onClick={() => setConfirmingClear((v) => !v)}
              disabled={busy}
              className="px-3 py-1.5 rounded font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              Remove Local Data
            </button>
            <button
              onClick={handleLogout}
              disabled={busy}
              className="px-3 py-1.5 rounded font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-60"
            >
              Sign Out
            </button>
          </div>
        )}

        {canCloud && user && confirmingClear && (
          <div className="w-full flex justify-end gap-2 text-sm">
            <span className="text-red-700 font-medium">Clear local cache now?</span>
            <button
              onClick={handleClearLocal}
              disabled={busy}
              className="px-3 py-1 rounded bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-60"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmingClear(false)}
              disabled={busy}
              className="px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        )}

        {canCloud && !user && (
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                authState?.clearError?.();
                setShowLogin((v) => !v);
              }}
              className="px-3 py-1.5 rounded text-sm font-semibold text-gray-600 hover:bg-gray-100"
            >
              {showLogin ? 'Close Sign In' : 'Cloud Sign In'}
            </button>
            {showLogin && (
              <>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email"
                  className="border border-gray-300 rounded px-2 py-1.5 text-sm w-44"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password"
                  className="border border-gray-300 rounded px-2 py-1.5 text-sm w-36"
                />
                <button
                  onClick={handleLogin}
                  disabled={busy || authState?.loading}
                  className="px-3 py-1.5 rounded text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        )}
      </div>
      {canCloud && !user && authState?.error && (
        <div className="max-w-7xl mx-auto px-4 pb-3">
          <p className="text-xs text-red-600">{authState.error}</p>
        </div>
      )}
      {canCloud && user && migrationNote && (
        <div className="max-w-7xl mx-auto px-4 pb-3">
          <p className="text-xs text-blue-700">{migrationNote}</p>
        </div>
      )}
    </nav>
  );
}

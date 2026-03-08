import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { clearLocalDataAndRehydrateFromCloud, migrateLocalDataToCloud } from '../utils/storage';

export default function Navbar({ authState, onDataRefreshed }) {
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [migrationNote, setMigrationNote] = useState('');
  const [confirmingClear, setConfirmingClear] = useState(false);

  const navBtnClass = ({ isActive }) => [
    'px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-300',
    isActive
      ? 'bg-blue-600 text-white'
      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/80',
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
        setMigrationNote('Synced');
      } else if (result.reason === 'not-authenticated') {
        setMigrationNote('Auth Required');
      } else {
        setMigrationNote('Sync Error');
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
        setMigrationNote('Local Purged');
        onDataRefreshed?.();
      } else if (result.reason === 'not-authenticated') {
        setMigrationNote('Auth Required');
      } else {
        setMigrationNote('Error');
      }
    } finally {
      setBusy(false);
      setConfirmingClear(false);
      setTimeout(() => setMigrationNote(''), 3000);
    }
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-gray-200/40">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#007AFF] to-[#5856D6] rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-[#1C1C1E]">GymPlanner</h1>
              <span className="text-blue-600 font-black text-sm">V2.0 Elite</span>
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Intelligence Engine</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <NavLink to="/workout" className={({ isActive }) => `text-sm font-bold transition-all duration-300 ${isActive ? 'text-[#007AFF]' : 'text-gray-400 hover:text-gray-900'}`}>
            Workout
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => `text-sm font-bold transition-all duration-300 ${isActive ? 'text-[#007AFF]' : 'text-gray-400 hover:text-gray-900'}`}>
            Dashboard
          </NavLink>
          <NavLink to="/data" className={({ isActive }) => `text-sm font-bold transition-all duration-300 ${isActive ? 'text-[#007AFF]' : 'text-gray-400 hover:text-gray-900'}`}>
            Data
          </NavLink>
        </div>

        {/* User / Cloud Section */}
        <div className="flex items-center gap-5">
          {!canCloud && (
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
              Offline
            </span>
          )}

          {canCloud && user && (
            <div className="flex items-center gap-4 relative">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] text-[#1C1C1E] font-black uppercase tracking-tight">{user.email.split('@')[0]}</span>
                <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Athlete</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleMigrate}
                  disabled={busy}
                  className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </button>
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden group relative cursor-pointer" onClick={handleLogout}>
                  <img src="https://ui-avatars.com/api/?name=User&background=f3f4f6&color=888" alt="Profile" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-[8px] text-white font-black uppercase">Out</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {canCloud && !user && (
            <div className="flex items-center gap-4 relative">
              <button
                onClick={() => {
                  authState?.clearError?.();
                  setShowLogin((v) => !v);
                }}
                className={`pill-button-primary pill-button text-sm flex items-center gap-2`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {showLogin ? 'Close' : 'Sign In'}
              </button>

              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
              </div>

              {showLogin && (
                <div className="absolute top-full right-0 mt-5 p-5 bg-white/95 backdrop-blur-2xl border border-gray-100 rounded-[28px] shadow-2xl flex flex-col gap-4 min-w-[320px] animate-apple z-[100] ring-1 ring-black/5">
                  <div>
                    <h3 className="text-lg font-black tracking-tight px-1 text-[#1C1C1E]">Sync Engine</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest px-1 mt-1">Authenticate to persist training</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      className="border border-gray-100 rounded-2xl px-5 py-3 text-sm bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-100/30 outline-none transition-all font-semibold"
                    />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="border border-gray-100 rounded-2xl px-5 py-3 text-sm bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-100/30 outline-none transition-all font-semibold"
                    />
                  </div>
                  <button
                    onClick={handleLogin}
                    disabled={busy || authState?.loading}
                    className="w-full bg-[#007AFF] text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-[#0062CC] transition-all disabled:opacity-50"
                  >
                    {busy ? 'Authenticating...' : 'Establish Session'}
                  </button>
                  {authState?.error && <p className="text-[10px] font-bold text-rose-500 text-center uppercase tracking-widest bg-rose-50 p-2 rounded-xl border border-rose-100">{authState.error}</p>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {migrationNote && (
        <div className="fixed bottom-24 right-8 px-6 py-2.5 bg-gray-900/90 backdrop-blur-xl text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl animate-apple z-[100]">
          {migrationNote}
        </div>
      )}
    </nav>
  );
}

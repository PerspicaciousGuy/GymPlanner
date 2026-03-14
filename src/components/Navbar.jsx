import { useState } from 'react';
import { 
  Cloud, 
  CloudOff, 
  LogOut, 
  LogIn, 
  Database, 
  User, 
  ShieldCheck, 
  AlertCircle,
  ChevronDown,
  RefreshCw
} from 'lucide-react';

import {
  clearLocalDataAndRehydrateFromCloud,
  migrateLocalDataToCloud,
} from '../utils/storage';

export default function Navbar({ activePage, onNavigate, authState, onDataRefreshed, compact }) {
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [migrationNote, setMigrationNote] = useState('');
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

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
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    if (!authState) return;
    try {
      setBusy(true);
      await authState.logout();
      setShowUserMenu(false);
    } finally {
      setBusy(false);
    }
  };

  const handleMigrate = async () => {
    try {
      setBusy(true);
      const result = await migrateLocalDataToCloud();
      setMigrationNote(result.ok ? 'Data synced to cloud' : 'Sync failed');
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
        setMigrationNote('Cache cleared');
        onDataRefreshed?.();
      }
    } finally {
      setBusy(false);
      setConfirmingClear(false);
      setTimeout(() => setMigrationNote(''), 3000);
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-14 md:h-16 shrink-0 z-40 sticky top-0">
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs md:text-sm font-bold text-slate-900 capitalize tracking-tight whitespace-nowrap">
              {activePage === 'workout' ? 'Training' : 'Console'}
            </span>
            <div className={`px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wider ${canCloud ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
              {canCloud ? 'Cloud' : 'Local'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {migrationNote && (
            <span className="hidden sm:inline-block text-xs font-semibold text-indigo-600 animate-fade-in pr-4 border-r border-slate-100">
              {migrationNote}
            </span>
          )}

          {canCloud && user ? (
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-1.5 md:pl-2 pr-1 py-1 rounded-full bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all group"
              >
                <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover:text-indigo-600 border border-slate-100 shadow-sm transition-colors">
                  <User size={12} className="md:size-14" />
                </div>
                <span className="hidden md:inline-block text-xs font-bold text-slate-700 max-w-[120px] truncate">{user.email}</span>
                <ChevronDown size={12} className={`text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>


              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/50 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-slate-50 mb-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account & Cloud</p>
                  </div>
                  <button 
                    onClick={handleMigrate}
                    className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                  >
                    <Cloud size={16} /> Sync Local and Cloud
                  </button>
                  <button 
                    onClick={() => setConfirmingClear(true)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-red-500 transition-colors"
                  >
                    <RefreshCw size={16} /> Re-sync from Cloud
                  </button>

                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 mt-1 border-t border-slate-50 pt-2 text-xs font-semibold text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowLogin(!showLogin)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                <LogIn size={15} /> Sign In
              </button>
              
              {showLogin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-slate-900 mb-1">Welcome Back</h3>
                      <p className="text-slate-500 text-sm mb-6 font-medium">Connect your local workout data to the cloud.</p>
                      
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Email</label>
                          <input 
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Password</label>
                          <input 
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                          />
                        </div>
                        <button 
                          onClick={handleLogin}
                          disabled={busy}
                          className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 mt-2"
                        >
                          {busy ? 'Signing In...' : 'Sign In Now'}
                        </button>
                        <button 
                          onClick={() => setShowLogin(false)}
                          className="w-full py-3 text-slate-400 font-bold text-xs hover:text-slate-600 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {confirmingClear && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl border border-red-100 shadow-2xl max-w-md w-full p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Are you sure?</h3>
            <p className="text-slate-500 font-medium mb-8 leading-relaxed">
              This will clear your local cached data and replace it with your cloud data. Make sure you've synced any local changes first!
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleClearLocal}
                className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-100"
              >
                Yes, Clear and Reload
              </button>
              <button 
                onClick={() => setConfirmingClear(false)}
                className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-all"
              >
                No, Keep my data
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

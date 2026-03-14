import { useState, useEffect } from 'react';
import { LayoutGrid, Calendar, Database, LogIn, LogOut, Cloud, Trash2, RefreshCw } from 'lucide-react';

import Navbar from './components/Navbar';
import WorkoutSchedulerPage from './pages/WorkoutSchedulerPage';
import DataConsolePage from './pages/DataConsolePage';
import useFirebaseAuth from './hooks/useFirebaseAuth';
import { migrateCompletionToDateBased, migrateWorkoutsToDateBased } from './utils/storage';

export default function App() {
  const [activePage, setActivePage] = useState('workout');
  const [syncNonce, setSyncNonce] = useState(0);
  const authState = useFirebaseAuth();
  const syncScope = authState.user?.uid || (authState.isConfigured ? 'signed-out' : 'local');
  const syncKey = `${syncScope}:${syncNonce}`;

  // Run migrations on app load
  useEffect(() => {
    migrateCompletionToDateBased();
    migrateWorkoutsToDateBased();
  }, []);

  return (

    <div className="flex flex-col md:flex-row min-h-screen bg-[#f8fafc]">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex w-20 lg:w-24 bg-white border-r border-slate-200 flex-col items-center py-8 gap-10 sticky top-0 h-screen z-50">
        <div className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <span className="text-xl font-bold">G</span>
          </div>
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tighter">Planner</span>
        </div>

        <nav className="flex flex-col gap-8 flex-1">
          <button 
            onClick={() => setActivePage('workout')}
            className={`flex flex-col items-center gap-1 group cursor-pointer transition-all ${activePage === 'workout' ? 'text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <div className={`p-3 rounded-xl transition-all ${activePage === 'workout' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-transparent'}`}>
              <Calendar size={20} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">Workout</span>
          </button>

          <button 
            onClick={() => setActivePage('data')}
            className={`flex flex-col items-center gap-1 group cursor-pointer transition-all ${activePage === 'data' ? 'text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <div className={`p-3 rounded-xl transition-all ${activePage === 'data' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-transparent'}`}>
              <LayoutGrid size={20} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">Console</span>
          </button>
        </nav>

        <div className="flex flex-col items-center gap-4">
          <div className={`w-2 h-2 rounded-full ${syncScope.startsWith('local') ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'}`} />
          <button 
            onClick={() => {}}
            className="p-3 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all border border-slate-100"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden pb-20 md:pb-0">
        <Navbar
          activePage={activePage}
          onNavigate={setActivePage}
          authState={authState}
          onDataRefreshed={() => setSyncNonce((n) => n + 1)}
          compact
        />

        <main className="flex-1 overflow-auto">
          <div className="p-3 sm:p-4 lg:p-6 mx-auto w-full max-w-[1600px]">
            {activePage === 'workout'
              ? <WorkoutSchedulerPage syncKey={syncKey} />
              : <DataConsolePage key={`data-${syncKey}`} hideSidebar />}
          </div>
        </main>
      </div>

      {/* Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-slate-200 px-6 flex items-center justify-around z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] backdrop-blur-lg bg-white/90">
        <button 
          onClick={() => setActivePage('workout')}
          className={`flex flex-col items-center gap-1.5 transition-all ${activePage === 'workout' ? 'text-indigo-600' : 'text-slate-400'}`}
        >
          <div className={`p-2 rounded-xl scale-110 ${activePage === 'workout' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : ''}`}>
            <Calendar size={20} strokeWidth={2.5} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Training</span>
        </button>

        <button 
          onClick={() => setActivePage('data')}
          className={`flex flex-col items-center gap-1.5 transition-all ${activePage === 'data' ? 'text-indigo-600' : 'text-slate-400'}`}
        >
          <div className={`p-2 rounded-xl scale-110 ${activePage === 'data' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : ''}`}>
            <LayoutGrid size={20} strokeWidth={2.5} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Console</span>
        </button>

        <div className="relative">
          <button 
            className="flex flex-col items-center gap-1.5 text-slate-400"
            onClick={() => setSyncNonce(n => n + 1)}
          >
            <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl relative">
              <RefreshCw size={20} strokeWidth={2.5} />
              <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${syncScope.startsWith('local') ? 'bg-amber-400' : 'bg-emerald-400'}`} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Sync</span>
          </button>
        </div>
      </nav>
    </div>
  );
}


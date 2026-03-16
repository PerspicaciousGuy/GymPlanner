import { useState, useEffect } from 'react';
import { LayoutGrid, Calendar, LogIn, LogOut, Cloud, Trash2, RefreshCw, BarChart3, History, User } from 'lucide-react';

import Navbar from './components/Navbar';
import WorkoutSchedulerPage from './pages/WorkoutSchedulerPage';
import DataConsolePage from './pages/DataConsolePage';
import AnalyticsPage from './pages/AnalyticsPage';
import HistoryPage from './pages/HistoryPage';
import DayDetailPage from './pages/DayDetailPage';
import ProfilePage from './pages/ProfilePage';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import useFirebaseAuth from './hooks/useFirebaseAuth';
import { migrateCompletionToDateBased, migrateWorkoutsToDateBased } from './utils/storage';

export default function App() {
  const [activePage, setActivePage] = useState('workout');
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(null);
  const [syncNonce, setSyncNonce] = useState(0);
  const authState = useFirebaseAuth();
  const syncScope = authState.user?.uid || (authState.isConfigured ? 'signed-out' : 'local');
  const syncKey = `${syncScope}:${syncNonce}`;

  // Run migrations on app load
  useEffect(() => {
    migrateCompletionToDateBased();
    migrateWorkoutsToDateBased();
  }, []);

  const handleDateSelect = (date) => {
    setSelectedHistoryDate(date);
    setActivePage('dayDetail');
  };

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

        <nav className="flex flex-col gap-6 flex-1">
          {[
            { id: 'workout', name: 'Training', icon: Calendar },
            { id: 'history', name: 'History', icon: History },
            { id: 'data', name: 'Console', icon: LayoutGrid },
            { id: 'analytics', name: 'Insights', icon: BarChart3 },
            { id: 'profile', name: 'Profile', icon: User },
          ].map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => setActivePage(item.id)}
              className={cn(
                "w-14 h-14 flex-col gap-1 p-0 rounded-xl transition-all",
                activePage === item.id 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:text-white" 
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              )}
            >
              <item.icon size={20} strokeWidth={2.5} />
              <span className="text-[9px] font-extrabold uppercase tracking-tighter">{item.name}</span>
            </Button>
          ))}
        </nav>

        <div className="flex flex-col items-center gap-3">
          <div className={`w-1.5 h-1.5 rounded-full transition-all ${syncScope.startsWith('local') ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'}`} />
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setSyncNonce(n => n + 1)}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all border border-slate-100"
          >
            <RefreshCw size={18} />
          </Button>
          
          <Button variant="outline" size="icon" className="shadow-xs border-indigo-100 text-indigo-600 hover:bg-indigo-50 rounded-xl">
            <Cloud size={18} />
          </Button>
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
            {activePage === 'workout' && <WorkoutSchedulerPage syncKey={syncKey} />}
            {activePage === 'history' && <HistoryPage onDateSelect={handleDateSelect} />}
            {activePage === 'dayDetail' && <DayDetailPage date={selectedHistoryDate} onBack={() => setActivePage('history')} syncKey={syncKey} />}
            {activePage === 'data' && <DataConsolePage key={`data-${syncKey}`} hideSidebar />}
            {activePage === 'analytics' && <AnalyticsPage />}
            {activePage === 'profile' && <ProfilePage authState={authState} onDataRefreshed={() => setSyncNonce(n => n + 1)} />}
          </div>

        </main>
      </div>

      {/* Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-slate-200 px-2 flex items-center justify-around z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] backdrop-blur-lg bg-white/90">
        {[
          { id: 'workout', name: 'Training', icon: Calendar },
          { id: 'history', name: 'History', icon: History },
          { id: 'data', name: 'Console', icon: LayoutGrid },
          { id: 'analytics', name: 'Insights', icon: BarChart3 },
          { id: 'profile', name: 'Profile', icon: User },
        ].map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            onClick={() => setActivePage(item.id)}
            className={cn(
              "flex-col gap-1.5 h-16 w-16 px-0 transition-all",
              activePage === item.id ? "text-indigo-600" : "text-slate-400"
            )}
          >
            <div className={cn(
              "p-2 rounded-xl transition-all",
              activePage === item.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-transparent"
            )}>
              <item.icon size={20} strokeWidth={2.5} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-tight">{item.name}</span>
          </Button>
        ))}
      </nav>
    </div>
  );
}


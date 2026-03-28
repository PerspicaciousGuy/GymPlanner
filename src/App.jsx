import { useState, useEffect } from 'react';
import { Sparkles, Calendar, LogIn, LogOut, Cloud, Trash2, RefreshCw, BarChart3, History, User, Activity } from 'lucide-react';


import WorkoutSchedulerPage from './pages/WorkoutSchedulerPage';
import AnalyticsPage from './pages/AnalyticsPage';
import HistoryPage from './pages/HistoryPage';
import DayDetailPage from './pages/DayDetailPage';
import ProfilePage from './pages/ProfilePage';
import RoutinesPage from './pages/RoutinesPage';
import EditRoutinePage from './pages/EditRoutinePage';
import TrainingPlanPage from './pages/TrainingPlanPage';
import HealthPage from './pages/HealthPage';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import useFirebaseAuth from './hooks/useFirebaseAuth';
import { migrateCompletionToDateBased, migrateWorkoutsToDateBased, isDayComplete } from './utils/storage';
import { scheduleTomorrowSummary } from './utils/notificationService';
import { loadSettings } from './utils/settings';

export default function App() {
  const [activePage, setActivePage] = useState('workout');
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(null);
  const [editRoutineId, setEditRoutineId] = useState(null);
  const [syncNonce, setSyncNonce] = useState(0);
  const [fullScreenMode, setFullScreenMode] = useState(false);
  const authState = useFirebaseAuth();
  const syncScope = authState.user?.uid || (authState.isConfigured ? 'signed-out' : 'local');
  const syncKey = `${syncScope}:${syncNonce}`;

  const [settings, setSettings] = useState(() => {
    const s = loadSettings();
    if (typeof document !== 'undefined') {
      if (s.theme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    }
    return s;
  });

  // Run migrations on app load
  useEffect(() => {
    migrateCompletionToDateBased();
    migrateWorkoutsToDateBased();

    // Check for tomorrow's workout reminder
    const timer = setTimeout(() => {
      scheduleTomorrowSummary();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Theme Sync
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Reset full screen mode when switching main pages
  useEffect(() => {
    setFullScreenMode(false);
  }, [activePage]);

  const handleDateSelect = (date) => {
    setSelectedHistoryDate(date);
    const complete = isDayComplete(date, 'am') && isDayComplete(date, 'pm');
    if (complete) {
      setActivePage('dayDetail');
    } else {
      setActivePage('workout');
    }
  };

  return (

    <div className="flex flex-col md:flex-row min-h-screen bg-background">
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
            { id: 'health', name: 'Health', icon: Activity },
            { id: 'routines', name: 'Routines', icon: Sparkles },
            { id: 'analytics', name: 'Insights', icon: BarChart3 },
            { id: 'profile', name: 'Profile', icon: User },
          ].map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => {
                setActivePage(item.id);
                if (item.id === 'workout') {
                  setSelectedHistoryDate(null);
                }
              }}
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
      <div className={cn(
        "flex-1 flex flex-col min-w-0 h-screen overflow-hidden md:pb-0",
        fullScreenMode ? "pb-0" : "pb-20"
      )}>

        <main className="flex-1 overflow-auto">
          <div className="p-3 sm:p-4 lg:p-6 mx-auto w-full max-w-[1600px]">
            {activePage === 'workout' && <WorkoutSchedulerPage syncKey={syncKey} targetDate={selectedHistoryDate} />}
            {activePage === 'health' && <HealthPage settings={settings} onFullScreenToggle={setFullScreenMode} />}
            {activePage === 'routines' && <RoutinesPage onEdit={(id) => { setEditRoutineId(id); setActivePage('edit-routine'); }} onOpenTrainingPlan={() => setActivePage('training-plan')} />}
            {activePage === 'edit-routine' && <EditRoutinePage routineId={editRoutineId} onBack={() => setActivePage('routines')} />}
            {activePage === 'training-plan' && <TrainingPlanPage onBack={() => setActivePage('routines')} />}
            {activePage === 'analytics' && <AnalyticsPage onDateSelect={handleDateSelect} />}
            {activePage === 'dayDetail' && <DayDetailPage date={selectedHistoryDate} onBack={() => setActivePage('analytics')} syncKey={syncKey} />}
            {activePage === 'profile' && <ProfilePage authState={authState} onDataRefreshed={() => setSyncNonce(n => n + 1)} onSettingsChange={setSettings} />}
          </div>

        </main>
      </div>

      {/* Floating Bottom Navigation for Mobile */}
      {!fullScreenMode && (
        <nav className="md:hidden fixed bottom-6 left-6 right-6 h-[72px] bg-white/20 dark:bg-black/40 border-t-[0.5px] border-white/50 dark:border-white/10 flex items-center justify-around z-[9999] rounded-[32px] shadow-[0_10px_40px_rgba(0,0,0,0.1)] transition-all duration-300"
          style={{
            backdropFilter: 'blur(30px) saturate(210%) contrast(110%)',
            WebkitBackdropFilter: 'blur(30px) saturate(210%) contrast(110%)'
          }}>
        {[
          { id: 'workout', name: 'Training', icon: Calendar },
          { id: 'health', name: 'Health', icon: Activity },
          { id: 'routines', name: 'Routines', icon: Sparkles },
          { id: 'analytics', name: 'Insights', icon: BarChart3 },
          { id: 'profile', name: 'Profile', icon: User },
        ].map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            onClick={() => setActivePage(item.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 h-14 w-14 px-0 transition-all rounded-full",
              activePage === item.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className={cn(
              "p-2 rounded-full transition-all duration-300",
              activePage === item.id ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(212,255,0,0.3)] scale-110" : "bg-transparent"
            )}>
              <item.icon size={18} strokeWidth={activePage === item.id ? 2.5 : 2} />
            </div>
            <span className={cn(
              "text-[8px] font-black uppercase tracking-tight",
              activePage === item.id ? "text-primary opacity-100 scale-105" : "text-muted-foreground opacity-60"
            )}>
              {item.name}
            </span>
          </Button>
        ))}
        </nav>
      )}
    </div>
  );
}


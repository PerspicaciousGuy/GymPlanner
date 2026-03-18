import { useState, useEffect } from 'react';
import { Sparkles, Calendar, LogIn, LogOut, Cloud, Trash2, RefreshCw, BarChart3, History, User } from 'lucide-react';

import Navbar from './components/Navbar';
import WorkoutSchedulerPage from './pages/WorkoutSchedulerPage';
import AnalyticsPage from './pages/AnalyticsPage';
import HistoryPage from './pages/HistoryPage';
import DayDetailPage from './pages/DayDetailPage';
import ProfilePage from './pages/ProfilePage';
import RoutinesPage from './pages/RoutinesPage';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import useFirebaseAuth from './hooks/useFirebaseAuth';
import { migrateCompletionToDateBased, migrateWorkoutsToDateBased, isDayComplete } from './utils/storage';
import { scheduleTomorrowSummary } from './utils/notificationService';

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
    
    // Check for tomorrow's workout reminder
    // Small delay to ensure storage is ready and main UI is rendered
    const timer = setTimeout(() => {
      scheduleTomorrowSummary();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

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

    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex w-20 lg:w-24 bg-card border-r border-border flex-col items-center py-8 gap-10 sticky top-0 h-screen z-50 shadow-2xl">
        <div className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
            <span className="text-xl font-bold tracking-tighter">G</span>
          </div>
          <span className="text-[10px] font-black text-primary uppercase tracking-tighter">Planner</span>
        </div>

        <nav className="flex flex-col gap-6 flex-1">
          {[
            { id: 'workout', name: 'Training', icon: Calendar },
            { id: 'history', name: 'History', icon: History },
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
                "w-14 h-14 flex-col gap-1 p-0 rounded-2xl transition-all duration-300",
                activePage === item.id
                  ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(212,255,0,0.2)] hover:bg-primary/90 hover:text-primary-foreground scale-110 active:scale-95"
                  : "text-slate-500 hover:bg-white/5 hover:text-primary"
              )}
            >
              <item.icon size={20} strokeWidth={activePage === item.id ? 3 : 2} />
              <span className="text-[9px] font-black uppercase tracking-tighter">{item.name}</span>
            </Button>
          ))}
        </nav>

        <div className="flex flex-col items-center gap-3">
          <div className={`w-1.5 h-1.5 rounded-full transition-all ${syncScope.startsWith('local') ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'}`} />
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setSyncNonce(n => n + 1)}
            className="rounded-xl p-2 text-slate-500 hover:bg-white/5 hover:text-primary transition-all border-border shadow-sm"
          >
            <RefreshCw size={18} />
          </Button>
          
          <Button variant="outline" size="icon" className="shadow-xs border-primary/20 text-primary hover:bg-primary/10 rounded-xl">
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
            { activePage === 'workout' && <WorkoutSchedulerPage syncKey={ syncKey } targetDate={ selectedHistoryDate } /> }
            { activePage === 'history' && <HistoryPage onDateSelect={ handleDateSelect } /> }
            { activePage === 'dayDetail' && <DayDetailPage date={ selectedHistoryDate } onBack={ () => setActivePage('history') } syncKey={ syncKey } /> }
            { activePage === 'routines' && <RoutinesPage /> }
            { activePage === 'analytics' && <AnalyticsPage /> }
            { activePage === 'profile' && <ProfilePage authState={ authState } onDataRefreshed={ () => setSyncNonce(n => n + 1) } /> }
          </div>

        </main>
      </div>

      {/* Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-6 left-4 right-4 h-20 bg-card/95 border border-white/5 rounded-[2rem] px-2 flex items-center justify-around z-50 shadow-2xl backdrop-blur-xl">
        {[
          { id: 'workout', name: 'Training', icon: Calendar },
          { id: 'history', name: 'History', icon: History },
          { id: 'routines', name: 'Routines', icon: Sparkles },
          { id: 'analytics', name: 'Insights', icon: BarChart3 },
          { id: 'profile', name: 'Profile', icon: User },
        ].map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            onClick={() => setActivePage(item.id)}
            className={cn(
              "flex-col gap-1.5 h-16 w-16 px-0 transition-all active:scale-90",
              activePage === item.id ? "text-primary" : "text-slate-500"
            )}
          >
            <div className={cn(
              "p-2.5 rounded-2xl transition-all duration-300",
              activePage === item.id ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110" : "bg-transparent hover:bg-white/5"
            )}>
              <item.icon size={20} strokeWidth={activePage === item.id ? 3 : 2} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-tight">{item.name}</span>
          </Button>
        ))}
      </nav>
    </div>
  );
}


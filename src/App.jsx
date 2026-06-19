import { useMemo, useState, useEffect, lazy, Suspense } from 'react';
import { Sparkles, Calendar, BarChart3, User, Activity } from 'lucide-react';


import WorkoutSchedulerPage from './pages/WorkoutSchedulerPage';
import QuickActionHub from './components/health/QuickActionHub';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import useFirebaseAuth from './hooks/useFirebaseAuth';
import { migrateCompletionToDateBased, migrateWorkoutsToDateBased, isSessionFinished, getEffectiveSessionTitle } from './utils/storage';
import { loadSavedPlans } from './utils/trainingPlan';
import { scheduleTomorrowSummary } from './utils/notificationService';
import { loadSettings } from './utils/settings';

const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const DayDetailPage = lazy(() => import('./pages/DayDetailPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const RoutinesPage = lazy(() => import('./pages/RoutinesPage'));
const EditRoutinePage = lazy(() => import('./pages/EditRoutinePage'));
const TrainingPlanPage = lazy(() => import('./pages/TrainingPlanPage'));
const HealthPage = lazy(() => import('./pages/HealthPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const LandingPage = lazy(() => import('./pages/landing/LandingPage'));

const navItems = [
  { id: 'workout', name: 'Training', icon: Calendar },
  { id: 'health', name: 'Health', icon: Activity },
  { id: 'routines', name: 'Routines', icon: Sparkles },
  { id: 'analytics', name: 'Insights', icon: BarChart3 },
  { id: 'profile', name: 'Profile', icon: User },
];

const capturePageMap = {
  landing: 'landing',
  training: 'workout',
  workout: 'workout',
  health: 'health',
  routines: 'routines',
  analytics: 'analytics',
  profile: 'profile',
};

function getInitialPage() {
  if (typeof window === 'undefined') return 'landing';
  const capturePage = new URLSearchParams(window.location.search).get('capture');
  return capturePageMap[capturePage] || 'landing';
}

function PageFallback() {
  return (
    <div className="flex min-h-[240px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--app-border)] border-t-[var(--app-accent)]" />
    </div>
  );
}

function NavItemButton({ item, active, onClick, mobile = false }) {
  return (
    <Button
      key={item.id}
      variant="ghost"
      onClick={onClick}
      className={cn(
        "group rounded-[var(--app-radius-md)] transition-colors",
        mobile
          ? "h-14 flex-1 flex-col gap-1 px-1"
          : "h-14 w-16 flex-col gap-1 px-0",
        active
          ? "bg-[var(--app-accent-soft)] text-foreground"
          : "text-muted-foreground hover:bg-[var(--app-surface-muted)] hover:text-foreground"
      )}
    >
      <item.icon size={mobile ? 18 : 20} strokeWidth={active ? 2.5 : 2} />
      <span className="text-[9px] font-bold uppercase tracking-normal">{item.name}</span>
    </Button>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState(getInitialPage);
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(null);
  const [editRoutineId, setEditRoutineId] = useState(null);
  const [syncNonce, setSyncNonce] = useState(0);
  const [fullScreenMode, setFullScreenMode] = useState(false);
  const [healthInitialView, setHealthInitialView] = useState(null);
  const [quickStartTemplate, setQuickStartTemplate] = useState(null);
  const authState = useFirebaseAuth();
  const syncScope = authState.user?.uid || (authState.isConfigured ? 'signed-out' : 'local');
  const syncKey = `${syncScope}:${syncNonce}`;
  const isCaptureMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('capture');
  const hasSavedTrainingPlans = useMemo(() => loadSavedPlans().length > 0, [activePage, syncKey]);

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

  useEffect(() => {
    if (!isCaptureMode && !authState.loading && authState.user && activePage === 'landing') {
      setActivePage('workout');
    }
  }, [activePage, authState.loading, authState.user, isCaptureMode]);

  const showNavBar = !fullScreenMode && !['landing', 'training-plan', 'edit-routine', 'dayDetail', 'login'].includes(activePage);

  const handleDateSelect = (date) => {
    setSelectedHistoryDate(date);
    
    const pmTitle = getEffectiveSessionTitle(date, 'pm').trim().toLowerCase();
    const isOff = (txt) => txt === '' || txt === 'off' || txt === 'rest' || txt.startsWith('off ') || txt.startsWith('rest ');
    const hasPlannedPm = !isOff(pmTitle);
    
    const complete = isSessionFinished(date, 'am') && (!hasPlannedPm || isSessionFinished(date, 'pm'));
    if (complete) {
      setActivePage('dayDetail');
    } else {
      setActivePage('workout');
    }
  };

  return (

    <div className="flex min-h-screen flex-col bg-[var(--app-bg)] md:flex-row">
      {/* Sidebar for Desktop */}
      {showNavBar && (
        <aside className="sticky top-0 z-50 hidden h-screen w-24 flex-col items-center gap-8 border-r border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-6 md:flex">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-[var(--app-radius-md)] bg-foreground text-background shadow-[var(--app-shadow-sm)]">
              <span className="text-xl font-bold">G</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-normal text-muted-foreground">Planner</span>
          </div>

          <nav className="flex flex-1 flex-col gap-2">
            {navItems.map((item) => (
              <NavItemButton
                key={item.id}
                item={item}
                active={activePage === item.id}
                onClick={() => {
                  setActivePage(item.id);
                  if (item.id === 'workout') {
                    setSelectedHistoryDate(null);
                  }
                }}
              />
            ))}
          </nav>

        </aside>
      )}

      {/* Main Content Area */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 h-screen overflow-hidden md:pb-0",
        showNavBar ? "pb-20" : "pb-0"
      )}>

        <main className="flex-1 overflow-auto">
          <div className={cn(
            "mx-auto w-full",
            activePage === 'landing' ? "max-w-none p-0" : "max-w-[1600px] p-4 sm:p-5 lg:p-7"
          )}>
            {activePage === 'workout' && (
              <WorkoutSchedulerPage
                syncKey={syncKey}
                targetDate={selectedHistoryDate}
                onCreateTrainingPlan={() => setActivePage('training-plan')}
                onUseQuickStartTemplate={(template) => {
                  setQuickStartTemplate(template);
                  setActivePage('training-plan');
                }}
              />
            )}
            {activePage !== 'workout' && (
              <Suspense fallback={<PageFallback />}>
                {activePage === 'landing' && (
                  <LandingPage
                    onStart={() => setActivePage(authState.isConfigured ? 'login' : 'workout')}
                    onSignIn={() => setActivePage('login')}
                    onOpenPlanner={() => setActivePage('workout')}
                  />
                )}
                {activePage === 'health' && (
                  <HealthPage 
                    settings={settings} 
                    onFullScreenToggle={setFullScreenMode} 
                    initialSubView={healthInitialView}
                    onSubViewConsumed={() => setHealthInitialView(null)}
                  />
                )}
                {activePage === 'routines' && <RoutinesPage syncKey={syncKey} onEdit={(id) => { setEditRoutineId(id); setActivePage('edit-routine'); }} onOpenTrainingPlan={() => setActivePage('training-plan')} />}
                {activePage === 'edit-routine' && <EditRoutinePage routineId={editRoutineId} onBack={() => setActivePage('routines')} />}
                {activePage === 'training-plan' && (
                  <TrainingPlanPage
                    syncKey={syncKey}
                    initialQuickStartTemplate={quickStartTemplate}
                    onQuickStartTemplateConsumed={() => setQuickStartTemplate(null)}
                    onStartLogging={() => {
                      setSelectedHistoryDate(null);
                      setSyncNonce(n => n + 1);
                      setActivePage('workout');
                    }}
                    onBack={() => setActivePage('routines')}
                  />
                )}
                {activePage === 'analytics' && <AnalyticsPage onDateSelect={handleDateSelect} />}
                {activePage === 'dayDetail' && <DayDetailPage date={selectedHistoryDate} onBack={() => setActivePage('analytics')} syncKey={syncKey} />}
                {activePage === 'profile' && <ProfilePage authState={authState} onDataRefreshed={() => setSyncNonce(n => n + 1)} onSettingsChange={setSettings} onNavigateToLogin={() => setActivePage('login')} />}
                {activePage === 'login' && <LoginPage authState={authState} onLoginSuccess={() => setActivePage('profile')} onBack={() => setActivePage('landing')} />}
              </Suspense>
            )}
          </div>
        </main>

        {!fullScreenMode && hasSavedTrainingPlans && !['landing', 'login'].includes(activePage) && (
          <QuickActionHub 
            onNavigateToHealth={(view) => {
              setHealthInitialView(view);
              setActivePage('health');
            }}
          />
        )}
      </div>

      {/* Floating Bottom Navigation for Mobile */}
      {showNavBar && (
        <nav className="fixed bottom-4 left-4 right-4 z-[9999] flex h-[72px] items-center gap-1 rounded-[var(--app-radius-lg)] border border-[var(--app-border)] bg-[var(--app-surface)] p-2 shadow-[var(--app-shadow-md)] transition-all duration-300 md:hidden"
          style={{
            backdropFilter: 'blur(18px) saturate(160%)',
            WebkitBackdropFilter: 'blur(18px) saturate(160%)'
          }}>
        {navItems.map((item) => (
          <NavItemButton
            key={item.id}
            item={item}
            active={activePage === item.id}
            mobile
            onClick={() => setActivePage(item.id)}
          />
        ))}
        </nav>
      )}
    </div>
  );
}

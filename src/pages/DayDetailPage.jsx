import { useMemo, useState } from 'react';
import { ChevronLeft, Calendar as CalendarIcon, Weight, Layers, Zap, List, LayoutGrid, Sun, Moon, CheckCircle2, AlertCircle, XCircle, Flame, Droplet, Cookie, Drumstick, Utensils } from 'lucide-react';
import WorkoutSection from '../components/WorkoutSection';
import WorkoutLogView from '../components/WorkoutLogView';
import { formatDateDisplay, formatDateKey, getDayOfWeek } from '../utils/dateUtils';
import { loadWorkoutByDate, isDayComplete, isDaySkipped, getEffectiveSessionTitle } from '../utils/storage';
import { loadTrainingPlan } from '../utils/trainingPlan';
import { getDailyFocus } from '../utils/recoveryLogic';
import InteractiveMuscleMap from '../components/InteractiveMuscleMap/InteractiveMuscleMap';
import { getFoodLog, getDailyTotals } from '../utils/foodDatabase';
import { getWeightForDate } from '../utils/vitalsDatabase';
import { cn } from "@/lib/utils";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/layout/Panel";
import { Button } from "@/components/ui/button";

export default function DayDetailPage({ date, onBack, syncKey }) {
  const dateStr = formatDateKey(date);
  const dayName = getDayOfWeek(date);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [viewMode, setViewMode] = useState('activity');
  const [activeSession, setActiveSession] = useState('am');

  const dayData = useMemo(() => loadWorkoutByDate(dateStr), [dateStr, syncKey, refreshTrigger]);
  const foodLog = useMemo(() => getFoodLog(dateStr), [dateStr, syncKey, refreshTrigger]);
  const foodTotals = useMemo(() => getDailyTotals(dateStr), [dateStr, syncKey, refreshTrigger]);
  const bodyWeight = useMemo(() => getWeightForDate(dateStr), [dateStr, syncKey, refreshTrigger]);

  const amTitle = getEffectiveSessionTitle(date, 'am');
  const pmTitle = getEffectiveSessionTitle(date, 'pm');
  const isOff = (txt) => !txt || ['off', 'rest', ''].includes(txt.trim().toLowerCase()) || txt.trim().toLowerCase().startsWith('off ') || txt.trim().toLowerCase().startsWith('rest ');

  const plannedAm = !isOff(amTitle);
  const plannedPm = !isOff(pmTitle);

  const plan = useMemo(() => loadTrainingPlan(), [syncKey]);

  const hasDataInPm = useMemo(() => {
    const pm = dayData.pm || {};
    const hasGroups = pm.groups?.some(g => g.rows?.some(r => (r.exercise || '').trim() || (r.weight || '').trim() || (r.reps || '').trim()));
    const hasStandalone = (pm.standaloneExercises || []).length > 0;
    return !!(hasGroups || hasStandalone);
  }, [dayData]);

  const shouldShowSessionSwitcher = plannedPm || hasDataInPm;

  const statusInfo = useMemo(() => {
    const amDone = isDayComplete(dateStr, 'am');
    const pmDone = isDayComplete(dateStr, 'pm');
    const amSkipped = isDaySkipped(dateStr, 'am');
    const pmSkipped = isDaySkipped(dateStr, 'pm');

    const amOk = plannedAm ? (amDone || amSkipped) : true;
    const pmOk = plannedPm ? (pmDone || pmSkipped) : true;

    if (amOk && pmOk) {
      if ((plannedAm && amSkipped) || (plannedPm && pmSkipped)) {
        if ((plannedAm && amDone) || (plannedPm && pmDone)) {
          return { label: 'Partial', color: 'text-[var(--app-text-soft)] bg-[var(--app-surface-muted)]', icon: <AlertCircle size={12} /> };
        }
        return { label: 'Skipped', color: 'text-muted-foreground bg-[var(--app-surface-muted)]', icon: <XCircle size={12} className="rotate-45" /> };
      }
      return { label: 'Completed', color: 'text-foreground bg-[var(--app-accent-soft)]', icon: <CheckCircle2 size={12} /> };
    }

    if (amDone || pmDone) return { label: 'Partial', color: 'text-[var(--app-text-soft)] bg-[var(--app-surface-muted)]', icon: <AlertCircle size={12} /> };

    if (amSkipped || pmSkipped) return { label: 'Skipped', color: 'text-muted-foreground bg-[var(--app-surface-muted)]', icon: <XCircle size={12} className="rotate-45" /> };

    return { label: 'Missed', color: 'text-destructive bg-destructive/10', icon: <AlertCircle size={12} /> };
  }, [dateStr, dayName, plannedAm, plannedPm]);

  const stats = useMemo(() => {
    let totalVolume = 0;
    let totalSets = 0;
    const musclesSet = new Set();
    let topExercise = { name: '-', volume: 0 };

    ['am', 'pm'].forEach(session => {
      const sessionData = dayData[session] || {};

      // Traditional Groups
      sessionData.groups?.forEach(group => {
        let groupVolume = 0;
        group.rows?.forEach(row => {
          if (row.muscle) musclesSet.add(row.muscle);
          const weight = parseFloat(row.weight) || 0;
          const reps = parseInt(row.reps) || 0;
          const sets = parseInt(row.sets) || 0;
          const vol = weight * reps * sets;
          totalVolume += vol;
          totalSets += sets;
          groupVolume += vol;
        });
        if (groupVolume > topExercise.volume && group.title) {
          topExercise = { name: group.title, volume: groupVolume };
        }
      });

      // Standalone Advanced Exercises
      sessionData.standaloneExercises?.forEach(ex => {
        if (ex.muscle) musclesSet.add(ex.muscle);
        let exVolume = 0;
        let exSets = 0;
        ex.sets?.forEach(set => {
          const weight = parseFloat(set.weight) || 0;
          const reps = parseInt(set.reps) || 0;
          exVolume += weight * reps;
          exSets += 1;

          // Multi-drop support
          const drops = set.drops || (set.isDrop && (set.dropWeight || set.dropReps) ? [{ weight: set.dropWeight, reps: set.dropReps }] : []);
          drops.forEach(drop => {
            exVolume += (parseFloat(drop.weight) || 0) * (parseInt(drop.reps) || 0);
          });
        });
        totalVolume += exVolume;
        totalSets += exSets;
        if (exVolume > topExercise.volume && ex.exercise) {
          topExercise = { name: ex.exercise, volume: exVolume };
        }
      });
    });

    return {
      totalVolume,
      totalSets,
      muscles: Array.from(musclesSet),
      topExerciseName: topExercise.name
    };
  }, [dayData]);

  return (
    <PageShell className="animate-in slide-in-from-right-4 duration-500">
      <PageHeader
        title={dayName}
        meta={(
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
              <CalendarIcon size={14} />
              {formatDateDisplay(date)}
            </span>
            <div className={cn("flex items-center gap-1.5 rounded-full border border-current/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-normal", statusInfo.color)}>
              {statusInfo.icon}
              {statusInfo.label}
            </div>
          </div>
        )}
        actions={(
          <Button
            variant="outline"
            onClick={onBack}
            className="h-10 rounded-[var(--app-radius-md)] border-[var(--app-border)] bg-[var(--app-surface)] text-xs font-semibold text-muted-foreground shadow-none hover:bg-[var(--app-surface-muted)] hover:text-foreground"
          >
            <ChevronLeft size={16} className="mr-2" />
            Back
          </Button>
        )}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div className="lg:col-span-1 xl:col-span-1 space-y-6">
          <Panel className="overflow-hidden p-5 md:p-6">
            <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">Training Focus</h2>
            <div className="flex justify-center -mx-6">
              <InteractiveMuscleMap
                muscleStats={getDailyFocus(['am', 'pm'].map(session => ({ date: dateStr, ...dayData[session], session })))}
                size={140}
                noBackground={true}
              />
            </div>
          </Panel>

          <div className="grid grid-cols-2 gap-4">
            <StatBox
              icon={<Weight size={18} className="text-foreground" />}
              label="Total Volume"
              value={`${stats.totalVolume.toLocaleString()} kg`}
            />
            <StatBox
              icon={<Layers size={18} className="text-foreground" />}
              label="Total Sets"
              value={stats.totalSets}
            />
            {bodyWeight && (
              <StatBox
                icon={<Weight size={18} className="text-foreground" />}
                label="Body Weight"
                value={`${bodyWeight} kg`}
              />
            )}
            <Panel className="col-span-2 flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)]">
                <Zap size={20} className="text-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-normal">Main Movement</p>
                <p className="truncate text-sm font-semibold text-foreground">{stats.topExerciseName}</p>
              </div>
            </Panel>
          </div>
        </div>

        <Panel className="flex flex-col p-4 md:p-6 lg:col-span-2 xl:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-6">
              <h2 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-normal">Activity Log</h2>

              {shouldShowSessionSwitcher && (
                <div className="flex rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-1">
                  <button
                    onClick={() => setActiveSession('am')}
                    className={`flex items-center gap-2 rounded-[var(--app-radius-sm)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-normal transition-all ${
                      activeSession === 'am' ? 'border border-[var(--app-border)] bg-[var(--app-surface)] text-foreground shadow-[var(--app-shadow-sm)]' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {plan.sessionLayout === 'split' ? <><Sun size={12} /> AM</> : "Session 1"}
                  </button>
                  <button
                    onClick={() => setActiveSession('pm')}
                    className={`flex items-center gap-2 rounded-[var(--app-radius-sm)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-normal transition-all ${
                      activeSession === 'pm' ? 'border border-[var(--app-border)] bg-[var(--app-surface)] text-foreground shadow-[var(--app-shadow-sm)]' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {plan.sessionLayout === 'split' ? <><Moon size={12} /> PM</> : "Session 2"}
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-1">
              <button
                onClick={() => setViewMode('activity')}
                className={`flex items-center gap-2 rounded-[var(--app-radius-sm)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-normal transition-all ${
                  viewMode === 'activity' ? 'bg-foreground text-background shadow-[var(--app-shadow-sm)]' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <List size={12} /> Summary
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 rounded-[var(--app-radius-sm)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-normal transition-all ${
                  viewMode === 'grid' ? 'bg-foreground text-background shadow-[var(--app-shadow-sm)]' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutGrid size={12} /> Detailed Grid
              </button>
            </div>
          </div>

          <div className="animate-in fade-in zoom-in-95 duration-300 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            {viewMode === 'activity' ? (
              <WorkoutLogView
                dayData={dayData}
                sessionKey={activeSession}
                onEdit={() => setViewMode('grid')}
              />
            ) : (
              <WorkoutSection
                date={dateStr}
                dayName={dayName}
                syncToken={syncKey}
                onWorkoutChanged={() => setRefreshTrigger(prev => prev + 1)}
                initialData={dayData}
                hideBadge
                initialSession={activeSession}
              />
            )}
          </div>
        </Panel>

        <div className="lg:col-span-3 xl:col-span-1 space-y-6">
          <Panel className="flex h-full flex-col overflow-hidden p-5 md:p-6">
            <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">Nutrition Summary</h2>

            <div className="mb-6 flex items-center justify-between rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
              <div>
                <p className="text-2xl font-semibold text-foreground">{foodTotals.calories}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground"><Flame size={12} className="text-foreground"/> Calories</p>
              </div>
              <div className="flex gap-4 text-left">
                <div>
                  <p className="text-sm font-semibold text-foreground">{foodTotals.protein}g</p>
                  <p className="text-[9px] font-semibold uppercase tracking-normal text-muted-foreground">Pro</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{foodTotals.carbs}g</p>
                  <p className="text-[9px] font-semibold uppercase tracking-normal text-muted-foreground">Car</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{foodTotals.fats}g</p>
                  <p className="text-[9px] font-semibold uppercase tracking-normal text-muted-foreground">Fat</p>
                </div>
              </div>
            </div>

            <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">Logged Food</h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-2 max-h-[400px] scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              {foodLog.length === 0 ? (
                <div className="text-center py-8">
                  <Utensils size={24} className="mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-xs font-semibold text-muted-foreground">No food logged</p>
                </div>
              ) : (
                foodLog.map((entry) => (
                  <div key={entry.id} className="group flex items-center justify-between rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
                    <div className="min-w-0 pr-3">
                      <p className="truncate text-xs font-semibold text-foreground">{entry.food.name}</p>
                      <div className="flex items-center gap-2 mt-1 w-full flex-wrap">
                        <span className="flex-shrink-0 rounded-md border border-[var(--app-border)] px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">
                          {entry.servings}x {entry.food.servingSize || 'serving'}
                        </span>
                        {entry.food.brand && (
                          <span className="text-[9px] font-medium text-muted-foreground/80 truncate">
                            {entry.food.brand}
                          </span>
                        )}
                      </div>
                      {entry.food.ingredients && (
                        <p className="text-[9px] font-medium text-muted-foreground/60 mt-1 line-clamp-2">
                          Ing: {entry.food.ingredients}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs font-semibold text-foreground">{Math.round((entry.food.calories || 0) * entry.servings)} cal</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="h-11 rounded-[var(--app-radius-md)] border-[var(--app-border)] px-6 text-xs font-semibold uppercase tracking-normal text-muted-foreground shadow-none hover:bg-[var(--app-surface-muted)] hover:text-foreground"
        >
          Back to History
        </Button>
      </div>
    </PageShell>
  );
}

function StatBox({ icon, label, value }) {
  return (
    <Panel className="flex flex-col gap-2 p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)]">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold leading-tight text-foreground">{value}</p>
      </div>
    </Panel>
  );
}

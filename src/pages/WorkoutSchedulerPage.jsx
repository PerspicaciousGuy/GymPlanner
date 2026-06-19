import { useMemo, useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { 
  loadWorkoutByDate, 
  isSessionFinished, 
  syncPlannerData,
  getEffectiveSessionTitle,
  getDailyMetadata
} from '../utils/storage';
import { 
  getYesterday, 
  getToday, 
  getTomorrow, 
  getDayOfWeek, 
  formatDateCompact,
  getWeekStart,
  getWeekDates,
  isSameDay 
} from '../utils/dateUtils';
import WeekPicker from '../components/WeekPicker';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { loadSavedPlans, loadTrainingPlan, getCycleSlotForDate } from '../utils/trainingPlan';
import QuickHealthWidgets from '../components/health/QuickHealthWidgets';
import { PageShell } from '../components/layout/PageShell';
import { PageHeader } from '../components/layout/PageHeader';
import { Panel } from '../components/layout/Panel';
import { NewPlanEmptyState } from './workoutScheduler/NewPlanEmptyState';
import { AccordionSection, contextBadgeClasses, statusBadgeClass } from './workoutScheduler/AccordionSection';

export default function WorkoutSchedulerPage({ syncKey = 'local', targetDate = null, onCreateTrainingPlan, onUseQuickStartTemplate }) {
  const [selectedWeek, setSelectedWeek] = useState(() => getWeekStart(targetDate || new Date()));
  const [plannerRefreshNonce, setPlannerRefreshNonce] = useState(0);

  // Update selected week and expand when targetDate changes (e.g. from History)
  useEffect(() => {
    if (targetDate) {
      setSelectedWeek(getWeekStart(targetDate));
    } else {
      setSelectedWeek(getWeekStart(new Date()));
    }
  }, [targetDate]);
  
  const today = getToday();
  const yesterday = getYesterday();
  const tomorrow = getTomorrow();

  const [syncState, setSyncState] = useState('loading');

  useEffect(() => {
    syncPlannerData().then((ok) => setSyncState(ok ? 'ok' : 'offline'));
  }, [syncKey]);

  const hasSavedPlans = useMemo(() => loadSavedPlans().length > 0, [syncKey, plannerRefreshNonce, syncState]);

  const sections = useMemo(() => {
    const plan = loadTrainingPlan();
    const isDynamic = plan.mode === 'dynamic' && plan.cycle?.length > 0;
    const hasPlannedTraining = (date) => {
      const am = getEffectiveSessionTitle(date, 'am').trim().toLowerCase();
      const pm = getEffectiveSessionTitle(date, 'pm').trim().toLowerCase();
      const isOff = (txt) => txt === '' || txt === 'off' || txt === 'rest' || txt.startsWith('off ') || txt.startsWith('rest ');
      return !(isOff(am) && isOff(pm));
    };

    const hasPlannedPm = (date) => {
      const pm = getEffectiveSessionTitle(date, 'pm').trim().toLowerCase();
      const isOff = (txt) => txt === '' || txt === 'off' || txt === 'rest' || txt.startsWith('off ') || txt.startsWith('rest ');
      return !isOff(pm);
    };

    const currentWeekStart = getWeekStart(new Date());
    const isCurrentWeek = currentWeekStart.getTime() === selectedWeek.getTime();

      if (isCurrentWeek && !targetDate) {
        const yesterdayName = getDayOfWeek(yesterday);
        const todayName = getDayOfWeek(today);
        const tomorrowName = getDayOfWeek(tomorrow);

        const yesterdayMissed =
          hasPlannedTraining(yesterday) &&
          !isSessionFinished(yesterday, 'am') &&
          (!hasPlannedPm(yesterday) || !isSessionFinished(yesterday, 'pm'));
        
        const focusedList = [];
        if (yesterdayMissed) {
        const yesterdayComplete = isSessionFinished(yesterday, 'am') && (!hasPlannedPm(yesterday) || isSessionFinished(yesterday, 'pm'));
        focusedList.push({ 
          date: yesterday, 
          dayName: yesterdayName, 
          muscleGroup: '', 
          isMissed: true,  
          showContextBadge: true,
          defaultOpen: targetDate ? isSameDay(yesterday, targetDate) : true,
          isFullyComplete: yesterdayComplete,
          data: loadWorkoutByDate(yesterday),
          cycleInfo: isDynamic ? getCycleSlotForDate(yesterday, plan) : null,
          isShifted: !!getDailyMetadata(yesterday, 'am').isShifted || !!getDailyMetadata(yesterday, 'pm').isShifted,
          isShiftedFrom: !!getDailyMetadata(yesterday, 'am').isShiftedFrom || !!getDailyMetadata(yesterday, 'pm').isShiftedFrom,
          shiftedFromLabel: (getDailyMetadata(yesterday, 'am').originalDate || getDailyMetadata(yesterday, 'pm').originalDate) 
            ? `${getDayOfWeek(getDailyMetadata(yesterday, 'am').originalDate || getDailyMetadata(yesterday, 'pm').originalDate).slice(0,3)}, ${formatDateCompact(getDailyMetadata(yesterday, 'am').originalDate || getDailyMetadata(yesterday, 'pm').originalDate)}` : null,
          shiftedToLabel: (getDailyMetadata(yesterday, 'am').shiftedToDate || getDailyMetadata(yesterday, 'pm').shiftedToDate) 
            ? `${getDayOfWeek(getDailyMetadata(yesterday, 'am').shiftedToDate || getDailyMetadata(yesterday, 'pm').shiftedToDate).slice(0,3)}, ${formatDateCompact(getDailyMetadata(yesterday, 'am').shiftedToDate || getDailyMetadata(yesterday, 'pm').shiftedToDate)}` : null,
        });
      }
      
      const todayComplete = isSessionFinished(today, 'am') && (!hasPlannedPm(today) || isSessionFinished(today, 'pm'));
      const todayAmMeta = getDailyMetadata(today, 'am');
      const todayPmMeta = getDailyMetadata(today, 'pm');
      focusedList.push({ 
        date: today, 
        dayName: todayName, 
        muscleGroup: '', 
        isMissed: false, 
        showContextBadge: true,
        defaultOpen: targetDate ? isSameDay(today, targetDate) : true,
        isFullyComplete: todayComplete,
        data: loadWorkoutByDate(today),
        cycleInfo: isDynamic ? getCycleSlotForDate(today, plan) : null,
        isShifted: !!todayAmMeta.isShifted || !!todayPmMeta.isShifted,
        isShiftedFrom: !!todayAmMeta.isShiftedFrom || !!todayPmMeta.isShiftedFrom,
        shiftedFromLabel: (todayAmMeta.originalDate || todayPmMeta.originalDate) 
          ? `${getDayOfWeek(todayAmMeta.originalDate || todayPmMeta.originalDate).slice(0,3)}, ${formatDateCompact(todayAmMeta.originalDate || todayPmMeta.originalDate)}` : null,
        shiftedToLabel: (todayAmMeta.shiftedToDate || todayPmMeta.shiftedToDate) 
          ? `${getDayOfWeek(todayAmMeta.shiftedToDate || todayPmMeta.shiftedToDate).slice(0,3)}, ${formatDateCompact(todayAmMeta.shiftedToDate || todayPmMeta.shiftedToDate)}` : null,
      });

      const tomorrowComplete = isSessionFinished(tomorrow, 'am') && (!hasPlannedPm(tomorrow) || isSessionFinished(tomorrow, 'pm'));
      const tomorrowAmMeta = getDailyMetadata(tomorrow, 'am');
      const tomorrowPmMeta = getDailyMetadata(tomorrow, 'pm');
      focusedList.push({ 
        date: tomorrow, 
        dayName: tomorrowName, 
        muscleGroup: '', 
        isMissed: false, 
        isTomorrow: true,
        showContextBadge: true,
        defaultOpen: targetDate ? isSameDay(tomorrow, targetDate) : false,
        isFullyComplete: tomorrowComplete,
        data: loadWorkoutByDate(tomorrow),
        cycleInfo: isDynamic ? getCycleSlotForDate(tomorrow, plan) : null,
        isShifted: !!tomorrowAmMeta.isShifted || !!tomorrowPmMeta.isShifted,
        isShiftedFrom: !!tomorrowAmMeta.isShiftedFrom || !!tomorrowPmMeta.isShiftedFrom,
        shiftedFromLabel: (tomorrowAmMeta.originalDate || tomorrowPmMeta.originalDate) 
          ? `${getDayOfWeek(tomorrowAmMeta.originalDate || tomorrowPmMeta.originalDate).slice(0,3)}, ${formatDateCompact(tomorrowAmMeta.originalDate || tomorrowPmMeta.originalDate)}` : null,
        shiftedToLabel: (tomorrowAmMeta.shiftedToDate || tomorrowPmMeta.shiftedToDate) 
          ? `${getDayOfWeek(tomorrowAmMeta.shiftedToDate || tomorrowPmMeta.shiftedToDate).slice(0,3)}, ${formatDateCompact(tomorrowAmMeta.shiftedToDate || tomorrowPmMeta.shiftedToDate)}` : null,
      });
      
      return focusedList.filter(s => !s.isFullyComplete);
    } else {
      const weekDates = getWeekDates(selectedWeek);
      const list = weekDates.map((date) => {
        const dayName = getDayOfWeek(date);
        const isFullyComplete = isSessionFinished(date, 'am') && (!hasPlannedPm(date) || isSessionFinished(date, 'pm'));
        const amMeta = getDailyMetadata(date, 'am');
        const pmMeta = getDailyMetadata(date, 'pm');
        return {
          date,
          dayName,
          muscleGroup: '',
          isMissed: false,
          isTomorrow: false,
          showContextBadge: false,
          defaultOpen: targetDate ? isSameDay(date, targetDate) : false,
          isFullyComplete,
          isShifted: !!amMeta.isShifted || !!pmMeta.isShifted,
          isShiftedFrom: !!amMeta.isShiftedFrom || !!pmMeta.isShiftedFrom,
          shiftedFromLabel: (amMeta.originalDate || pmMeta.originalDate) 
            ? `${getDayOfWeek(amMeta.originalDate || pmMeta.originalDate).slice(0,3)}, ${formatDateCompact(amMeta.originalDate || pmMeta.originalDate)}` : null,
          shiftedToLabel: (amMeta.shiftedToDate || pmMeta.shiftedToDate) 
            ? `${getDayOfWeek(amMeta.shiftedToDate || pmMeta.shiftedToDate).slice(0,3)}, ${formatDateCompact(amMeta.shiftedToDate || pmMeta.shiftedToDate)}` : null,
          data: loadWorkoutByDate(date),
          cycleInfo: isDynamic ? getCycleSlotForDate(date, plan) : null,        };
      });

      // If a specific date was targeted, only show THAT date
      // Filter out completed workouts to keep the hub focused on remaining tasks
      // BUT: preserve completed workouts if explicitly looking for a specific targetDate (e.g. from History)
      if (targetDate) {
        return list.filter(s => isSameDay(s.date, targetDate));
      }

      return list.filter(s => !s.isFullyComplete);
    }
  }, [syncState, selectedWeek, today, yesterday, tomorrow, plannerRefreshNonce, targetDate]);

  return (
    <PageShell>
      <PageHeader
        title="Training Hub"
        meta={(
          <>
            {syncState === 'loading' && (
              <div className={cn(statusBadgeClass, contextBadgeClasses.today, "animate-pulse py-1")}>
                <RefreshCw size={10} className="animate-spin" />
                <span>Syncing</span>
              </div>
            )}
            {syncState === 'offline' && (
              <div className={cn(statusBadgeClass, contextBadgeClasses.shifted, "py-1")}>
                <AlertCircle size={10} />
                <span>Offline</span>
              </div>
            )}
          </>
        )}
        actions={(
          <WeekPicker 
            currentWeekStart={selectedWeek} 
            onWeekChange={setSelectedWeek} 
            compact
          />
        )}
      />

      {hasSavedPlans && <QuickHealthWidgets />}

      <div className="flex flex-col">
        <AnimatePresence initial={false} mode="popLayout">
          {!hasSavedPlans ? (
            <NewPlanEmptyState onCreatePlan={onCreateTrainingPlan} onUseQuickStart={onUseQuickStartTemplate} />
          ) : sections.length > 0 ? (
            sections.map((s) => (
              <motion.div
                key={s.date.getTime()}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -100, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              >
                <AccordionSection
                  section={s}
                  defaultOpen={s.defaultOpen}
                  syncToken={syncState}
                  onWorkoutChanged={() => setPlannerRefreshNonce((value) => value + 1)}
                />
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2"
            >
              <Panel className="flex flex-col items-center justify-center gap-5 border-dashed py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-[var(--app-radius-lg)] border border-[var(--app-border)] bg-[var(--app-accent-soft)] text-foreground">
                  <CheckCircle2 size={34} strokeWidth={1.75} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold tracking-normal text-foreground">Focus achieved</h2>
                  <p className="mx-auto max-w-sm text-sm font-medium leading-6 text-muted-foreground">
                    All items for this period have been cleared. History updated with your progress.
                  </p>
                </div>
                <button 
                  onClick={() => setPlannerRefreshNonce(n => n + 1)}
                  className="inline-flex h-10 items-center justify-center rounded-[var(--app-radius-md)] border border-[var(--app-border)] px-4 text-xs font-semibold uppercase tracking-normal text-muted-foreground transition-colors hover:bg-[var(--app-surface-muted)] hover:text-foreground"
                >
                  Refresh <RefreshCw size={14} className="ml-2" />
                </button>
              </Panel>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageShell>
  );
}


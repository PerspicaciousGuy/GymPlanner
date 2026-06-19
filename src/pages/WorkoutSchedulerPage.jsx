import { useMemo, useState, useEffect } from 'react';
import { ChevronDown, AlertCircle, CheckCircle2, Clock, Plus, RefreshCw, Repeat } from 'lucide-react';
import WorkoutSection from '../components/WorkoutSection';
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
  formatDateDisplay,
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
import { QuickStartTemplatePicker } from './trainingPlan/QuickStartTemplatePicker';

const statusBadgeClass = "flex items-center gap-1.5 rounded-[var(--app-radius-sm)] border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-normal";
const contextBadgeClasses = {
  missed: "border-destructive/20 bg-destructive/10 text-destructive",
  upcoming: "border-[var(--app-border)] bg-[var(--app-surface-muted)] text-muted-foreground",
  today: "border-[var(--app-border)] bg-[var(--app-accent-soft)] text-foreground",
  shifted: "border-[var(--app-border-strong)] bg-[var(--app-surface-muted)] text-[var(--app-text-soft)]",
  rest: "border-[var(--app-border)] bg-[var(--app-surface-muted)] text-muted-foreground",
  cycle: "border-[var(--app-border)] bg-[var(--app-accent-soft)] text-foreground",
};

const dayBadgeBaseClass = "flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full border text-center shadow-[var(--app-shadow-sm)] md:h-16 md:w-16";
const dayBadgeStateClasses = {
  missed: "border-destructive/15 bg-destructive/10 text-destructive",
  today: "border-[var(--app-border)] bg-[var(--app-accent-soft)] text-foreground",
  upcoming: "border-[var(--app-border)] bg-[var(--app-surface-muted)] text-foreground",
  default: "border-[var(--app-border)] bg-[var(--app-surface-muted)] text-foreground",
};

function AccordionSection({ section, defaultOpen, syncToken, onWorkoutChanged }) {
  const [open, setOpen] = useState(defaultOpen && !section.isFullyComplete);

  // Sync open state with defaultOpen prop (e.g. when navigating from history)
  useEffect(() => {
    // Only force open if defaultOpen is true AND the day isn't already complete
    if (defaultOpen && !section.isFullyComplete) {
      setOpen(true);
    }
  }, [defaultOpen, section.isFullyComplete]);

  // Auto-collapse when day becomes fully complete
  useEffect(() => {
    if (section.isFullyComplete && open) {
      setOpen(false);
    }
  }, [section.isFullyComplete]);

  const badgeEl = section.showContextBadge ? (
    section.isMissed ? (
      <div className={cn(statusBadgeClass, contextBadgeClasses.missed, "animate-pulse")}>
        <AlertCircle size={10} strokeWidth={3} />
        <span>Missed</span>
      </div>
    ) : section.isTomorrow ? (
      <div className={cn(statusBadgeClass, contextBadgeClasses.upcoming)}>
        <Clock size={10} strokeWidth={3} />
        <span>Upcoming</span>
      </div>
    ) : (
      <div className={cn(statusBadgeClass, contextBadgeClasses.today)}>
        <CheckCircle2 size={10} strokeWidth={3} />
        <span>Today</span>
      </div>
    )
  ) : null;

  const shiftedBadge = (section.isShifted || section.isShiftedFrom) ? (
    <div className={cn(statusBadgeClass, contextBadgeClasses.shifted)}>
      <RefreshCw size={10} strokeWidth={3} className="animate-spin-slow" />
      <span>
        {section.isShiftedFrom 
          ? (section.shiftedToLabel ? `To ${section.shiftedToLabel}` : 'Shifted Out') 
          : (section.shiftedFromLabel ? `From ${section.shiftedFromLabel}` : 'Shifted In')
        }
      </span>
    </div>
  ) : null;

  const dayBadgeState = section.isMissed ? 'missed' : section.isTomorrow ? 'upcoming' : section.showContextBadge ? 'today' : 'default';
  const dayAbbreviation = section.dayName.slice(0, 3).toUpperCase();
  const dayNumber = section.date.getDate();

  return (
    <Panel
      className={cn(
        "mb-3 overflow-hidden transition-colors group/card",
        open ? "border-[var(--app-border-strong)]" : "bg-[var(--app-surface)]/80"
      )}
      interactive={!open}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center justify-between gap-4 bg-transparent px-4 py-4 text-left transition-colors md:px-5 md:py-4",
          open && "border-b border-[var(--app-border)]"
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
          <div className={cn(dayBadgeBaseClass, dayBadgeStateClasses[dayBadgeState])}>
            <span className="text-[9px] font-semibold uppercase leading-none tracking-normal text-[var(--app-text-soft)]">
              {dayAbbreviation}
            </span>
            <span className="mt-0.5 text-xl font-semibold leading-none tracking-normal text-foreground md:text-2xl">
              {dayNumber}
            </span>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
              <div className="min-w-0">
                <span className={`block truncate text-sm font-semibold tracking-normal md:text-base ${open ? 'text-foreground' : 'text-foreground'}`}>
                  {section.dayName}
                </span>
                <span className="mt-0.5 block text-[10px] font-medium text-muted-foreground md:text-xs">{formatDateDisplay(section.date)}</span>
              </div>

              <div className="flex origin-left scale-95 flex-wrap items-center gap-2 md:scale-100">
                {badgeEl}
                {shiftedBadge}
                {section.cycleInfo && (
                  <div className={cn(
                    statusBadgeClass,
                    section.cycleInfo.slot?.type === 'rest'
                      ? contextBadgeClasses.rest
                      : contextBadgeClasses.cycle
                  )}>
                    <Repeat size={10} strokeWidth={3} />
                    <span>
                      Day {section.cycleInfo.position + 1}/{section.cycleInfo.cycleLength}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {section.muscleGroup && (
              <span className="hidden max-w-[220px] truncate text-[10px] font-semibold text-muted-foreground md:text-[11px] sm:block">
                {section.muscleGroup}
              </span>
            )}
          </div>
        </div>
        
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="p-1.5 rounded-[var(--app-radius-sm)] bg-[var(--app-surface-muted)] text-muted-foreground group-hover:text-foreground transition-colors"
        >
          <ChevronDown size={14} strokeWidth={3} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-transparent overflow-hidden"
          >
            <div className="px-3 md:px-4 py-4">
              <WorkoutSection
                date={section.date}
                dayName={section.dayName}
                muscleGroup={section.muscleGroup}
                isMissed={section.isMissed}
                isTomorrow={section.isTomorrow}
                initialData={section.data}
                syncToken={syncToken}
                onWorkoutChanged={onWorkoutChanged}
                hideBadge
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Panel>
  );
}

function NewPlanEmptyState({ onCreatePlan, onUseQuickStart }) {
  const [showTemplates, setShowTemplates] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2"
    >
      <Panel className="overflow-hidden p-0">
        <div className="grid gap-0 md:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-center gap-6 p-6 md:p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-[var(--app-radius-lg)] border border-[var(--app-border)] bg-[var(--app-accent-soft)] text-foreground shadow-[var(--app-shadow-sm)]">
              <Repeat size={28} strokeWidth={1.8} />
            </div>

            <div className="space-y-3">
              <h2 className="max-w-lg text-2xl font-semibold leading-tight tracking-normal text-foreground md:text-3xl">
                Create your training split.
              </h2>
              <p className="max-w-lg text-sm font-medium leading-6 text-muted-foreground">
                Choose a fixed week or rotating cycle, name your days, then this hub becomes your daily workout log.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onCreatePlan}
                className="inline-flex h-11 items-center justify-center rounded-[var(--app-radius-md)] bg-foreground px-5 text-[11px] font-semibold uppercase tracking-normal text-background shadow-[var(--app-shadow-sm)] transition-colors hover:bg-foreground/90"
              >
                <Plus size={15} className="mr-2" strokeWidth={3} />
                Build Training Plan
              </button>
              <button
                type="button"
                onClick={() => setShowTemplates((value) => !value)}
                className="inline-flex h-11 items-center justify-center rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] px-5 text-[11px] font-semibold uppercase tracking-normal text-foreground shadow-[var(--app-shadow-sm)] transition-colors hover:bg-[var(--app-surface-muted)]"
              >
                Use Quick Start
              </button>
            </div>

            {showTemplates && (
              <div className="pt-1">
                <QuickStartTemplatePicker onSelect={onUseQuickStart} />
              </div>
            )}
          </div>

          <div className="border-t border-[var(--app-border)] bg-[var(--app-surface-muted)] p-5 md:border-l md:border-t-0 md:p-6">
            <div className="space-y-3">
              {[
                ['1', 'Choose fixed week or dynamic cycle'],
                ['2', 'Name each training day'],
                ['3', 'Start logging from the Training Hub'],
              ].map(([step, label]) => (
                <div key={step} className="flex items-center gap-3 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] p-3 shadow-[var(--app-shadow-sm)]">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--app-radius-sm)] bg-foreground text-xs font-semibold text-background">
                    {step}
                  </div>
                  <p className="text-xs font-semibold tracking-normal text-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Panel>
    </motion.div>
  );
}

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


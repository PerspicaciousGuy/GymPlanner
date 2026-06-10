import { useState, useMemo } from 'react';
import { 
  ChevronLeft,
  ChevronRight, 
  CheckCircle2, 
  Circle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/layout/Panel";
import { 
  getMonthCalendarDays, 
  getPreviousMonth, 
  getNextMonth, 
  formatDateKey,
  isSameDay,
  getToday
} from '../utils/dateUtils';
import { loadWorkoutByDate, isDayComplete, isDaySkipped, getEffectiveSessionTitle } from '../utils/storage';

const historyNavShellClass =
  "flex max-w-full items-center gap-1 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] p-1 shadow-[var(--app-shadow-sm)] sm:gap-2";

const historyNavButtonClass =
  "h-8 rounded-[var(--app-radius-sm)] text-muted-foreground transition-colors hover:bg-[var(--app-surface-muted)] hover:text-foreground";

const historyDayHeaderClass =
  "py-2 text-center text-[11px] font-semibold uppercase tracking-normal text-muted-foreground";

const historyLegendItemClass =
  "flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-normal text-muted-foreground";

const statusStyle = {
  completed: {
    iconShell: "border-[var(--status-completed-border)] bg-[var(--status-completed-bg)]",
    icon: "text-[var(--status-completed)]",
    dot: "bg-[var(--status-completed)]",
  },
  partial: {
    iconShell: "border-[var(--status-skipped-border)] bg-[var(--status-skipped-bg)]",
    icon: "text-[var(--status-skipped)]",
    dot: "bg-[var(--status-skipped)]",
  },
  skipped: {
    iconShell: "border-[var(--status-skipped-border)] bg-[var(--status-skipped-bg)]",
    icon: "text-[var(--status-skipped)]",
    dot: "bg-[var(--status-skipped)]",
  },
  missed: {
    iconShell: "border-[var(--status-missed-border)] bg-[var(--status-missed-bg)]",
    icon: "text-[var(--status-missed)]",
    dot: "bg-[var(--status-missed)]",
  },
  planned: {
    iconShell: "border-[var(--app-border)] bg-muted",
    icon: "text-muted-foreground/50",
    dot: "bg-muted-foreground/40",
  },
};

export default function HistoryPage({ onDateSelect }) {
  const [viewDate, setViewDate] = useState(getToday());
  
  const calendarDays = useMemo(() => getMonthCalendarDays(viewDate), [viewDate]);
  
  const currentMonth = viewDate.getMonth();
  
  const monthLabel = viewDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const handlePrevMonth = () => setViewDate(getPreviousMonth(viewDate));
  const handleNextMonth = () => setViewDate(getNextMonth(viewDate));
  const handleToday = () => setViewDate(getToday());

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <PageHeader
        title="Workout History"
        description="Review and manage past sessions."
        actions={(
          <div className={historyNavShellClass}>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handlePrevMonth}
              className={cn(historyNavButtonClass, "w-8")}
            >
              <ChevronLeft size={16} className="sm:size-[18px]" />
            </Button>
            <div className="min-w-[120px] flex-1 truncate px-1 py-1.5 text-center text-[11px] font-semibold uppercase tracking-normal text-foreground sm:min-w-[160px] sm:px-4 sm:text-sm">
              {monthLabel}
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleNextMonth}
              className={cn(historyNavButtonClass, "w-8")}
            >
              <ChevronRight size={16} className="sm:size-[18px]" />
            </Button>
            <div className="mx-1 h-5 w-px bg-[var(--app-border)] sm:mx-2" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToday}
              className={cn(historyNavButtonClass, "px-2 py-1.5 text-[10px] font-semibold uppercase tracking-normal text-foreground sm:px-4")}
            >
              Today
            </Button>
          </div>
        )}
      />

      <Panel className="overflow-hidden p-2 md:p-5">
        <div className="mb-2 grid grid-cols-7 md:mb-4">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className={historyDayHeaderClass}>
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5 sm:gap-3">
          {calendarDays.map((date, idx) => (
            <CalendarDay 
              key={idx} 
              date={date} 
              isCurrentMonth={date.getMonth() === currentMonth}
              onClick={() => onDateSelect(date)}
            />
          ))}
        </div>
      </Panel>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 border-t border-[var(--app-border)] py-6">
        <div className={historyLegendItemClass}>
          <CheckCircle2 size={16} className="text-[var(--status-completed)]" />
          Completed
        </div>
        <div className={historyLegendItemClass}>
          <LegendDot className="bg-[var(--status-skipped)]" />
          Partial
        </div>
        <div className={historyLegendItemClass}>
          <LegendDot className="bg-[var(--status-skipped)]" />
          Skipped
        </div>
        <div className={historyLegendItemClass}>
          <LegendDot className="bg-[var(--status-missed)]" />
          Missed
        </div>
        <div className={historyLegendItemClass}>
          <Circle size={16} className="text-muted-foreground/40" />
          Planned
        </div>
      </div>
    </div>
  );
}

function LegendDot({ className }) {
  return (
    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--app-surface-muted)]">
      <div className={cn("h-2 w-2 rounded-full", className)} />
    </div>
  );
}

function CalendarDay({ date, isCurrentMonth, onClick }) {
  const isToday = isSameDay(date, getToday());
  const dateKey = formatDateKey(date);
  const dayWorkout = loadWorkoutByDate(dateKey);
  const status = getCalendarStatus({ date, dateKey, dayWorkout });
  const primaryMuscle = getPrimaryMuscle(dayWorkout);

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-[var(--app-radius-sm)] border p-1 transition-all active:scale-95 sm:rounded-[var(--app-radius-md)] sm:p-2 md:aspect-[4/3]",
        isCurrentMonth ? 'bg-[var(--app-surface)] shadow-[var(--app-shadow-sm)]' : 'bg-[var(--app-surface-muted)] opacity-40',
        isToday ? 'border-foreground ring-2 ring-foreground/10' : 'border-[var(--app-border)]',
        "hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface-raised)]"
      )}
    >
      <span className="text-[11px] font-semibold text-foreground sm:mb-1.5 sm:text-[15px]">
        {date.getDate()}
      </span>

      <div className="flex min-h-[14px] flex-col items-center gap-1 sm:gap-1.5">
        <StatusMarker status={status} />
        {primaryMuscle && (
          <Badge variant="outline" className="hidden max-w-[90%] truncate border-[var(--app-border)] px-1 py-0 text-[8px] font-semibold uppercase tracking-normal text-muted-foreground sm:flex">
            {primaryMuscle}
          </Badge>
        )}
      </div>
    </button>
  );
}

function getCalendarStatus({ date, dateKey, dayWorkout }) {
  const isToday = isSameDay(date, getToday());
  const isPast = date < getToday();
  const amTitle = getEffectiveSessionTitle(date, 'am');
  const pmTitle = getEffectiveSessionTitle(date, 'pm');
  const doneAm = isDayComplete(dateKey, 'am');
  const donePm = isDayComplete(dateKey, 'pm');
  const skipAm = isDaySkipped(dateKey, 'am');
  const skipPm = isDaySkipped(dateKey, 'pm');
  const plannedAm = !isOffSession(amTitle);
  const plannedPm = !isOffSession(pmTitle);
  const isPlanned = plannedAm || plannedPm;
  const hasLoggedWorkout = hasAnyLoggedWorkout(dayWorkout);

  if (isPast || isToday) {
    if (isPlanned || hasLoggedWorkout) {
      const allOk = (plannedAm ? doneAm : true) && (plannedPm ? donePm : true);
      const anyDone = (plannedAm && doneAm) || (plannedPm && donePm);
      const anySkipped = (plannedAm && skipAm) || (plannedPm && skipPm);

      if (allOk) {
        return 'completed';
      }
      if (anyDone) return 'partial';
      if (anySkipped) return 'skipped';
      return 'missed';
    }
  } else if (isPlanned) {
    return 'planned';
  }

  return 'none';
}

function isOffSession(text) {
  if (!text) return true;
  const normalized = text.trim().toLowerCase();
  return ['off', 'rest', ''].includes(normalized) || normalized.startsWith('off ') || normalized.startsWith('rest ');
}

function hasAnyLoggedWorkout(dayWorkout) {
  return (dayWorkout.am?.groups?.length > 0) ||
    (dayWorkout.am?.standaloneExercises?.length > 0) ||
    (dayWorkout.pm?.groups?.length > 0) ||
    (dayWorkout.pm?.standaloneExercises?.length > 0);
}

function getPrimaryMuscle(dayWorkout) {
  const muscles = [];

  ['am', 'pm'].forEach(sessionKey => {
    const session = dayWorkout[sessionKey] || {};

    session.groups?.forEach(group => {
      group.rows?.forEach(row => {
        if (row.muscle) muscles.push(row.muscle);
      });
    });

    session.standaloneExercises?.forEach(exercise => {
      if (exercise.muscle) muscles.push(exercise.muscle);
    });
  });

  if (muscles.length === 0) return null;

  return muscles.sort((a, b) =>
    muscles.filter(value => value === a).length - muscles.filter(value => value === b).length
  ).pop();
}

function StatusMarker({ status }) {
  if (status === 'none') return null;

  const styles = statusStyle[status];

  return (
    <>
      <div className="hidden flex-col items-center gap-1.5 sm:flex">
        <div className={cn("rounded-full border p-1", styles.iconShell)}>
          {status === 'completed' ? (
            <CheckCircle2 size={16} className={styles.icon} />
          ) : (
            <Circle size={16} className={styles.icon} fill="currentColor" fillOpacity={0.2} />
          )}
        </div>
      </div>
      <div className="mt-1 flex items-center gap-1 sm:hidden">
        <div className={cn("h-1.5 w-1.5 rounded-full", styles.dot)} />
      </div>
    </>
  );
}

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
          <div className="flex max-w-full items-center gap-1 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] p-1 shadow-[var(--app-shadow-sm)] sm:gap-2">
          <Button 
            variant="ghost"
            size="icon-sm"
            onClick={handlePrevMonth}
            className="h-8 w-8 rounded-lg text-muted-foreground transition-colors hover:bg-[var(--app-surface-muted)] hover:text-foreground"
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
            className="h-8 w-8 rounded-lg text-muted-foreground transition-colors hover:bg-[var(--app-surface-muted)] hover:text-foreground"
          >
            <ChevronRight size={16} className="sm:size-[18px]" />
          </Button>
          <div className="mx-1 h-5 w-px bg-[var(--app-border)] sm:mx-2" />
          <Button 
            variant="ghost"
            size="sm"
            onClick={handleToday}
            className="h-8 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-normal text-foreground transition-colors hover:bg-[var(--app-surface-muted)] sm:px-4"
          >
            Today
          </Button>
          </div>
        )}
      />

      <Panel className="overflow-hidden p-2 md:p-6">
        {/* Day Headers */}
        <div className="grid grid-cols-7 mb-4">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="py-2 text-center text-[12px] font-semibold uppercase tracking-normal text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
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
        <div className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
          <CheckCircle2 size={16} className="text-emerald-500" />
          Completed
        </div>
        <div className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
          </div>
          Partial
        </div>
        <div className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-yellow-500/20">
            <div className="h-2 w-2 rounded-full bg-yellow-500" />
          </div>
          Skipped
        </div>
        <div className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500/20">
            <div className="h-2 w-2 rounded-full bg-rose-500" />
          </div>
          Missed
        </div>
        <div className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
          <Circle size={16} className="text-muted-foreground/40" />
          Planned
        </div>
      </div>
    </div>
  );
}

function CalendarDay({ date, isCurrentMonth, onClick }) {
  const isToday = isSameDay(date, getToday());
  const isPast = date < getToday();
  const dateKey = formatDateKey(date);
  
  const amTitle = getEffectiveSessionTitle(date, 'am');
  const pmTitle = getEffectiveSessionTitle(date, 'pm');
  const isOff = (txt) => !txt || ['off', 'rest', ''].includes(txt.trim().toLowerCase()) || txt.trim().toLowerCase().startsWith('off ') || txt.trim().toLowerCase().startsWith('rest ');
  
  const dayWorkout = loadWorkoutByDate(dateKey);
  const doneAm = isDayComplete(dateKey, 'am');
  const donePm = isDayComplete(dateKey, 'pm');
  const skipAm = isDaySkipped(dateKey, 'am');
  const skipPm = isDaySkipped(dateKey, 'pm');

  const plannedAm = !isOff(amTitle);
  const plannedPm = !isOff(pmTitle);
  const isPlanned = plannedAm || plannedPm;
  
  const hasLoggedWorkout = (dayWorkout.am?.groups?.length > 0) || 
                           (dayWorkout.am?.standaloneExercises?.length > 0) ||
                           (dayWorkout.pm?.groups?.length > 0) ||
                           (dayWorkout.pm?.standaloneExercises?.length > 0);
  
  // Status Logic
  let status = 'none'; // 'completed', 'partial', 'skipped', 'planned', 'none'
  
  if (isPast || isToday) {
    if (isPlanned || hasLoggedWorkout) {
      const allOk = (plannedAm ? doneAm : true) && (plannedPm ? donePm : true);
      const anyDone = (plannedAm && doneAm) || (plannedPm && donePm);
      const anySkipped = (plannedAm && skipAm) || (plannedPm && skipPm);

      if (allOk) {
        status = 'completed';
      } else if (anyDone) {
        status = 'partial';
      } else if (anySkipped) {
        status = 'skipped';
      } else {
        status = 'missed';
      }
    }
  } else if (isPlanned) {
    status = 'planned';
  }
  
  // Find primary muscle for icon/label
  const getPrimaryMuscle = () => {
    const muscles = [];
    ['am', 'pm'].forEach(s => {
      const sess = dayWorkout[s] || {};
      sess.groups?.forEach(g => {
        g.rows?.forEach(r => {
          if (r.muscle) muscles.push(r.muscle);
        });
      });
      sess.standaloneExercises?.forEach(ex => {
        if (ex.muscle) muscles.push(ex.muscle);
      });
    });
    if (muscles.length === 0) return null;
    return muscles.sort((a,b) =>
      muscles.filter(v => v===a).length - muscles.filter(v => v===b).length
    ).pop();
  };
  
  const primaryMuscle = getPrimaryMuscle();

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-lg border p-1 transition-all active:scale-95 sm:rounded-[var(--app-radius-md)] sm:p-2 md:aspect-[4/3]",
        isCurrentMonth ? 'bg-[var(--app-surface)] shadow-[var(--app-shadow-sm)]' : 'bg-[var(--app-surface-muted)] opacity-40',
        isToday ? 'border-foreground ring-2 ring-foreground/10' : 'border-[var(--app-border)]',
        "hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface-raised)]"
      )}
    >
      <span className={cn(
        "text-[11px] font-semibold sm:mb-1.5 sm:text-[15px]",
        isToday ? 'text-foreground' : 'text-foreground'
      )}>
        {date.getDate()}
      </span>
      
      <div className="flex flex-col items-center gap-1 sm:gap-1.5 min-h-[14px]">
        {/* Desktop/Tablet Icon Markers */}
        <div className="hidden sm:flex flex-col items-center gap-1.5">
          {status === 'completed' && (
            <div className="bg-emerald-500/10 p-1 rounded-full border border-emerald-500/20">
               <CheckCircle2 size={16} className="text-emerald-500" />
            </div>
          )}
          {status === 'partial' && (
            <div className="bg-amber-500/10 p-1 rounded-full border border-amber-500/20">
               <Circle size={16} className="text-amber-500" fill="currentColor" fillOpacity={0.2} />
            </div>
          )}
          {status === 'skipped' && (
            <div className="bg-yellow-500/10 p-1 rounded-full border border-yellow-500/20 shadow-[0_0_12px_rgba(234,179,8,0.1)]">
               <Circle size={16} className="text-yellow-500" fill="currentColor" fillOpacity={0.2} />
            </div>
          )}
          {status === 'missed' && (
            <div className="bg-rose-500/10 p-1 rounded-full border border-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.1)]">
               <Circle size={16} className="text-rose-500" fill="currentColor" fillOpacity={0.2} />
            </div>
          )}
          {status === 'planned' && (
            <div className="bg-muted p-1 rounded-full border border-border">
               <Circle size={16} className="text-muted-foreground opacity-50" />
            </div>
          )}
          
          {primaryMuscle && (
            <Badge variant="outline" className="flex max-w-[90%] truncate border-[var(--app-border)] px-1 py-0 text-[8px] font-semibold uppercase tracking-normal text-muted-foreground">
              {primaryMuscle}
            </Badge>
          )}
        </div>

        {/* Mobile Dot Markers */}
        <div className="flex sm:hidden items-center gap-1 mt-1">
            <div className={cn(
              "w-1.5 h-1.5 rounded-full",
              status === 'completed' && "bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.4)]",
              status === 'partial' && "bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.4)]",
              status === 'skipped' && "bg-yellow-400 shadow-[0_0_4px_rgba(234,179,8,0.4)]",
              status === 'missed' && "bg-rose-400 shadow-[0_0_4px_rgba(244,63,94,0.4)]",
              status === 'planned' && "bg-muted-foreground opacity-30",
              status === 'none' && "hidden"
            )} />
        </div>
      </div>
    </button>
  );
}

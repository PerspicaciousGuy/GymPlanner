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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            Workout History
          </h1>
          <p className="text-[10px] md:text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Review and manage past sessions</p>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 bg-card p-1 rounded-2xl border border-border shadow-sm ring-1 ring-border/50 max-w-full">
          <Button 
            variant="ghost"
            size="icon-sm"
            onClick={handlePrevMonth}
            className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-muted text-muted-foreground hover:text-indigo-600 rounded-lg transition-colors"
          >
            <ChevronLeft size={16} className="sm:size-[18px]" />
          </Button>
          <div className="flex-1 px-1 sm:px-4 py-1.5 text-[11px] sm:text-sm font-black text-foreground min-w-[120px] sm:min-w-[160px] text-center uppercase tracking-tight truncate">
            {monthLabel}
          </div>
          <Button 
            variant="ghost"
            size="icon-sm"
            onClick={handleNextMonth}
            className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-muted text-muted-foreground hover:text-indigo-600 rounded-lg transition-colors"
          >
            <ChevronRight size={16} className="sm:size-[18px]" />
          </Button>
          <div className="w-px h-5 bg-border mx-1 sm:mx-2" />
          <Button 
            variant="ghost"
            size="sm"
            onClick={handleToday}
            className="px-2 sm:px-4 py-1.5 h-7 sm:h-8 hover:bg-muted text-[9px] sm:text-[11px] font-black text-indigo-600 uppercase tracking-widest transition-colors"
          >
            Today
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden p-2 md:p-6">
        {/* Day Headers */}
        <div className="grid grid-cols-7 mb-4">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="py-2 text-center text-[12px] font-black text-muted-foreground uppercase tracking-widest">
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
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 py-6 border-t border-border mt-4">
        <div className="flex items-center gap-2.5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
          <CheckCircle2 size={16} className="text-emerald-500" />
          Completed
        </div>
        <div className="flex items-center gap-2.5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
          <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          Partial
        </div>
        <div className="flex items-center gap-2.5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
          <div className="w-4 h-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
          </div>
          Skipped
        </div>
        <div className="flex items-center gap-2.5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
          <div className="w-4 h-4 rounded-full bg-rose-500/20 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
          </div>
          Missed
        </div>
        <div className="flex items-center gap-2.5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
          <Circle size={16} className="text-muted" />
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
        "relative aspect-square md:aspect-[4/3] rounded-lg sm:rounded-2xl flex flex-col items-center justify-center p-1 sm:p-2 border transition-all",
        isCurrentMonth ? 'bg-card shadow-sm' : 'bg-muted opacity-40',
        isToday ? 'border-indigo-600 ring-2 ring-indigo-600/10' : 'border-border',
        "hover:border-indigo-200 hover:shadow-lg active:scale-95 group overflow-hidden"
      )}
    >
      <span className={cn(
        "text-[11px] sm:text-[15px] font-black sm:mb-1.5",
        isToday ? 'text-indigo-600' : 'text-foreground'
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
            <Badge variant="outline" className="flex text-[8px] font-black text-muted-foreground border-border px-1 py-0 uppercase tracking-widest max-w-[90%] truncate">
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

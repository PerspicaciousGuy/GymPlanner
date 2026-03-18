import { useState, useMemo } from 'react';
import { 
  ChevronLeft,
  ChevronRight, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Circle,
  Dumbbell,
  History
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
import { loadWorkoutByDate, isDayComplete } from '../utils/storage';

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
        <div className="space-y-2">
          <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tighter leading-none italic uppercase">
            History Matrix
          </h1>
          <p className="text-[10px] md:text-xs text-slate-500 font-black uppercase tracking-[0.3em] mt-2 italic leading-relaxed">Analyze and monitor past structural performance</p>
        </div>

        <div className="flex items-center gap-2 bg-white/2 p-2 rounded-[2rem] border border-white/5 shadow-2xl backdrop-blur-xl max-w-full">
          <Button 
            variant="ghost"
            size="icon-sm"
            onClick={handlePrevMonth}
            className="h-10 w-10 hover:bg-white/5 text-slate-600 hover:text-primary rounded-xl transition-all"
          >
            <ChevronLeft size={20} strokeWidth={4} />
          </Button>
          <div className="flex-1 px-6 py-2 text-[12px] font-black text-foreground min-w-[140px] text-center uppercase tracking-[0.3em] truncate italic">
            {monthLabel}
          </div>
          <Button 
            variant="ghost"
            size="icon-sm"
            onClick={handleNextMonth}
            className="h-10 w-10 hover:bg-white/5 text-slate-600 hover:text-primary rounded-xl transition-all"
          >
            <ChevronRight size={20} strokeWidth={4} />
          </Button>
          <div className="w-px h-6 bg-white/5 mx-2" />
          <Button 
            variant="ghost"
            size="sm"
            onClick={handleToday}
            className="px-6 py-2 h-10 hover:bg-primary/10 text-[11px] font-black text-primary uppercase tracking-[0.4em] rounded-xl transition-all italic"
          >
            Synchronize Today
          </Button>
        </div>
      </div>

      <div className="bg-card/50 rounded-[3.5rem] border border-white/5 shadow-2xl overflow-hidden p-6 md:p-10 backdrop-blur-2xl">
        {/* Day Headers */}
        <div className="grid grid-cols-7 mb-8">
          {['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta'].map((day, i) => (
            <div key={day} className="py-2 text-center text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">
              {day.slice(0, 3)}
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

      <div className="flex items-center justify-center gap-12 py-10 border-t border-white/5 mt-8">
        <div className="flex items-center gap-4 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] italic">
          <div className="w-4 h-4 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
            <CheckCircle2 size={12} className="text-primary" strokeWidth={3} />
          </div>
          CALIBRATED
        </div>
        <div className="flex items-center gap-4 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] italic">
          <div className="w-4 h-4 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            <Circle size={10} className="text-slate-700" strokeWidth={3} />
          </div>
          PLANNED
        </div>
      </div>
    </div>
  );
}

function CalendarDay({ date, isCurrentMonth, onClick }) {
  const isToday = isSameDay(date, getToday());
  const dateKey = formatDateKey(date);
  
  // Load data for markers
  const dayWorkout = loadWorkoutByDate(dateKey);
  const doneAm = isDayComplete(dateKey, 'am');
  const donePm = isDayComplete(dateKey, 'pm');
  
  const hasWorkout = dayWorkout.am?.groups?.length > 0 || dayWorkout.pm?.groups?.length > 0;
  const allDone = hasWorkout && (
    (dayWorkout.am?.groups?.length > 0 ? doneAm : true) && 
    (dayWorkout.pm?.groups?.length > 0 ? donePm : true)
  );
  
  // Find primary muscle for icon/label
  const getPrimaryMuscle = () => {
    const muscles = [];
    ['am', 'pm'].forEach(s => {
      dayWorkout[s]?.groups?.forEach(g => {
        g.rows?.forEach(r => {
          if (r.muscle) muscles.push(r.muscle);
        });
      });
    });
    if (muscles.length === 0) return null;
    // Get most frequent
    return muscles.sort((a,b) =>
      muscles.filter(v => v===a).length - muscles.filter(v => v===b).length
    ).pop();
  };
  
  const primaryMuscle = getPrimaryMuscle();

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative aspect-square md:aspect-[5/4] rounded-2xl sm:rounded-[2.5rem] flex flex-col items-center justify-center p-3 border transition-all duration-500 active:scale-95 group overflow-hidden",
        isCurrentMonth ? 'bg-white/2 border-white/5 hover:border-primary/30 hover:bg-white/5' : 'bg-transparent border-transparent opacity-10',
        isToday ? 'border-primary ring-[6px] ring-primary/5 shadow-[0_0_30px_rgba(212,255,0,0.1)]' : '',
      )}
    >
      {/* Visual background hint for today */}
      {isToday && (
         <div className="absolute inset-x-0 top-0 h-1.5 bg-primary shadow-[0_5px_15px_#d4ff00]" />
      )}

      <span className={cn(
        "text-xs sm:text-lg font-black sm:mb-2 italic tracking-tighter",
        isToday ? 'text-primary' : (isCurrentMonth ? 'text-foreground' : 'text-slate-700')
      )}>
        {date.getDate()}
      </span>
      
      {hasWorkout ? (
        <div className="flex flex-col items-center gap-1 sm:gap-1.5">
          {/* Desktop/Tablet Icon Markers */}
          <div className="hidden sm:flex flex-col items-center gap-2">
            {allDone ? (
              <div className="bg-primary/20 p-2 rounded-xl border border-primary/30 shadow-[0_0_15px_rgba(212,255,0,0.1)] transition-all group-hover:bg-primary group-hover:text-primary-foreground transform group-hover:scale-110">
                 <CheckCircle2 size={16} className="text-primary group-hover:text-primary-foreground" strokeWidth={3} />
              </div>
            ) : (
              <div className="bg-white/5 p-2 rounded-xl border border-white/5 group-hover:border-primary/20 group-hover:bg-white/10 transition-all">
                 <Circle size={16} className="text-slate-800 group-hover:text-primary/40" strokeWidth={3} />
              </div>
            )}
            
            {primaryMuscle ? (
              <Badge variant="outline" className="flex text-[9px] font-black text-slate-500 border-white/5 bg-white/2 px-3 py-0.5 rounded-lg uppercase tracking-[0.2em] max-w-[120px] truncate italic group-hover:text-primary transition-colors">
                {primaryMuscle}
              </Badge>
            ) : (
              <Dumbbell size={16} className="text-slate-900 group-hover:text-primary transition-all duration-500" strokeWidth={2.5} />
            )}
          </div>

          {/* Mobile Dot Markers */}
          <div className="flex sm:hidden items-center gap-2 mt-2">
             <div className={cn(
               "w-2 h-2 rounded-full ring-2 ring-black/50 transition-all duration-500",
               allDone ? "bg-primary shadow-[0_0_15px_#d4ff00]" : "bg-white/5 border border-white/10"
             )} />
          </div>
        </div>
      ) : (
        <div className="h-2 sm:h-8" /> // spacer
      )}
    </button>
  );
}

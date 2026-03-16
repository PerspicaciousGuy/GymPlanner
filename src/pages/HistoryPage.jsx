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
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            Workout History
          </h1>
          <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Review and manage past sessions</p>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-200/50 max-w-full">
          <Button 
            variant="ghost"
            size="icon-sm"
            onClick={handlePrevMonth}
            className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
          >
            <ChevronLeft size={16} className="sm:size-[18px]" />
          </Button>
          <div className="flex-1 px-1 sm:px-4 py-1.5 text-[11px] sm:text-sm font-black text-slate-700 min-w-[120px] sm:min-w-[160px] text-center uppercase tracking-tight truncate">
            {monthLabel}
          </div>
          <Button 
            variant="ghost"
            size="icon-sm"
            onClick={handleNextMonth}
            className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
          >
            <ChevronRight size={16} className="sm:size-[18px]" />
          </Button>
          <div className="w-px h-5 bg-slate-100 mx-1 sm:mx-2" />
          <Button 
            variant="ghost"
            size="sm"
            onClick={handleToday}
            className="px-2 sm:px-4 py-1.5 h-7 sm:h-8 hover:bg-slate-50 text-[9px] sm:text-[11px] font-black text-indigo-600 uppercase tracking-widest transition-colors"
          >
            Today
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-2 md:p-6">
        {/* Day Headers */}
        <div className="grid grid-cols-7 mb-4">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="py-2 text-center text-[12px] font-black text-slate-500 uppercase tracking-widest">
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

      <div className="flex items-center justify-center gap-8 py-6 border-t border-slate-100 mt-4">
        <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
          <CheckCircle2 size={16} className="text-emerald-500" />
          Completed
        </div>
        <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
          <Circle size={16} className="text-slate-300" />
          Planned
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
        "relative aspect-square md:aspect-[4/3] rounded-lg sm:rounded-2xl flex flex-col items-center justify-center p-1 sm:p-2 border transition-all",
        isCurrentMonth ? 'bg-white shadow-sm' : 'bg-slate-50/50 opacity-40',
        isToday ? 'border-indigo-600 ring-2 ring-indigo-600/10' : 'border-slate-100',
        "hover:border-indigo-200 hover:shadow-lg active:scale-95 group overflow-hidden"
      )}
    >
      {/* Visual background hint for today */}
      {isToday && (
         <div className="absolute inset-x-0 top-0 h-0.5 sm:h-1 bg-indigo-600" />
      )}

      <span className={cn(
        "text-[11px] sm:text-[15px] font-black sm:mb-1.5",
        isToday ? 'text-indigo-600' : 'text-slate-800'
      )}>
        {date.getDate()}
      </span>
      
      {hasWorkout ? (
        <div className="flex flex-col items-center gap-1 sm:gap-1.5">
          {/* Desktop/Tablet Icon Markers */}
          <div className="hidden sm:flex flex-col items-center gap-1.5">
            {allDone ? (
              <div className="bg-emerald-50 p-1 rounded-full border border-emerald-100">
                 <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
            ) : (
              <div className="bg-slate-50 p-1 rounded-full border border-slate-100 group-hover:border-indigo-200">
                 <Circle size={16} className="text-slate-200 group-hover:text-indigo-400" />
              </div>
            )}
            
            {primaryMuscle ? (
              <Badge variant="outline" className="flex text-[8px] font-black text-slate-500 border-slate-100 px-1 py-0 uppercase tracking-widest max-w-[90%] truncate">
                {primaryMuscle}
              </Badge>
            ) : (
              <Dumbbell size={14} className="text-slate-200 group-hover:text-indigo-300 transition-colors" />
            )}
          </div>

          {/* Mobile Dot Markers */}
          <div className="flex sm:hidden items-center gap-1 mt-1">
             <div className={cn(
               "w-1.5 h-1.5 rounded-full",
               allDone ? "bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.4)]" : "bg-slate-200"
             )} />
          </div>
        </div>
      ) : (
        <div className="h-2 sm:h-8" /> // spacer
      )}
    </button>
  );
}

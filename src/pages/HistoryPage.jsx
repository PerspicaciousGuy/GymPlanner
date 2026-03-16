import { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Circle,
  Dumbbell
} from 'lucide-react';
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

        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button 
            onClick={handlePrevMonth}
            className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="px-4 py-1.5 text-sm font-black text-slate-700 min-w-[160px] text-center uppercase tracking-tight">
            {monthLabel}
          </div>
          <button 
            onClick={handleNextMonth}
            className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
          >
            <ChevronRight size={20} />
          </button>
          <div className="w-px h-5 bg-slate-100 mx-2" />
          <button 
            onClick={handleToday}
            className="px-4 py-1.5 hover:bg-slate-50 text-[11px] font-black text-indigo-600 uppercase tracking-widest transition-colors"
          >
            Today
          </button>
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
        <div className="grid grid-cols-7 gap-1 md:gap-3">
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
      className={`
        relative aspect-square md:aspect-[4/3] rounded-xl md:rounded-2xl flex flex-col items-center justify-center p-2 border transition-all
        ${isCurrentMonth ? 'bg-white shadow-sm' : 'bg-slate-50/50 opacity-40'}
        ${isToday ? 'border-indigo-600 ring-4 ring-indigo-600/5' : 'border-slate-100'}
        hover:border-indigo-200 hover:shadow-lg active:scale-95 group
      `}
    >
      <span className={`text-[13px] md:text-[15px] font-black mb-1.5 ${isToday ? 'text-indigo-600' : 'text-slate-800'}`}>
        {date.getDate()}
      </span>
      
      {hasWorkout ? (
        <div className="flex flex-col items-center gap-1.5">
          {allDone ? (
            <CheckCircle2 size={18} className="text-emerald-500" />
          ) : (
            <Circle size={18} className="text-slate-300 group-hover:text-indigo-300" />
          )}
          
          {primaryMuscle && (
            <span className="hidden md:block text-[10px] font-black text-slate-500 leading-none uppercase tracking-widest max-w-full truncate px-1">
              {primaryMuscle}
            </span>
          )}
          {!primaryMuscle && (
            <Dumbbell size={14} className="hidden md:block text-slate-300" />
          )}
        </div>
      ) : (
        <div className="h-5 md:h-8" /> // spacer
      )}
      
      {isToday && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
      )}
    </button>
  );
}

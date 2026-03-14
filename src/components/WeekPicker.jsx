import { ChevronLeft, ChevronRight, Calendar, Target } from 'lucide-react';
import { 
  getWeekBounds, 
  getPreviousWeek, 
  getNextWeek, 
  isCurrentWeek,
  getWeekStart 
} from '../utils/dateUtils';

export default function WeekPicker({ currentWeekStart, onWeekChange, compact = false }) {
  const { label } = getWeekBounds(currentWeekStart);
  const showTodayButton = !isCurrentWeek(currentWeekStart);

  const handlePrevious = () => onWeekChange(getPreviousWeek(currentWeekStart));
  const handleNext = () => onWeekChange(getNextWeek(currentWeekStart));
  const handleToday = () => onWeekChange(getWeekStart(new Date()));

  return (
    <div className={`flex items-center gap-2 ${compact ? 'py-1' : 'py-3 sm:py-4'}`}>
      <div className="flex items-center gap-1.5 p-1 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
        <button
          onClick={handlePrevious}
          className="p-1 px-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
          title="Previous week"
        >
          <ChevronLeft size={16} strokeWidth={3} />
        </button>
        
        <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-100 rounded-lg shadow-sm">
          <Calendar size={14} className="text-indigo-600" />
          <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
            {label}
          </span>
        </div>

        <button
          onClick={handleNext}
          className="p-1 px-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
          title="Next week"
        >
          <ChevronRight size={16} strokeWidth={3} />
        </button>
      </div>
      
      {showTodayButton && (
        <button
          onClick={handleToday}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-100"
          title="Jump to current week"
        >
          <Target size={12} strokeWidth={3} />
          <span>Today</span>
        </button>
      )}
    </div>
  );
}


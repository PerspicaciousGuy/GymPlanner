import { ChevronLeft, ChevronRight, Calendar, Target } from 'lucide-react';
import { 
  getWeekBounds, 
  getPreviousWeek, 
  getNextWeek, 
  isCurrentWeek,
  getWeekStart 
} from '../utils/dateUtils';
import { Button } from "@/components/ui/button";

export default function WeekPicker({ currentWeekStart, onWeekChange, compact = false }) {
  const { label } = getWeekBounds(currentWeekStart);
  const showTodayButton = !isCurrentWeek(currentWeekStart);

  const handlePrevious = () => onWeekChange(getPreviousWeek(currentWeekStart));
  const handleNext = () => onWeekChange(getNextWeek(currentWeekStart));
  const handleToday = () => onWeekChange(getWeekStart(new Date()));

  return (
    <div className={`flex items-center gap-2 ${compact ? 'py-1' : 'py-3 sm:py-4'}`}>
      <div className="flex items-center gap-1.5 p-1 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handlePrevious}
          className="text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all h-7 w-8"
          title="Previous week"
        >
          <ChevronLeft size={16} strokeWidth={3} />
        </Button>
        
        <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-100 rounded-lg shadow-sm">
          <Calendar size={14} className="text-indigo-600" />
          <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
            {label}
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleNext}
          className="text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all h-7 w-8"
          title="Next week"
        >
          <ChevronRight size={16} strokeWidth={3} />
        </Button>
      </div>
      
      {showTodayButton && (
        <Button
          onClick={handleToday}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-100 h-9 px-4"
          title="Jump to current week"
        >
          <Target size={12} strokeWidth={3} />
          <span>Today</span>
        </Button>
      )}
    </div>
  );
}


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
    <div className={`flex items-center gap-3 ${compact ? 'py-1' : 'py-3 sm:py-5'}`}>
      <div className="flex items-center gap-2 p-1.5 bg-white/2 border border-white/5 rounded-2xl shadow-2xl backdrop-blur-md">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handlePrevious}
          className="text-slate-600 hover:text-primary hover:bg-white/5 rounded-xl transition-all h-8 w-10"
          title="PREVIOUS ARCHITECTURE"
        >
          <ChevronLeft size={18} strokeWidth={4} />
        </Button>
        
        <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/5 rounded-xl shadow-inner group transition-all hover:bg-white/10">
          <Calendar size={14} className="text-primary animate-pulse" strokeWidth={3} />
          <span className="text-[11px] font-black text-foreground uppercase tracking-[0.2em] whitespace-nowrap italic">
            {label}
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleNext}
          className="text-slate-600 hover:text-primary hover:bg-white/5 rounded-xl transition-all h-8 w-10"
          title="NEXT ARCHITECTURE"
        >
          <ChevronRight size={18} strokeWidth={4} />
        </Button>
      </div>
      
      {showTodayButton && (
        <Button
          onClick={handleToday}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl transition-all shadow-[0_10px_20px_rgba(212,255,0,0.2)] h-11 px-5 italic transform active:scale-95"
          title="JUMP TO CURRENT VECTOR"
        >
          <Target size={14} strokeWidth={4} />
          <span>RE-CENTER</span>
        </Button>
      )}
    </div>
  );
}


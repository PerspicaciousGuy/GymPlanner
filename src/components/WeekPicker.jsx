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
      <div className="flex items-center gap-1.5 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-1 shadow-[var(--app-shadow-sm)]">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handlePrevious}
          className="h-7 w-8 rounded-[var(--app-radius-sm)] text-muted-foreground transition-colors hover:bg-[var(--app-surface)] hover:text-foreground"
          title="Previous week"
        >
          <ChevronLeft size={16} strokeWidth={3} />
        </Button>
        
        <div className="flex items-center gap-2 rounded-[var(--app-radius-sm)] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1 shadow-[var(--app-shadow-sm)]">
          <Calendar size={14} className="text-foreground" />
          <span className="whitespace-nowrap text-xs font-semibold text-foreground">
            {label}
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleNext}
          className="h-7 w-8 rounded-[var(--app-radius-sm)] text-muted-foreground transition-colors hover:bg-[var(--app-surface)] hover:text-foreground"
          title="Next week"
        >
          <ChevronRight size={16} strokeWidth={3} />
        </Button>
      </div>
      
      {showTodayButton && (
        <Button
          onClick={handleToday}
          className="flex h-9 items-center gap-1.5 rounded-[var(--app-radius-md)] bg-foreground px-4 text-[10px] font-semibold uppercase tracking-normal text-background shadow-[var(--app-shadow-sm)] transition-colors hover:bg-foreground/90"
          title="Jump to current week"
        >
          <Target size={12} strokeWidth={3} />
          <span>Today</span>
        </Button>
      )}
    </div>
  );
}


import { 
  getWeekBounds, 
  getPreviousWeek, 
  getNextWeek, 
  isCurrentWeek,
  getWeekStart 
} from '../utils/dateUtils';

/**
 * Week navigation component
 * Shows week range with prev/next buttons and "Today" shortcut
 * 
 * @param {Object} props
 * @param {Date} props.currentWeekStart - Monday of the currently selected week
 * @param {Function} props.onWeekChange - Callback when week changes (receives new Monday)
 */
export default function WeekPicker({ currentWeekStart, onWeekChange }) {
  const { label } = getWeekBounds(currentWeekStart);
  const showTodayButton = !isCurrentWeek(currentWeekStart);

  const handlePrevious = () => {
    onWeekChange(getPreviousWeek(currentWeekStart));
  };

  const handleNext = () => {
    onWeekChange(getNextWeek(currentWeekStart));
  };

  const handleToday = () => {
    onWeekChange(getWeekStart(new Date()));
  };

  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 py-3 sm:py-4">
      <button
        onClick={handlePrevious}
        className="px-2.5 sm:px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors text-sm whitespace-nowrap"
        title="Previous week"
      >
        <span className="sm:hidden">← Prev</span>
        <span className="hidden sm:inline">← Previous</span>
      </button>
      
      <div className="flex flex-col items-center justify-center gap-1 min-w-0">
        <span className="text-sm sm:text-base font-semibold text-gray-800 text-center leading-tight px-1">
          {label}
        </span>
        
        {showTodayButton && (
          <button
            onClick={handleToday}
            className="px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-md font-medium transition-colors"
            title="Jump to current week"
          >
            Today
          </button>
        )}
      </div>

      <button
        onClick={handleNext}
        className="px-2.5 sm:px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors text-sm whitespace-nowrap"
        title="Next week"
      >
        <span className="sm:hidden">Next →</span>
        <span className="hidden sm:inline">Next →</span>
      </button>
    </div>
  );
}

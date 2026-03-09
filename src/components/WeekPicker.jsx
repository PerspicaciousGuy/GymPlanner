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
    <div className="flex items-center justify-center gap-4 py-4">
      <button
        onClick={handlePrevious}
        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
        title="Previous week"
      >
        ← Previous
      </button>
      
      <div className="flex items-center gap-3">
        <span className="text-lg font-semibold text-gray-800 min-w-[280px] text-center">
          {label}
        </span>
        
        {showTodayButton && (
          <button
            onClick={handleToday}
            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-md font-medium transition-colors"
            title="Jump to current week"
          >
            Today
          </button>
        )}
      </div>

      <button
        onClick={handleNext}
        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
        title="Next week"
      >
        Next →
      </button>
    </div>
  );
}

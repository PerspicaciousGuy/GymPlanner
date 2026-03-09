/**
 * Date and week utility functions for GymPlanner
 * 
 * Week definition: Monday-Sunday
 * Date format: ISO strings (YYYY-MM-DD) for storage keys
 * Timezone: Local browser timezone (no UTC conversion)
 */

/**
 * Get the day of week name from a date
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} Day name (Monday-Sunday)
 */
export function getDayOfWeek(date) {
  const d = date instanceof Date ? date : new Date(date);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[d.getDay()];
}

/**
 * Format a date as ISO string (YYYY-MM-DD) for storage keys
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} ISO date string (YYYY-MM-DD)
 */
export function formatDateKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get Monday of the week containing the given date
 * @param {Date|string} date - Date object or ISO string
 * @returns {Date} Monday of that week
 */
export function getWeekStart(date) {
  const d = date instanceof Date ? new Date(date) : new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // If Sunday, go back 6 days; otherwise go to Monday
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Get Sunday of the week containing the given date
 * @param {Date|string} date - Date object or ISO string
 * @returns {Date} Sunday of that week
 */
export function getWeekEnd(date) {
  const monday = getWeekStart(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

/**
 * Get week bounds (Monday-Sunday) and formatted label
 * @param {Date|string} date - Date object or ISO string
 * @returns {{start: Date, end: Date, label: string}} Week bounds and label
 */
export function getWeekBounds(date) {
  const start = getWeekStart(date);
  const end = getWeekEnd(date);
  
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const startDay = start.getDate();
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  const endDay = end.getDate();
  const year = end.getFullYear();
  
  // Format: "Mar 3 - Mar 9, 2026" or "Dec 30, 2025 - Jan 5, 2026"
  let label;
  if (start.getFullYear() !== end.getFullYear()) {
    // Week spans two years
    label = `${startMonth} ${startDay}, ${start.getFullYear()} - ${endMonth} ${endDay}, ${year}`;
  } else if (start.getMonth() !== end.getMonth()) {
    // Same year, different months
    label = `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  } else {
    // Same month
    label = `${startMonth} ${startDay} - ${endDay}, ${year}`;
  }
  
  return { start, end, label };
}

/**
 * Get the date for a specific day of week within a given week
 * @param {Date|string} weekStart - Monday of the week
 * @param {string} dayName - Day name (Monday-Sunday)
 * @returns {Date} Date object for that day in the week
 */
export function getDateForDayInWeek(weekStart, dayName) {
  const monday = getWeekStart(weekStart);
  const dayMap = {
    'Monday': 0,
    'Tuesday': 1,
    'Wednesday': 2,
    'Thursday': 3,
    'Friday': 4,
    'Saturday': 5,
    'Sunday': 6
  };
  
  const offset = dayMap[dayName];
  if (offset === undefined) {
    throw new Error(`Invalid day name: ${dayName}`);
  }
  
  const targetDate = new Date(monday);
  targetDate.setDate(monday.getDate() + offset);
  return targetDate;
}

/**
 * Navigate to previous week
 * @param {Date|string} currentWeekStart - Current Monday
 * @returns {Date} Previous Monday
 */
export function getPreviousWeek(currentWeekStart) {
  const monday = getWeekStart(currentWeekStart);
  const prev = new Date(monday);
  prev.setDate(monday.getDate() - 7);
  return prev;
}

/**
 * Navigate to next week
 * @param {Date|string} currentWeekStart - Current Monday
 * @returns {Date} Next Monday
 */
export function getNextWeek(currentWeekStart) {
  const monday = getWeekStart(currentWeekStart);
  const next = new Date(monday);
  next.setDate(monday.getDate() + 7);
  return next;
}

/**
 * Check if a date is in the current week (containing today)
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is in current week
 */
export function isCurrentWeek(date) {
  const checkStart = getWeekStart(date);
  const todayStart = getWeekStart(new Date());
  return checkStart.getTime() === todayStart.getTime();
}

/**
 * Get array of all dates in a week (Monday-Sunday)
 * @param {Date|string} weekStart - Monday of the week
 * @returns {Date[]} Array of 7 Date objects
 */
export function getWeekDates(weekStart) {
  const monday = getWeekStart(weekStart);
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date);
  }
  return dates;
}

/**
 * Format date for display (e.g., "Mar 10, 2026")
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} Formatted date string
 */
export function formatDateDisplay(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Format date for compact display (e.g., "Mar 10")
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} Formatted date string
 */
export function formatDateCompact(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Get today's date with time set to midnight
 * @returns {Date} Today at 00:00:00
 */
export function getToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Get yesterday's date
 * @returns {Date} Yesterday at 00:00:00
 */
export function getYesterday() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  return yesterday;
}

/**
 * Get tomorrow's date
 * @returns {Date} Tomorrow at 00:00:00
 */
export function getTomorrow() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

/**
 * Compare if two dates are the same day (ignoring time)
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {boolean} True if same date
 */
export function isSameDay(date1, date2) {
  return formatDateKey(date1) === formatDateKey(date2);
}

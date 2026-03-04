// ─── Storage keys ────────────────────────────────────────────
const SCHEDULE_KEY    = 'gymplanner_schedule';
const WORKOUTS_KEY    = 'gymplanner_workouts';
const COMPLETION_KEY  = 'gymplanner_completion';

// ─── Helpers ──────────────────────────────────────────────────
function safeLoad(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

// ─── Schedule ─────────────────────────────────────────────────
export function loadSchedule() {
  return safeLoad(SCHEDULE_KEY, {});
}
export function saveSchedule(schedule) {
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
}

// ─── Per-row / group defaults ─────────────────────────────────
export function defaultRow() {
  return { muscle: '', subMuscle: '', exercise: '', sets: '', reps: '', weight: '' };
}

export function defaultGroup() {
  return { rows: [defaultRow(), defaultRow(), defaultRow()] };
}

export function defaultSession() {
  return { groups: [defaultGroup(), defaultGroup(), defaultGroup(), defaultGroup()] };
}

// Each day now stores two independent sessions: am and pm
export function defaultDayWorkout() {
  return { am: defaultSession(), pm: defaultSession() };
}

// Migrate old single-session format to new am/pm format
export function ensureAmPm(dayData) {
  if (!dayData) return defaultDayWorkout();
  if (dayData.am && dayData.pm) return dayData;
  // Old format had a top-level `groups` array — migrate to am
  const migrated = defaultDayWorkout();
  if (dayData.groups) migrated.am.groups = dayData.groups;
  return migrated;
}

// ─── Workouts (keyed by day name) ─────────────────────────────
export function loadWorkouts() {
  return safeLoad(WORKOUTS_KEY, {});
}

export function saveDayWorkout(day, dayData) {
  const all = loadWorkouts();
  all[day] = dayData;
  localStorage.setItem(WORKOUTS_KEY, JSON.stringify(all));
}

// ─── Completion ───────────────────────────────────────────────
export function loadCompletion() {
  return safeLoad(COMPLETION_KEY, {});
}

// session: 'am' | 'pm'
export function markDayComplete(day, session = 'am') {
  const all = loadCompletion();
  all[`${day}_${session}`] = true;
  localStorage.setItem(COMPLETION_KEY, JSON.stringify(all));
}

export function isDayComplete(day, session = 'am') {
  return loadCompletion()[`${day}_${session}`] === true;
}

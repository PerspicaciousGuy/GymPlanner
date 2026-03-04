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
  return { muscle: '', subMuscle: '', exercise: '', sets: '', reps: '', weight: '', notes: '' };
}

export function defaultGroup() {
  return { rows: [defaultRow(), defaultRow(), defaultRow()] };
}

export function defaultDayWorkout() {
  return { groups: [defaultGroup(), defaultGroup(), defaultGroup(), defaultGroup()] };
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

export function markDayComplete(day) {
  const all = loadCompletion();
  all[day] = true;
  localStorage.setItem(COMPLETION_KEY, JSON.stringify(all));
}

export function isDayComplete(day) {
  return loadCompletion()[day] === true;
}

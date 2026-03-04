// ─── Keys ────────────────────────────────────────────────────
const SCHEDULE_KEY = 'gymplanner_schedule';
const WORKOUT_KEY = 'gymplanner_workoutPlan';

// ─── Schedule helpers ────────────────────────────────────────
/**
 * Load the weekly schedule from localStorage.
 * Returns an object shaped as { Monday: "Chest", Tuesday: "Rest", ... }
 * Falls back to an empty object on error.
 */
export function loadSchedule() {
  try {
    const raw = localStorage.getItem(SCHEDULE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Persist the weekly schedule to localStorage.
 * @param {Record<string, string>} schedule
 */
export function saveSchedule(schedule) {
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
}

// ─── Workout plan helpers ────────────────────────────────────
/**
 * Default shape for a single exercise group row.
 */
export function defaultGroupRow() {
  return {
    muscle: '',
    subMuscle: '',
    exercise: '',
    sets: '',
    reps: '',
    weight: '',
    notes: '',
  };
}

/**
 * Build a default workout plan for N groups.
 * @param {number} count
 * @returns {Record<string, ReturnType<typeof defaultGroupRow>>}
 */
export function buildDefaultWorkoutPlan(count) {
  return Object.fromEntries(
    Array.from({ length: count }, (_, i) => [`group${i + 1}`, defaultGroupRow()])
  );
}

/**
 * Load the workout plan from localStorage.
 * Falls back to a default plan for the given group count.
 * @param {number} groupCount
 */
export function loadWorkoutPlan(groupCount) {
  try {
    const raw = localStorage.getItem(WORKOUT_KEY);
    return raw ? JSON.parse(raw) : buildDefaultWorkoutPlan(groupCount);
  } catch {
    return buildDefaultWorkoutPlan(groupCount);
  }
}

/**
 * Persist the workout plan to localStorage.
 * @param {Record<string, object>} plan
 */
export function saveWorkoutPlan(plan) {
  localStorage.setItem(WORKOUT_KEY, JSON.stringify(plan));
}

import {
  formatDateKey,
  getWeekStart,
  getDateForDayInWeek,
} from './dateUtils.js';
import {
  SCHEDULE_KEY,
  WORKOUTS_KEY,
  COMPLETION_KEY,
  CUSTOM_EXERCISES_KEY,
  EXERCISE_DB_KEY,
  SESSION_TITLES_KEY,
  TEMPLATES_KEY,
  DAILY_METADATA_KEY,
  MIGRATION_FLAG_KEY,
  WORKOUT_MIGRATION_FLAG_KEY,
  CUSTOM_FOODS_KEY,
  SAVED_MEALS_KEY,
  FOOD_LOG_KEY,
  BOOKMARKED_FOODS_KEY,
  SETTINGS_KEY,
  NOTIFICATION_SETTINGS_KEY,
  VITALS_LOG_KEY,
  WATER_LOG_KEY,
} from '../constants/storageKeys.js';

// ─── Storage keys ────────────────────────────────────────────
export const PLANNER_LOCAL_KEYS = [
  SCHEDULE_KEY,
  WORKOUTS_KEY,
  COMPLETION_KEY,
  CUSTOM_EXERCISES_KEY,
  EXERCISE_DB_KEY,
  SESSION_TITLES_KEY,
  TEMPLATES_KEY,
  DAILY_METADATA_KEY,
  MIGRATION_FLAG_KEY,
  WORKOUT_MIGRATION_FLAG_KEY,
  CUSTOM_FOODS_KEY,
  SAVED_MEALS_KEY,
  FOOD_LOG_KEY,
  BOOKMARKED_FOODS_KEY,
  SETTINGS_KEY,
  NOTIFICATION_SETTINGS_KEY,
  VITALS_LOG_KEY,
  WATER_LOG_KEY,
];

// ─── Helpers ──────────────────────────────────────────────────
export function safeLoad(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export const LEGACY_DAY_KEY_REGEX = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/;
export const DATE_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeWorkoutsMap(rawWorkouts) {
  const normalized = {};
  const currentWeekStart = getWeekStart(new Date());

  for (const [key, dayData] of Object.entries(rawWorkouts || {})) {
    if (DATE_KEY_REGEX.test(key)) {
      normalized[key] = ensureAmPm(dayData);
      continue;
    }

    if (LEGACY_DAY_KEY_REGEX.test(key)) {
      const date = getDateForDayInWeek(currentWeekStart, key);
      const dateKey = formatDateKey(date);
      if (!normalized[dateKey]) {
        normalized[dateKey] = ensureAmPm(dayData);
      }
      continue;
    }

    const parsedDate = new Date(key);
    if (!Number.isNaN(parsedDate.getTime())) {
      const dateKey = formatDateKey(parsedDate);
      if (!normalized[dateKey]) {
        normalized[dateKey] = ensureAmPm(dayData);
      }
    }
  }

  return normalized;
}

export function clearPlannerLocalData() {
  for (const key of PLANNER_LOCAL_KEYS) {
    localStorage.removeItem(key);
  }
}

// ─── Per-row / group defaults ─────────────────────────────────
export function defaultRow() {
  return { muscle: '', subMuscle: '', exercise: '', sets: '', reps: '', weight: '', dropSets: '', dropWeight: '' };
}

export function defaultGroup() {
  return { id: crypto.randomUUID(), rows: [defaultRow(), defaultRow(), defaultRow()] };
}

// Assign a stable id to any group missing one so React lists can key off it
// instead of the array index (groups can be added, deleted, and reordered).
function ensureGroupIds(session) {
  if (!session || !Array.isArray(session.groups)) return session;
  let changed = false;
  const groups = session.groups.map((group) => {
    if (group && !group.id) {
      changed = true;
      return { ...group, id: crypto.randomUUID() };
    }
    return group;
  });
  return changed ? { ...session, groups } : session;
}

export function defaultSession() {
  return { groups: [], standaloneExercises: [] };
}

// Each day now stores two independent sessions: am and pm
export function defaultDayWorkout() {
  return { am: defaultSession(), pm: defaultSession() };
}

// Migrate old single-session format to new am/pm format
export function ensureAmPm(dayData) {
  const result = defaultDayWorkout();

  if (!dayData) return result;

  // 1. If it's already in the am/pm format, merge them in to catch any new fields (like standaloneExercises)
  if (dayData.am || dayData.pm) {
    if (dayData.am) result.am = { ...result.am, ...dayData.am };
    if (dayData.pm) result.pm = { ...result.pm, ...dayData.pm };
    result.am = ensureGroupIds(result.am);
    result.pm = ensureGroupIds(result.pm);
    return result;
  }

  // 2. Legacy format: dayData itself was the session (back when there was only one per day)
  if (dayData.groups) {
    result.am.groups = dayData.groups;
    if (dayData.standaloneExercises) result.am.standaloneExercises = dayData.standaloneExercises;
  }

  result.am = ensureGroupIds(result.am);
  result.pm = ensureGroupIds(result.pm);

  return result;
}

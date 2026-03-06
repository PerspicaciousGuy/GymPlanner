import { apiFetchAll, apiSaveSchedule, apiSaveWorkout, apiMarkComplete } from './api.js';
import { exerciseDatabase } from '../data/exerciseDatabase.js';

// ─── Storage keys ────────────────────────────────────────────
const SCHEDULE_KEY         = 'gymplanner_schedule';
const WORKOUTS_KEY         = 'gymplanner_workouts';
const COMPLETION_KEY       = 'gymplanner_completion';
const CUSTOM_EXERCISES_KEY = 'gymplanner_custom_exercises';
const EXERCISE_DB_KEY      = 'gymplanner_exercise_db';

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
  return { muscle: '', subMuscle: '', exercise: '', sets: '', reps: '', weight: '', dropSets: '', dropWeight: '' };
}

export function defaultGroup() {
  return { rows: [defaultRow(), defaultRow(), defaultRow()] };
}

export function defaultSession() {
  return { groups: [defaultGroup(), defaultGroup()] };
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

// ─── Custom Exercises ─────────────────────────────────────────
export function loadCustomExercises() {
  return safeLoad(CUSTOM_EXERCISES_KEY, {});
}

export function getCustomExercisesForSubMuscle(muscle, subMuscle) {
  const all = loadCustomExercises();
  return all[muscle]?.[subMuscle] ?? [];
}

export function saveCustomExercise(muscle, subMuscle, name) {
  const all = loadCustomExercises();
  if (!all[muscle]) all[muscle] = {};
  if (!all[muscle][subMuscle]) all[muscle][subMuscle] = [];
  if (!all[muscle][subMuscle].includes(name)) {
    all[muscle][subMuscle].push(name);
    localStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(all));
  }
}

// ─── Exercise Database (Sheets-sourced) ──────────────────────
export function loadExerciseDb() {
  return safeLoad(EXERCISE_DB_KEY, null);
}

export function saveExerciseDbCache(db) {
  localStorage.setItem(EXERCISE_DB_KEY, JSON.stringify(db));
}

function isValidDb(db) {
  // Guard against error responses like { error: '...' } being cached as the DB
  return (
    db &&
    typeof db === 'object' &&
    !db.error &&
    Object.keys(db).length > 0 &&
    Object.values(db).every((v) => v && typeof v === 'object' && !Array.isArray(v))
  );
}

export function getMuscleGroupKeys() {
  const db = loadExerciseDb();
  return isValidDb(db) ? Object.keys(db) : Object.keys(exerciseDatabase);
}

export function getSubMusclesForMuscle(muscle) {
  const db = loadExerciseDb();
  const src = isValidDb(db) ? db : exerciseDatabase;
  return src[muscle] ? Object.keys(src[muscle]) : [];
}

export function getExercisesForSubMuscle(muscle, subMuscle) {
  const db = loadExerciseDb();
  const src = isValidDb(db) ? db : exerciseDatabase;
  return src[muscle]?.[subMuscle] ?? [];
}

export function addExerciseToCache(muscle, subMuscle, name) {
  let db = loadExerciseDb();
  if (!db) {
    // Initialize from static DB so existing exercises are preserved
    db = JSON.parse(JSON.stringify(exerciseDatabase));
  }
  if (!db[muscle]) db[muscle] = {};
  if (!db[muscle][subMuscle]) db[muscle][subMuscle] = [];
  if (!db[muscle][subMuscle].includes(name)) {
    db[muscle][subMuscle].push(name);
    saveExerciseDbCache(db);
  }
}

export function removeExerciseFromCache(muscle, subMuscle, name) {
  const db = loadExerciseDb();
  if (!db || !db[muscle]?.[subMuscle]) return;
  db[muscle][subMuscle] = db[muscle][subMuscle].filter((e) => e !== name);
  saveExerciseDbCache(db);
}

// ─── Async Sheets-sync variants ───────────────────────────────
// Pull schedule + completion from Sheets and refresh localStorage cache.
// Returns true on success, false if offline/failed.
export async function syncFromSheets() {
  const result = await apiFetchAll();
  if (!result) return false;
  const { schedule, completion, exerciseDb } = result;
  // Only overwrite local schedule if Sheets actually has muscle group data
  if (schedule && typeof schedule === 'object') {
    const hasData = Object.values(schedule).some((v) => v && v !== '');
    if (hasData) {
      localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
    }
  }
  if (completion && typeof completion === 'object') {
    localStorage.setItem(COMPLETION_KEY, JSON.stringify(completion));
  }
  // Cache exercise database from Sheets if it has valid structure
  if (isValidDb(exerciseDb)) {
    saveExerciseDbCache(exerciseDb);
  }
  return true;
}

// Save locally (instant) then fire Sheets write in background.
export function saveDayWorkoutWithSync(day, dayData) {
  saveDayWorkout(day, dayData);
  apiSaveWorkout(day, dayData).catch((err) =>
    console.warn('[storage] Sheets workout sync failed:', err)
  );
}

export function markDayCompleteWithSync(day, session = 'am') {
  markDayComplete(day, session);
  apiMarkComplete(day, session).catch((err) =>
    console.warn('[storage] Sheets completion sync failed:', err)
  );
}

export function saveScheduleWithSync(schedule) {
  saveSchedule(schedule);
  apiSaveSchedule(schedule).catch((err) =>
    console.warn('[storage] Sheets schedule sync failed:', err)
  );
}

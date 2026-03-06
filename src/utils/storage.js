import { exerciseDatabase } from '../data/exerciseDatabase.js';
import { AM_TITLES, PM_TITLES } from '../data/ampmTitles.js';
import {
  fetchCloudPlannerData,
  isCloudSyncReady,
  saveCloudCompletionEntry,
  saveCloudCompletionMap,
  saveCloudDayWorkout,
  saveCloudExerciseDb,
  saveCloudSchedule,
  saveCloudSessionTitles,
} from './cloudSync.js';

// ─── Storage keys ────────────────────────────────────────────
const SCHEDULE_KEY         = 'gymplanner_schedule';
const WORKOUTS_KEY         = 'gymplanner_workouts';
const COMPLETION_KEY       = 'gymplanner_completion';
const CUSTOM_EXERCISES_KEY = 'gymplanner_custom_exercises';
const EXERCISE_DB_KEY      = 'gymplanner_exercise_db';
const SESSION_TITLES_KEY   = 'gymplanner_session_titles';
const PLANNER_LOCAL_KEYS = [
  SCHEDULE_KEY,
  WORKOUTS_KEY,
  COMPLETION_KEY,
  CUSTOM_EXERCISES_KEY,
  EXERCISE_DB_KEY,
  SESSION_TITLES_KEY,
];

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

export function loadSessionTitles() {
  const raw = safeLoad(SESSION_TITLES_KEY, null);
  const am = { ...AM_TITLES, ...(raw?.am ?? {}) };
  const pm = { ...PM_TITLES, ...(raw?.pm ?? {}) };
  return { am, pm };
}

export function saveSessionTitles(titles) {
  const am = { ...AM_TITLES, ...(titles?.am ?? {}) };
  const pm = { ...PM_TITLES, ...(titles?.pm ?? {}) };
  localStorage.setItem(SESSION_TITLES_KEY, JSON.stringify({ am, pm }));
}

export function saveSessionTitlesWithSync(titles) {
  saveSessionTitles(titles);
  if (isCloudSyncReady()) {
    saveCloudSessionTitles(loadSessionTitles()).catch((err) =>
      console.warn('[storage] Cloud session titles sync failed:', err)
    );
  }
}

export async function migrateLocalDataToCloud() {
  if (!isCloudSyncReady()) {
    return { ok: false, reason: 'not-authenticated' };
  }

  try {
    const schedule = loadSchedule();
    const workouts = loadWorkouts();
    const completion = loadCompletion();
    const exerciseDb = loadExerciseDb() || exerciseDatabase;
    const sessionTitles = loadSessionTitles();

    await saveCloudSchedule(schedule);
    await saveCloudCompletionMap(completion);
    await saveCloudExerciseDb(exerciseDb);
    await saveCloudSessionTitles(sessionTitles);

    await Promise.all(
      Object.entries(workouts).map(([day, dayData]) =>
        saveCloudDayWorkout(day, ensureAmPm(dayData))
      )
    );

    return { ok: true };
  } catch (err) {
    console.warn('[storage] Local to cloud migration failed:', err);
    return { ok: false, reason: 'migration-failed' };
  }
}

export function clearPlannerLocalData() {
  for (const key of PLANNER_LOCAL_KEYS) {
    localStorage.removeItem(key);
  }
}

export async function clearLocalDataAndRehydrateFromCloud() {
  if (!isCloudSyncReady()) {
    return { ok: false, reason: 'not-authenticated' };
  }

  clearPlannerLocalData();
  const synced = await syncPlannerData();

  if (!synced) {
    return { ok: false, reason: 'cloud-sync-failed' };
  }

  return { ok: true };
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
  return normalizeCompletionMap(safeLoad(COMPLETION_KEY, {}));
}

function normalizeCompletionMap(raw) {
  if (!raw || typeof raw !== 'object') return {};
  const normalized = {};

  const isTruthy = (v) => v === true || v === 1 || v === '1' || v === 'true';

  for (const [key, value] of Object.entries(raw)) {
    if (typeof key !== 'string') continue;

    // Backward compatibility for server keys like "Monday_am_skipped": true
    const skippedMatch = key.match(/^(.*)_(am|pm)_skipped$/);
    if (skippedMatch) {
      if (isTruthy(value) || String(value).toLowerCase() === 'skipped') {
        normalized[`${skippedMatch[1]}_${skippedMatch[2]}`] = 'skipped';
      }
      continue;
    }

    if (!/(?:_am|_pm)$/.test(key)) continue;

    const lower = String(value).toLowerCase();
    if (lower === 'skipped' || lower === 'skip') {
      normalized[key] = 'skipped';
      continue;
    }

    if (isTruthy(value) && normalized[key] !== 'skipped') {
      normalized[key] = true;
    }
  }

  return normalized;
}

// session: 'am' | 'pm'
export function markDayComplete(day, session = 'am') {
  const all = loadCompletion();
  all[`${day}_${session}`] = true;
  localStorage.setItem(COMPLETION_KEY, JSON.stringify(all));
}

export function isDayComplete(day, session = 'am') {
  const val = loadCompletion()[`${day}_${session}`];
  return val === true || val === 'skipped';
}

export function isDaySkipped(day, session = 'am') {
  return loadCompletion()[`${day}_${session}`] === 'skipped';
}

export function markDaySkipped(day, session = 'am') {
  const all = loadCompletion();
  all[`${day}_${session}`] = 'skipped';
  localStorage.setItem(COMPLETION_KEY, JSON.stringify(all));
}

export function saveCompletion(completionMap) {
  localStorage.setItem(
    COMPLETION_KEY,
    JSON.stringify(normalizeCompletionMap(completionMap))
  );
}

export function saveCompletionWithSync(completionMap) {
  const normalized = normalizeCompletionMap(completionMap);
  localStorage.setItem(COMPLETION_KEY, JSON.stringify(normalized));

  if (isCloudSyncReady()) {
    saveCloudCompletionMap(normalized).catch((err) =>
      console.warn('[storage] Cloud completion sync failed:', err)
    );
  }
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

// ─── Exercise Database ────────────────────────────────────────
export function loadExerciseDb() {
  return safeLoad(EXERCISE_DB_KEY, null);
}

export function saveExerciseDbCache(db) {
  localStorage.setItem(EXERCISE_DB_KEY, JSON.stringify(db));
}

export function saveExerciseDbWithSync(db) {
  saveExerciseDbCache(db);
  if (isCloudSyncReady()) {
    saveCloudExerciseDb(db).catch((err) =>
      console.warn('[storage] Cloud exercise DB sync failed:', err)
    );
  }
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

export function addExerciseWithSync(muscle, subMuscle, name) {
  addExerciseToCache(muscle, subMuscle, name);
  const db = loadExerciseDb();

  if (isCloudSyncReady() && db) {
    saveCloudExerciseDb(db).catch((err) =>
      console.warn('[storage] Cloud exercise add sync failed:', err)
    );
  }
}

export function removeExerciseWithSync(muscle, subMuscle, name) {
  removeExerciseFromCache(muscle, subMuscle, name);
  const db = loadExerciseDb();

  if (isCloudSyncReady() && db) {
    saveCloudExerciseDb(db).catch((err) =>
      console.warn('[storage] Cloud exercise delete sync failed:', err)
    );
  }
}

// ─── Async Cloud sync ─────────────────────────────────────────
// Pull planner data from cloud and refresh localStorage cache.
// Returns true on success or when cloud is unavailable, false on cloud fetch failure.
export async function syncPlannerData() {
  if (!isCloudSyncReady()) return true;

  try {
    const result = await fetchCloudPlannerData();
    if (!result) return false;

    const { schedule, workouts, completion, exerciseDb, sessionTitles } = result;

    if (schedule && typeof schedule === 'object') {
      const hasData = Object.values(schedule).some((v) => v && v !== '');
      if (hasData) {
        localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
      }
    }

    if (workouts && typeof workouts === 'object') {
      const mergedWorkouts = { ...loadWorkouts(), ...workouts };
      localStorage.setItem(WORKOUTS_KEY, JSON.stringify(mergedWorkouts));
    }

    if (completion && typeof completion === 'object') {
      const localCompletion = loadCompletion();
      const remoteCompletion = normalizeCompletionMap(completion);
      const mergedCompletion = { ...localCompletion, ...remoteCompletion };
      for (const [key, value] of Object.entries(localCompletion)) {
        if (value === 'skipped' && mergedCompletion[key] === true) {
          mergedCompletion[key] = 'skipped';
        }
      }
      localStorage.setItem(COMPLETION_KEY, JSON.stringify(mergedCompletion));
    }

    if (isValidDb(exerciseDb)) {
      saveExerciseDbCache(exerciseDb);
    }

    if (sessionTitles && typeof sessionTitles === 'object') {
      saveSessionTitles(sessionTitles);
    }

    return true;
  } catch (err) {
    console.warn('[storage] Cloud sync failed:', err);
    return false;
  }
}

// Save locally (instant) then fire cloud write in background when signed in.
export function saveDayWorkoutWithSync(day, dayData) {
  saveDayWorkout(day, dayData);

  if (isCloudSyncReady()) {
    saveCloudDayWorkout(day, dayData).catch((err) =>
      console.warn('[storage] Cloud workout sync failed:', err)
    );
  }
}

export function markDayCompleteWithSync(day, session = 'am') {
  markDayComplete(day, session);

  if (isCloudSyncReady()) {
    saveCloudCompletionEntry(day, session, true).catch((err) =>
      console.warn('[storage] Cloud completion sync failed:', err)
    );
  }
}

export function markDaySkippedWithSync(day, session = 'am') {
  markDaySkipped(day, session);

  if (isCloudSyncReady()) {
    saveCloudCompletionEntry(day, session, 'skipped').catch((err) =>
      console.warn('[storage] Cloud skip sync failed:', err)
    );
  }
}

export function saveScheduleWithSync(schedule) {
  saveSchedule(schedule);

  if (isCloudSyncReady()) {
    saveCloudSchedule(schedule).catch((err) =>
      console.warn('[storage] Cloud schedule sync failed:', err)
    );
  }
}

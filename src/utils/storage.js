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
  saveCloudWorkoutsMap,
} from './cloudSync.js';
import {
  formatDateKey,
  getDayOfWeek,
  getWeekStart,
  getDateForDayInWeek,
  getWeekDates,
} from './dateUtils.js';
import { loadTrainingPlan, getPlanSessionTitle } from './trainingPlan.js';

// ─── Storage keys ────────────────────────────────────────────
const SCHEDULE_KEY         = 'gymplanner_schedule';
const WORKOUTS_KEY         = 'gymplanner_workouts';
const COMPLETION_KEY       = 'gymplanner_completion';
const CUSTOM_EXERCISES_KEY = 'gymplanner_custom_exercises';
const EXERCISE_DB_KEY      = 'gymplanner_exercise_db';
const SESSION_TITLES_KEY   = 'gymplanner_session_titles';
const TEMPLATES_KEY        = 'gymplanner_templates';
const DAILY_METADATA_KEY   = 'gymplanner_daily_metadata';
const MIGRATION_FLAG_KEY   = 'gymplanner_migrated_to_dates';
const WORKOUT_MIGRATION_FLAG_KEY = 'gymplanner_workouts_migrated_to_dates';
const PLANNER_LOCAL_KEYS = [
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

const LEGACY_DAY_KEY_REGEX = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/;
const DATE_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function normalizeWorkoutsMap(rawWorkouts) {
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

// ─── Schedule ─────────────────────────────────────────────────
export function loadSchedule() {
  return safeLoad(SCHEDULE_KEY, {});
}
export function saveSchedule(schedule) {
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
}

export function loadSessionTitles() {
  const raw = safeLoad(SESSION_TITLES_KEY, { am: {}, pm: {} }) || { am: {}, pm: {} };
  const am = { ...AM_TITLES, ...(raw?.am ?? {}) };
  const pm = { ...PM_TITLES, ...(raw?.pm ?? {}) };
  return { am, pm };
}

export function saveSessionTitles(titles) {
  const am = { ...AM_TITLES, ...(titles?.am ?? {}) };
  const pm = { ...PM_TITLES, ...(titles?.pm ?? {}) };
  localStorage.setItem(SESSION_TITLES_KEY, JSON.stringify({ am, pm }));
}

// ─── Daily Overrides (Date-specific metadata) ────────────────
export function loadDailyMetadata() {
  return safeLoad(DAILY_METADATA_KEY, {});
}

export function saveDailyMetadata(date, session, data) {
  const dateKey = formatDateKey(date);
  const all = loadDailyMetadata();
  if (!all[dateKey]) all[dateKey] = { am: {}, pm: {} };
  
  all[dateKey][session] = {
    ...(all[dateKey][session] || {}),
    ...data
  };
  
  localStorage.setItem(DAILY_METADATA_KEY, JSON.stringify(all));
}

export function getDailyMetadata(date, session) {
  const dateKey = formatDateKey(date);
  const all = loadDailyMetadata();
  return all[dateKey]?.[session] || {};
}

/**
 * Returns the session title for a specific date/session.
 * Priorities: 
 * 1. Daily Metadata Override
 * 2. Training Plan (Fixed or Dynamic mode)
 * 3. Legacy Session Title Template (Day of week fallback)
 * 4. Fallback to Empty
 */
export function getEffectiveSessionTitle(date, session) {
  const override = getDailyMetadata(date, session);
  if (
    override.title !== undefined && 
    override.title !== null && 
    override.title.trim() !== '' && 
    override.title.trim().toLowerCase() !== 'workout'
  ) {
    return override.title;
  }

  // Try training plan
  const plan = loadTrainingPlan();
  const planTitle = getPlanSessionTitle(date, session, plan);
  if (planTitle !== null && planTitle !== undefined) {
    return planTitle;
  }

  const titles = loadSessionTitles();
  const dayName = getDayOfWeek(date);
  return titles[session]?.[dayName] || '';
}

/**
 * Moves a session (title + exercises) from one date to another.
 */
export function shiftWorkout(fromDate, toDate, fromSession, toSession = null) {
  const targetSession = toSession || fromSession;
  
  // 1. Get source data
  const sourceTitle = getEffectiveSessionTitle(fromDate, fromSession);
  const sourceWorkouts = loadWorkoutByDate(fromDate);
  const sourceSessionData = sourceWorkouts[fromSession];

  // 2. Save to destination
  // Save Title
  saveDailyMetadata(toDate, targetSession, { 
    title: sourceTitle,
    isShifted: true, 
    originalDate: formatDateKey(fromDate)
  });
  
  // Save Exercises
  const targetWorkouts = loadWorkoutByDate(toDate);
  targetWorkouts[targetSession] = JSON.parse(JSON.stringify(sourceSessionData));
  saveDayWorkoutWithSync(toDate, targetWorkouts);

  // 3. Update source (Mark as shifted/rest)
  saveDailyMetadata(fromDate, fromSession, { 
    title: `Rest (Shifted to ${formatDateKey(toDate)})`,
    isShiftedFrom: true,
    shiftedToDate: formatDateKey(toDate)
  });
  
  // Clear source exercises
  sourceWorkouts[fromSession] = defaultSession();
  saveDayWorkoutWithSync(fromDate, sourceWorkouts);
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

export async function clearAllDataLocalAndCloud() {
  if (!isCloudSyncReady()) {
    return { ok: false, reason: 'not-authenticated' };
  }

  try {
    // Overwrite each cloud planner document with an empty payload.
    await Promise.all([
      saveCloudSchedule({}),
      saveCloudWorkoutsMap({}),
      saveCloudCompletionMap({}),
      saveCloudExerciseDb({}),
      saveCloudSessionTitles({}),
    ]);

    clearPlannerLocalData();
    return { ok: true };
  } catch (err) {
    console.warn('[storage] Failed to clear cloud data:', err);
    return { ok: false, reason: 'cloud-clear-failed' };
  }
}

// ─── Per-row / group defaults ─────────────────────────────────
export function defaultRow() {
  return { muscle: '', subMuscle: '', exercise: '', sets: '', reps: '', weight: '', dropSets: '', dropWeight: '' };
}

export function defaultGroup() {
  return { rows: [defaultRow(), defaultRow(), defaultRow()] };
}

export function defaultSession() {
  return { groups: [defaultGroup(), defaultGroup()], standaloneExercises: [] };
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
    return result;
  }

  // 2. Legacy format: dayData itself was the session (back when there was only one per day)
  if (dayData.groups) {
    result.am.groups = dayData.groups;
    if (dayData.standaloneExercises) result.am.standaloneExercises = dayData.standaloneExercises;
  }

  return result;
}

// ─── Workouts (now keyed by date) ─────────────────────────────
// Run migration from day-based to date-based workouts on first load
export function migrateWorkoutsToDateBased() {
  const migrated = localStorage.getItem(WORKOUT_MIGRATION_FLAG_KEY);
  if (migrated === 'true') return; // Already migrated

  const workouts = safeLoad(WORKOUTS_KEY, {});
  const hasOldFormat = Object.keys(workouts).some(key => 
    /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/.test(key)
  );

  if (!hasOldFormat) {
    localStorage.setItem(WORKOUT_MIGRATION_FLAG_KEY, 'true');
    return; // No old data to migrate
  }

  console.log('[storage] Migrating workouts data to date-based format...');
  
  // Get current week's Monday
  const currentWeekStart = getWeekStart(new Date());
  const newWorkouts = {};

  // Migrate old day-based workouts to current week's dates
  for (const [dayName, dayData] of Object.entries(workouts)) {
    if (/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/.test(dayName)) {
      const date = getDateForDayInWeek(currentWeekStart, dayName);
      const dateKey = formatDateKey(date);
      newWorkouts[dateKey] = ensureAmPm(dayData);
      console.log(`  Migrated ${dayName} → ${dateKey}`);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(dayName)) {
      // Already date-based, keep it
      newWorkouts[dayName] = ensureAmPm(dayData);
    }
  }

  localStorage.setItem(WORKOUTS_KEY, JSON.stringify(newWorkouts));
  localStorage.setItem(WORKOUT_MIGRATION_FLAG_KEY, 'true');
  console.log('[storage] Workout migration complete. Migrated to current week.');
}

export function loadWorkouts() {
  const raw = safeLoad(WORKOUTS_KEY, {});
  const normalized = normalizeWorkoutsMap(raw);

  // Keep local cache canonical (date-keyed) to avoid blank dates in Data Console.
  if (JSON.stringify(raw) !== JSON.stringify(normalized)) {
    localStorage.setItem(WORKOUTS_KEY, JSON.stringify(normalized));
  }

  return normalized;
}

export function saveWorkoutsMap(workoutsMap) {
  localStorage.setItem(WORKOUTS_KEY, JSON.stringify(workoutsMap || {}));
}

// Load workout for a specific date
export function loadWorkoutByDate(date) {
  const dateKey = formatDateKey(date);
  const all = loadWorkouts();
  return ensureAmPm(all[dateKey]);
}

// Save workout for a specific date
export function saveDayWorkout(dateOrDay, dayData) {
  const all = loadWorkouts();
  // Support both date objects and date strings
  const key = dateOrDay instanceof Date || /^\d{4}-\d{2}-\d{2}$/.test(dateOrDay)
    ? formatDateKey(dateOrDay)
    : dateOrDay; // For backward compatibility during migration
  all[key] = dayData;
  localStorage.setItem(WORKOUTS_KEY, JSON.stringify(all));
}

// Get workouts for a specific week
export function getWorkoutsForWeek(weekStartDate) {
  const weekDates = getWeekDates(weekStartDate);
  const allWorkouts = loadWorkouts();
  const weekWorkouts = {};

  for (const date of weekDates) {
    const dateKey = formatDateKey(date);
    const dayName = getDayOfWeek(date);
    weekWorkouts[dayName] = {
      date: dateKey,
      data: ensureAmPm(allWorkouts[dateKey])
    };
  }

  return weekWorkouts;
}

function hasTrackedWorkoutValues(row) {
  return ['sets', 'reps', 'weight', 'dropSets', 'dropWeight'].some(
    (field) => String(row?.[field] ?? '').trim() !== ''
  );
}

export function findPreviousExerciseEntry({ exercise, beforeDate, session }) {
  const exerciseName = String(exercise || '').trim().toLowerCase();
  if (!exerciseName) return null;

  const beforeDateKey = formatDateKey(beforeDate);
  const targetWeekday = getDayOfWeek(beforeDate);
  const buckets = [null, null, null, null];

  const workoutEntries = Object.entries(loadWorkouts())
    .filter(([dateKey]) => DATE_KEY_REGEX.test(dateKey) && dateKey < beforeDateKey)
    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA));

  for (const [dateKey, dayData] of workoutEntries) {
    const normalizedDay = ensureAmPm(dayData);

    for (const sessionKey of ['am', 'pm']) {
      const groups = normalizedDay?.[sessionKey]?.groups ?? [];

      for (const group of groups) {
        for (const row of group.rows ?? []) {
          const rowExercise = String(row?.exercise || '').trim().toLowerCase();
          if (rowExercise !== exerciseName || !hasTrackedWorkoutValues(row)) continue;

          const isSameWeekday = getDayOfWeek(dateKey) === targetWeekday;
          const isSameSession = sessionKey === session;
          const bucketIndex = isSameWeekday && isSameSession
            ? 0
            : isSameSession
            ? 1
            : isSameWeekday
            ? 2
            : 3;

          if (!buckets[bucketIndex]) {
            buckets[bucketIndex] = {
              date: dateKey,
              session: sessionKey,
              row: {
                sets: row.sets || '',
                reps: row.reps || '',
                weight: row.weight || '',
                dropSets: row.dropSets || '',
                dropWeight: row.dropWeight || '',
              },
            };
          }
        }
      }
    }

    if (buckets[0]) break;
  }

  return buckets.find(Boolean) || null;
}

/**
 * Counts how many times an exercise has been recorded with specific weight and reps.
 * @param {string} exercise - Exercise name (case-insensitive)
 * @param {string|number} reps - Target reps
 * @param {string|number} weight - Target weight
 * @param {Date|string} beforeDate - Date to count before (exclusive)
 * @returns {number}
 */
export function getExerciseOccurrenceCount({ exercise, reps, weight, beforeDate }) {
  const exName = String(exercise || '').trim().toLowerCase();
  const targetReps = String(reps || '').trim();
  const targetWeight = String(weight || '').trim();

  if (!exName || !targetReps || !targetWeight) return 0;

  const beforeDateKey = beforeDate ? formatDateKey(beforeDate) : '9999-99-99';
  const workoutEntries = Object.entries(loadWorkouts())
    .filter(([dateKey]) => DATE_KEY_REGEX.test(dateKey) && dateKey < beforeDateKey);

  let count = 0;
  for (const [_, dayData] of workoutEntries) {
    const normalizedDay = ensureAmPm(dayData);
    for (const sessionKey of ['am', 'pm']) {
      const groups = normalizedDay?.[sessionKey]?.groups ?? [];
      for (const group of groups) {
        for (const row of group.rows ?? []) {
          const rowEx = String(row?.exercise || '').trim().toLowerCase();
          const rowReps = String(row?.reps || '').trim();
          const rowWeight = String(row?.weight || '').trim();

          if (rowEx === exName && rowReps === targetReps && rowWeight === targetWeight) {
            count++;
          }
        }
      }
    }
  }
  return count;
}

// ─── Completion ───────────────────────────────────────────────
// Run migration from day-based to date-based completion on first load
export function migrateCompletionToDateBased() {
  const migrated = localStorage.getItem(MIGRATION_FLAG_KEY);
  if (migrated === 'true') return; // Already migrated

  const completion = safeLoad(COMPLETION_KEY, {});
  const hasOldFormat = Object.keys(completion).some(key => 
    /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)_(am|pm)/.test(key)
  );

  if (!hasOldFormat) {
    localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
    return; // No old data to migrate
  }

  console.log('[storage] Migrating completion data to date-based format...');
  
  // Get previous week's Monday (the week that just ended)
  // This is more logical since completion data is typically historical
  const currentWeekStart = getWeekStart(new Date());
  const previousWeekStart = new Date(currentWeekStart);
  previousWeekStart.setDate(currentWeekStart.getDate() - 7);
  
  const newCompletion = {};

  // Migrate old day-based keys to previous week's dates
  for (const [key, value] of Object.entries(completion)) {
    const match = key.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)_(am|pm)/);
    if (match) {
      const [_, dayName, session] = match;
      const date = getDateForDayInWeek(previousWeekStart, dayName);
      const dateKey = formatDateKey(date);
      newCompletion[`${dateKey}_${session}`] = value;
      console.log(`  Migrated ${key} → ${dateKey}_${session}`);
    } else if (/^\d{4}-\d{2}-\d{2}_(am|pm)/.test(key)) {
      // Already date-based, keep it
      newCompletion[key] = value;
    }
  }

  localStorage.setItem(COMPLETION_KEY, JSON.stringify(newCompletion));
  localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
  console.log('[storage] Migration complete. Migrated to previous week (', formatDateKey(previousWeekStart), '- week that just ended).');
}

export function loadCompletion() {
  return normalizeCompletionMap(safeLoad(COMPLETION_KEY, {}));
}

function normalizeCompletionMap(raw) {
  if (!raw || typeof raw !== 'object') return {};
  const normalized = {};

  const isTruthy = (v) => v === true || v === 1 || v === '1' || v === 'true';

  for (const [key, value] of Object.entries(raw)) {
    if (typeof key !== 'string') continue;

    // Backward compatibility for old "day_session_skipped" keys
    const skippedMatch = key.match(/^(.*)_(am|pm)_skipped$/);
    if (skippedMatch) {
      if (isTruthy(value) || String(value).toLowerCase() === 'skipped') {
        normalized[`${skippedMatch[1]}_${skippedMatch[2]}`] = 'skipped';
      }
      continue;
    }

    // Accept both date-based (2026-03-10_am) and old day-based (Monday_am) keys
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
// date: Date object or ISO date string (YYYY-MM-DD)
export function markDayComplete(date, session = 'am') {
  const dateKey = formatDateKey(date);
  const all = loadCompletion();
  all[`${dateKey}_${session}`] = true;
  localStorage.setItem(COMPLETION_KEY, JSON.stringify(all));
}

export function isDayComplete(date, session = 'am') {
  const dateKey = formatDateKey(date);
  const val = loadCompletion()[`${dateKey}_${session}`];
  return val === true || val === 'skipped';
}

export function isDaySkipped(date, session = 'am') {
  const dateKey = formatDateKey(date);
  return loadCompletion()[`${dateKey}_${session}`] === 'skipped';
}

export function markDaySkipped(date, session = 'am') {
  const dateKey = formatDateKey(date);
  const all = loadCompletion();
  all[`${dateKey}_${session}`] = 'skipped';
  localStorage.setItem(COMPLETION_KEY, JSON.stringify(all));
}

// Get completion data for a specific week
export function getCompletionForWeek(weekStartDate) {
  const weekDates = getWeekDates(weekStartDate);
  const completion = loadCompletion();
  const weekCompletion = {};

  for (const date of weekDates) {
    const dateKey = formatDateKey(date);
    const dayName = getDayOfWeek(date);
    
    weekCompletion[dayName] = {
      date: dateKey,
      am: completion[`${dateKey}_am`],
      pm: completion[`${dateKey}_pm`],
    };
  }

  return weekCompletion;
}

// Get completion status for display (used by Data Console)
export function getCompletionStatus(date, session) {
  const dateKey = formatDateKey(date);
  const val = loadCompletion()[`${dateKey}_${session}`];
  if (val === true) return 'done';
  if (val === 'skipped') return 'skipped';
  return '';
}

// Set completion status from Data Console dropdown
export function setCompletionStatus(date, session, status) {
  const dateKey = formatDateKey(date);
  const all = loadCompletion();
  
  if (status === 'done') {
    all[`${dateKey}_${session}`] = true;
  } else if (status === 'skipped') {
    all[`${dateKey}_${session}`] = 'skipped';
  } else {
    // Remove the key if status is empty/none
    delete all[`${dateKey}_${session}`];
  }
  
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

// ─── Workout Templates ────────────────────────────────────────
export function loadTemplates() {
  const res = safeLoad(TEMPLATES_KEY, []);
  return Array.isArray(res) ? res : [];
}

export function saveTemplate(name, groups) {
  const templates = loadTemplates();
  const newTemplate = {
    id: crypto.randomUUID(),
    name,
    groups: groups ? JSON.parse(JSON.stringify(groups)) : [], // Deep clone to avoid references
    createdAt: new Date().toISOString()
  };
  templates.push(newTemplate);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  return newTemplate;
}

export function updateTemplate(id, name, groups) {
  const templates = loadTemplates();
  const idx = templates.findIndex(t => t.id === id);
  if (idx === -1) return null;
  
  templates[idx] = {
    ...templates[idx],
    name,
    groups: groups ? JSON.parse(JSON.stringify(groups)) : [],
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  return templates[idx];
}

export function deleteTemplate(id) {
  const templates = loadTemplates().filter(t => t.id !== id);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

// ─── Exercise Database ────────────────────────────────────────
export function loadExerciseDb() {
  return safeLoad(EXERCISE_DB_KEY, null);
}

export function saveExerciseDbCache(db) {
  localStorage.setItem(EXERCISE_DB_KEY, JSON.stringify(db));
  window.dispatchEvent(new CustomEvent('gymplanner_db_changed'));
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
      const normalizedRemoteWorkouts = normalizeWorkoutsMap(workouts);
      const mergedWorkouts = { ...loadWorkouts(), ...normalizedRemoteWorkouts };
      localStorage.setItem(WORKOUTS_KEY, JSON.stringify(mergedWorkouts));

      // If cloud still has legacy day keys, rewrite cloud with canonical date keys.
      const hadLegacyKeys = Object.keys(workouts).some((key) => LEGACY_DAY_KEY_REGEX.test(key));
      if (hadLegacyKeys) {
        saveCloudWorkoutsMap(normalizedRemoteWorkouts).catch((err) =>
          console.warn('[storage] Cloud workout key normalization failed:', err)
        );
      }
    }

    if (completion && typeof completion === 'object') {
      const remoteCompletion = normalizeCompletionMap(completion);
      // Treat cloud as source of truth during sync so deleted keys stay deleted.
      localStorage.setItem(COMPLETION_KEY, JSON.stringify(remoteCompletion));
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
    const dateKey = day instanceof Date || DATE_KEY_REGEX.test(day)
      ? formatDateKey(day)
      : day;
    saveCloudDayWorkout(dateKey, dayData).catch((err) =>
      console.warn('[storage] Cloud workout sync failed:', err)
    );
  }
}

// Save the entire workouts object so deleted rows/dates are removed as well.
export function saveWorkoutsMapWithSync(workoutsMap) {
  saveWorkoutsMap(workoutsMap);

  if (isCloudSyncReady()) {
    saveCloudWorkoutsMap(workoutsMap || {}).catch((err) =>
      console.warn('[storage] Cloud workouts map sync failed:', err)
    );
  }
}

export function markDayCompleteWithSync(date, session = 'am') {
  markDayComplete(date, session);

  if (isCloudSyncReady()) {
    const dateKey = formatDateKey(date);
    saveCloudCompletionEntry(dateKey, session, true).catch((err) =>
      console.warn('[storage] Cloud completion sync failed:', err)
    );
  }
}

export function markDaySkippedWithSync(date, session = 'am') {
  markDaySkipped(date, session);

  if (isCloudSyncReady()) {
    const dateKey = formatDateKey(date);
    saveCloudCompletionEntry(dateKey, session, 'skipped').catch((err) =>
      console.warn('[storage] Cloud skip sync failed:', err)
    );
  }
}

export function setCompletionStatusWithSync(date, session, status) {
  setCompletionStatus(date, session, status);

  if (isCloudSyncReady()) {
    const completion = loadCompletion();
    saveCloudCompletionMap(completion).catch((err) =>
      console.warn('[storage] Cloud completion sync failed:', err)
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

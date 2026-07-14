import { saveCloudDayWorkout, saveCloudWorkoutsMap } from './cloudSync.js';
import {
  formatDateKey,
  getDayOfWeek,
  getWeekStart,
  getDateForDayInWeek,
  getWeekDates,
} from './dateUtils.js';
import { runCloudSync } from './cloudSyncRunner.js';
import { WORKOUTS_KEY, WORKOUT_MIGRATION_FLAG_KEY } from '../constants/storageKeys.js';
import {
  safeLoad,
  ensureAmPm,
  defaultSession,
  normalizeWorkoutsMap,
  DATE_KEY_REGEX,
} from './storageCore.js';
import {
  freezeEffectiveSessionTitle,
  getEffectiveSessionTitle,
  saveDailyMetadataWithSync,
} from './sessionMetaStorage.js';

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

  // Get current week's Monday
  const currentWeekStart = getWeekStart(new Date());
  const newWorkouts = {};

  // Migrate old day-based workouts to current week's dates
  for (const [dayName, dayData] of Object.entries(workouts)) {
    if (/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/.test(dayName)) {
      const date = getDateForDayInWeek(currentWeekStart, dayName);
      const dateKey = formatDateKey(date);
      newWorkouts[dateKey] = ensureAmPm(dayData);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(dayName)) {
      // Already date-based, keep it
      newWorkouts[dayName] = ensureAmPm(dayData);
    }
  }

  localStorage.setItem(WORKOUTS_KEY, JSON.stringify(newWorkouts));
  localStorage.setItem(WORKOUT_MIGRATION_FLAG_KEY, 'true');
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

  if (dayData && typeof dayData === 'object') {
    if ((dayData.am?.groups?.length > 0) || (dayData.am?.standaloneExercises?.length > 0)) {
      freezeEffectiveSessionTitle(key, 'am');
    }
    if ((dayData.pm?.groups?.length > 0) || (dayData.pm?.standaloneExercises?.length > 0)) {
      freezeEffectiveSessionTitle(key, 'pm');
    }
  }
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

export function findPreviousExerciseEntry({ exercise, beforeDate }) {
  const exerciseName = String(exercise || '').trim().toLowerCase();
  if (!exerciseName) return null;

  const beforeDateKey = formatDateKey(beforeDate);

  const workouts = loadWorkouts();
  const workoutEntries = Object.entries(workouts)
    .filter(([dateKey]) => DATE_KEY_REGEX.test(dateKey) && dateKey < beforeDateKey)
    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA)); // latest first

  for (const [dateKey, dayData] of workoutEntries) {
    const normalizedDay = ensureAmPm(dayData);

    // We check pm then am so we get the absolutely latest session in that day
    for (const sessionKey of ['pm', 'am']) {
      const sessionData = normalizedDay[sessionKey] || {};

      // 1. Search in Traditional Groups
      const groups = sessionData.groups ?? [];
      for (const group of groups) {
        for (const row of group.rows ?? []) {
          const rowExercise = String(row?.exercise || '').trim().toLowerCase();
          if (rowExercise !== exerciseName || !hasTrackedWorkoutValues(row)) continue;

          // Found the most recent! Return immediately.
          return {
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

      // 2. Search in Standalone Advanced Exercises
      const standalone = sessionData.standaloneExercises ?? [];
      for (const ex of standalone) {
        const exExercise = String(ex?.exercise || '').trim().toLowerCase();
        if (exExercise !== exerciseName) continue;

        // Check if any sets have data
        const validSets = (ex.sets || []).filter(s => String(s.reps || '').trim() !== '' || String(s.weight || '').trim() !== '');
        if (validSets.length === 0) continue;

        const firstSet = validSets[0];

        // Found the most recent! Return immediately.
        return {
          date: dateKey,
          session: sessionKey,
          row: {
            sets: String(ex.sets?.length || ''),
            reps: String(firstSet.reps || ''),
            weight: String(firstSet.weight || ''),
            dropSets: '',
            dropWeight: '',
            // Include the full sets for smarter consumers
            allSets: ex.sets
          },
        };
      }
    }
  }

  return null;
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
      const sessionData = normalizedDay[sessionKey] || {};

      // Check Groups
      const groups = sessionData.groups ?? [];
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

      // Check Standalone
      const standalone = sessionData.standaloneExercises ?? [];
      for (const ex of standalone) {
        const exEx = String(ex?.exercise || '').trim().toLowerCase();
        if (exEx !== exName) continue;

        for (const s of ex.sets || []) {
          const sReps = String(s.reps || '').trim();
          const sWeight = String(s.weight || '').trim();
          if (sReps === targetReps && sWeight === targetWeight) {
            count++;
          }
        }
      }
    }
  }
  return count;
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
  saveDailyMetadataWithSync(toDate, targetSession, {
    title: sourceTitle,
    isShifted: true,
    originalDate: formatDateKey(fromDate)
  });

  // Save Exercises
  const targetWorkouts = loadWorkoutByDate(toDate);
  targetWorkouts[targetSession] = JSON.parse(JSON.stringify(sourceSessionData));
  saveDayWorkoutWithSync(toDate, targetWorkouts);

  // 3. Update source (Mark as shifted/rest)
  saveDailyMetadataWithSync(fromDate, fromSession, {
    title: `Rest (Shifted to ${formatDateKey(toDate)})`,
    isShiftedFrom: true,
    shiftedToDate: formatDateKey(toDate)
  });

  // Clear source exercises
  sourceWorkouts[fromSession] = defaultSession();
  saveDayWorkoutWithSync(fromDate, sourceWorkouts);
}

// Save locally (instant) then fire cloud write in background when signed in.
export function saveDayWorkoutWithSync(day, dayData) {
  saveDayWorkout(day, dayData);

  const dateKey = day instanceof Date || DATE_KEY_REGEX.test(day)
    ? formatDateKey(day)
    : day;
  runCloudSync(
    () => saveCloudDayWorkout(dateKey, dayData),
    '[storage] Cloud workout sync failed:'
  );
}

// Save the entire workouts object so deleted rows/dates are removed as well.
export function saveWorkoutsMapWithSync(workoutsMap) {
  saveWorkoutsMap(workoutsMap);

  runCloudSync(
    () => saveCloudWorkoutsMap(workoutsMap || {}),
    '[storage] Cloud workouts map sync failed:'
  );
}

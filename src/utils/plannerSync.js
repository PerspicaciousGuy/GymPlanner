import { exerciseDatabase } from '../data/exerciseDatabase.js';
import { getCustomFoods, getSavedMeals, getBookmarkedFoods } from './foodDatabase.js';
import {
  fetchCloudPlannerData,
  isCloudSyncReady,
  saveCloudCompletionMap,
  saveCloudDayWorkout,
  saveCloudExerciseDb,
  saveCloudSchedule,
  saveCloudSessionTitles,
  saveCloudWorkoutsMap,
  saveCloudSavedPlans,
  saveCloudActivePlanId,
  saveCloudTemplates,
  saveCloudCustomExercises,
  saveCloudDailyMetadata,
  saveCloudSettings,
  saveCloudFoodLog,
  saveCloudCustomFoods,
  saveCloudSavedMeals,
  saveCloudBookmarkedFoods,
  saveCloudNotifSettings,
  saveCloudVitalsLog,
  saveCloudWaterLog,
} from './cloudSync.js';
import { loadSettings } from './settings.js';
import { getPlanSessionTitle } from './trainingPlan.js';
import { runCloudSync } from './cloudSyncRunner.js';
import {
  ACTIVE_PLAN_KEY,
  BOOKMARKED_FOODS_KEY,
  CUSTOM_EXERCISES_KEY,
  CUSTOM_FOODS_KEY,
  DAILY_METADATA_KEY,
  FOOD_LOG_KEY,
  NOTIFICATION_SETTINGS_KEY,
  SAVED_MEALS_KEY,
  SAVED_PLANS_KEY,
  SCHEDULE_KEY,
  SETTINGS_KEY,
  TEMPLATES_KEY,
  VITALS_LOG_KEY,
  WATER_LOG_KEY,
  WORKOUTS_KEY,
  COMPLETION_KEY,
} from '../constants/storageKeys.js';
import {
  safeLoad,
  ensureAmPm,
  normalizeWorkoutsMap,
  clearPlannerLocalData,
  LEGACY_DAY_KEY_REGEX,
} from './storageCore.js';
import { loadSchedule } from './scheduleStorage.js';
import {
  loadSessionTitles,
  saveSessionTitles,
  loadDailyMetadata,
} from './sessionMetaStorage.js';
import { loadWorkouts } from './workoutStorage.js';
import { loadCompletion, normalizeCompletionMap } from './completionStorage.js';
import {
  loadExerciseDb,
  saveExerciseDbCache,
  isValidDb,
  loadCustomExercises,
  loadTemplates,
} from './exerciseDbStorage.js';

export { clearPlannerLocalData };

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
    const savedPlans = safeLoad(SAVED_PLANS_KEY, []);
    const activePlanId = localStorage.getItem(ACTIVE_PLAN_KEY);
    const templates = loadTemplates();
    const customExercises = loadCustomExercises();
    const dailyMetadata = loadDailyMetadata();
    const settings = loadSettings();
    const foodLog = safeLoad(FOOD_LOG_KEY, {});
    const customFoods = getCustomFoods();
    const savedMeals = getSavedMeals();
    const bookmarkedFoods = getBookmarkedFoods();
    const notifEnabled = localStorage.getItem(NOTIFICATION_SETTINGS_KEY) === 'true';
    const vitalsLog = safeLoad(VITALS_LOG_KEY, {});
    const waterLog = safeLoad(WATER_LOG_KEY, {});

    await Promise.all([
      saveCloudSchedule(schedule),
      saveCloudCompletionMap(completion),
      saveCloudExerciseDb(exerciseDb),
      saveCloudSessionTitles(sessionTitles),
      saveCloudSavedPlans(savedPlans),
      saveCloudActivePlanId(activePlanId),
      saveCloudTemplates(templates),
      saveCloudCustomExercises(customExercises),
      saveCloudDailyMetadata(dailyMetadata),
      saveCloudSettings(settings),
      saveCloudFoodLog(foodLog),
      saveCloudCustomFoods(customFoods),
      saveCloudSavedMeals(savedMeals),
      saveCloudBookmarkedFoods(bookmarkedFoods),
      saveCloudNotifSettings(notifEnabled),
      saveCloudVitalsLog(vitalsLog),
      saveCloudWaterLog(waterLog),
      ...Object.entries(workouts).map(([day, dayData]) =>
        saveCloudDayWorkout(day, ensureAmPm(dayData))
      )
    ]);

    return { ok: true };
  } catch (err) {
    console.warn('[storage] Local to cloud migration failed:', err);
    return { ok: false, reason: 'migration-failed' };
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
      saveCloudSavedPlans([]),
      saveCloudActivePlanId(''),
      saveCloudTemplates([]),
      saveCloudCustomExercises({}),
      saveCloudDailyMetadata({}),
      saveCloudVitalsLog({}),
      saveCloudWaterLog({}),
    ]);

    clearPlannerLocalData();
    return { ok: true };
  } catch (err) {
    console.warn('[storage] Failed to clear cloud data:', err);
    return { ok: false, reason: 'cloud-clear-failed' };
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

    const {
      schedule, workouts, completion, exerciseDb, sessionTitles,
      savedPlans, activePlanId, templates, customExercises, dailyMetadata,
      settings, foodLog, customFoods, savedMeals, bookmarkedFoods,
      vitalsLog, waterLog, notifSettings
    } = result;

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

    if (savedPlans && Array.isArray(savedPlans.plans)) {
      localStorage.setItem(SAVED_PLANS_KEY, JSON.stringify(savedPlans.plans));
    }

    if (activePlanId && activePlanId.id) {
      localStorage.setItem(ACTIVE_PLAN_KEY, activePlanId.id);
    }

    if (templates && Array.isArray(templates.templates)) {
      localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates.templates));
    }

    if (customExercises && typeof customExercises === 'object' && Object.keys(customExercises).length > 0) {
      localStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(customExercises));
    }

    if (dailyMetadata && typeof dailyMetadata === 'object' && Object.keys(dailyMetadata).length > 0) {
      localStorage.setItem(DAILY_METADATA_KEY, JSON.stringify(dailyMetadata));
    }

    if (settings && typeof settings === 'object') {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }

    if (foodLog && typeof foodLog === 'object') {
      localStorage.setItem(FOOD_LOG_KEY, JSON.stringify(foodLog));
    }

    if (customFoods && Array.isArray(customFoods.foods)) {
      localStorage.setItem(CUSTOM_FOODS_KEY, JSON.stringify(customFoods.foods));
    }

    if (savedMeals && Array.isArray(savedMeals.meals)) {
      localStorage.setItem(SAVED_MEALS_KEY, JSON.stringify(savedMeals.meals));
    }

    if (bookmarkedFoods && Array.isArray(bookmarkedFoods.bookmarks)) {
      localStorage.setItem(BOOKMARKED_FOODS_KEY, JSON.stringify(bookmarkedFoods.bookmarks));
    }

    if (vitalsLog && typeof vitalsLog === 'object') {
      localStorage.setItem(VITALS_LOG_KEY, JSON.stringify(vitalsLog));
    }

    if (waterLog && typeof waterLog === 'object') {
      localStorage.setItem(WATER_LOG_KEY, JSON.stringify(waterLog));
    }

    if (notifSettings && notifSettings.enabled !== undefined) {
      localStorage.setItem(NOTIFICATION_SETTINGS_KEY, notifSettings.enabled ? 'true' : 'false');
    }

    window.dispatchEvent(new CustomEvent('gymplanner_sync_completed'));
    return true;
  } catch (err) {
    console.warn('[storage] Cloud sync failed:', err);
    return false;
  }
}

export function freezeHistoryUnderPlan(plan) {
  const allWorkouts = loadWorkouts();
  const metadata = loadDailyMetadata();
  const completion = loadCompletion();

  let modified = false;

  const checkAndFreeze = (dateStr, session) => {
    const dMeta = metadata[dateStr]?.[session] || {};
    if (dMeta.isShifted || dMeta.isShiftedFrom) return;

    // Check if it already has a valid override
    if (
      dMeta.title !== undefined &&
      dMeta.title !== null &&
      dMeta.title.trim() !== '' &&
      dMeta.title.trim().toLowerCase() !== 'workout'
    ) {
      return;
    }

    const title = getPlanSessionTitle(dateStr, session, plan);
    if (!metadata[dateStr]) metadata[dateStr] = { am: {}, pm: {} };
    metadata[dateStr][session] = {
      ...(metadata[dateStr][session] || {}),
      title: title || 'Workout'
    };
    modified = true;
  };

  // Freeze all logged workouts
  for (const [dateStr, sessions] of Object.entries(allWorkouts)) {
    for (const session of ['am', 'pm']) {
      const workout = sessions[session];
      const hasWorkoutData = (workout?.groups?.length > 0) || (workout?.standaloneExercises?.length > 0);
      if (hasWorkoutData) {
        checkAndFreeze(dateStr, session);
      }
    }
  }

  // Freeze all completed/skipped workouts
  for (const key of Object.keys(completion)) {
    const isCompleted = completion[key] === true || completion[key] === 'skipped';
    if (isCompleted) {
      const match = key.match(/^(\d{4}-\d{2}-\d{2})_(am|pm)$/);
      if (match) {
        checkAndFreeze(match[1], match[2]);
      }
    }
  }

  if (modified) {
    localStorage.setItem(DAILY_METADATA_KEY, JSON.stringify(metadata));
    runCloudSync(
      () => saveCloudDailyMetadata(metadata),
      '[storage] Cloud metadata sync failed during global freeze:'
    );
  }
}

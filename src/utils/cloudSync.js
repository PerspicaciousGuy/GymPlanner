import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';

function getPlannerDoc(name) {
  const uid = auth?.currentUser?.uid;
  if (!db || !uid) return null;
  return doc(db, 'users', uid, 'planner', name);
}

export function isCloudSyncReady() {
  return Boolean(isFirebaseConfigured && db && auth?.currentUser);
}

async function readPlannerDoc(name) {
  const ref = getPlannerDoc(name);
  if (!ref) return null;
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

async function savePlannerDoc(name, payload, merge = false) {
  const ref = getPlannerDoc(name);
  if (!ref) return false;
  await setDoc(ref, payload, { merge });
  return true;
}

export async function fetchCloudPlannerData() {
  if (!isCloudSyncReady()) return null;

  const [
    schedule, 
    workouts, 
    completion, 
    exerciseDb, 
    sessionTitles,
    savedPlans,
    activePlanId,
    templates,
    customExercises,
    dailyMetadata,
    settings,
    foodLog,
    customFoods,
    savedMeals,
    bookmarkedFoods,
    notifSettings
  ] = await Promise.all([
    readPlannerDoc('schedule'),
    readPlannerDoc('workouts'),
    readPlannerDoc('completion'),
    readPlannerDoc('exerciseDb'),
    readPlannerDoc('sessionTitles'),
    readPlannerDoc('savedPlans'),
    readPlannerDoc('activePlanId'),
    readPlannerDoc('templates'),
    readPlannerDoc('customExercises'),
    readPlannerDoc('dailyMetadata'),
    readPlannerDoc('settings'),
    readPlannerDoc('foodLog'),
    readPlannerDoc('customFoods'),
    readPlannerDoc('savedMeals'),
    readPlannerDoc('bookmarkedFoods'),
    readPlannerDoc('notifSettings'),
  ]);

  return {
    schedule: schedule || null,
    workouts: workouts || null,
    completion: completion || null,
    exerciseDb: exerciseDb || null,
    sessionTitles: sessionTitles || null,
    savedPlans: savedPlans || null,
    activePlanId: activePlanId || null,
    templates: templates || null,
    customExercises: customExercises || null,
    dailyMetadata: dailyMetadata || null,
    settings: settings || null,
    foodLog: foodLog || null,
    customFoods: customFoods || null,
    savedMeals: savedMeals || null,
    bookmarkedFoods: bookmarkedFoods || null,
    notifSettings: notifSettings || null,
  };
}

export async function saveCloudSettings(settings) {
  return savePlannerDoc('settings', settings || {}, false);
}

export async function saveCloudFoodLog(foodLog) {
  return savePlannerDoc('foodLog', foodLog || {}, false);
}

export async function saveCloudCustomFoods(customFoods) {
  return savePlannerDoc('customFoods', { foods: customFoods || [] }, false);
}

export async function saveCloudSavedMeals(savedMeals) {
  return savePlannerDoc('savedMeals', { meals: savedMeals || [] }, false);
}

export async function saveCloudBookmarkedFoods(bookmarks) {
  return savePlannerDoc('bookmarkedFoods', { bookmarks: bookmarks || [] }, false);
}

export async function saveCloudNotifSettings(enabled) {
  return savePlannerDoc('notifSettings', { enabled: Boolean(enabled) }, false);
}


export async function saveCloudSavedPlans(plans) {
  return savePlannerDoc('savedPlans', { plans: plans || [] }, false);
}

export async function saveCloudActivePlanId(id) {
  return savePlannerDoc('activePlanId', { id: id || '' }, false);
}

export async function saveCloudTemplates(templates) {
  return savePlannerDoc('templates', { templates: templates || [] }, false);
}

export async function saveCloudCustomExercises(exercises) {
  return savePlannerDoc('customExercises', exercises || {}, false);
}

export async function saveCloudDailyMetadata(metadata) {
  return savePlannerDoc('dailyMetadata', metadata || {}, false);
}

export async function saveCloudSchedule(schedule) {
  return savePlannerDoc('schedule', schedule || {}, true);
}

export async function saveCloudDayWorkout(day, dayData) {
  return savePlannerDoc('workouts', { [day]: dayData }, true);
}

export async function saveCloudWorkoutsMap(workoutsMap) {
  return savePlannerDoc('workouts', workoutsMap || {}, false);
}

export async function saveCloudCompletionEntry(day, session, value) {
  return savePlannerDoc('completion', { [`${day}_${session}`]: value }, true);
}

export async function saveCloudCompletionMap(completionMap) {
  return savePlannerDoc('completion', completionMap || {}, false);
}

export async function saveCloudExerciseDb(exerciseDb) {
  return savePlannerDoc('exerciseDb', exerciseDb || {}, false);
}

export async function saveCloudSessionTitles(sessionTitles) {
  return savePlannerDoc('sessionTitles', sessionTitles || {}, false);
}

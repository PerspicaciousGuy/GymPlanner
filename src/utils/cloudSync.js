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
  const ref = getPlannerDoc('settings');
  if (!ref) return false;
  await setDoc(ref, settings || {}, { merge: false });
  return true;
}

export async function saveCloudFoodLog(foodLog) {
  const ref = getPlannerDoc('foodLog');
  if (!ref) return false;
  await setDoc(ref, foodLog || {}, { merge: false });
  return true;
}

export async function saveCloudCustomFoods(customFoods) {
  const ref = getPlannerDoc('customFoods');
  if (!ref) return false;
  await setDoc(ref, { foods: customFoods || [] }, { merge: false });
  return true;
}

export async function saveCloudSavedMeals(savedMeals) {
  const ref = getPlannerDoc('savedMeals');
  if (!ref) return false;
  await setDoc(ref, { meals: savedMeals || [] }, { merge: false });
  return true;
}

export async function saveCloudBookmarkedFoods(bookmarks) {
  const ref = getPlannerDoc('bookmarkedFoods');
  if (!ref) return false;
  await setDoc(ref, { bookmarks: bookmarks || [] }, { merge: false });
  return true;
}

export async function saveCloudNotifSettings(enabled) {
  const ref = getPlannerDoc('notifSettings');
  if (!ref) return false;
  await setDoc(ref, { enabled: Boolean(enabled) }, { merge: false });
  return true;
}


export async function saveCloudSavedPlans(plans) {
  const ref = getPlannerDoc('savedPlans');
  if (!ref) return false;
  await setDoc(ref, { plans: plans || [] }, { merge: false });
  return true;
}

export async function saveCloudActivePlanId(id) {
  const ref = getPlannerDoc('activePlanId');
  if (!ref) return false;
  await setDoc(ref, { id: id || '' }, { merge: false });
  return true;
}

export async function saveCloudTemplates(templates) {
  const ref = getPlannerDoc('templates');
  if (!ref) return false;
  await setDoc(ref, { templates: templates || [] }, { merge: false });
  return true;
}

export async function saveCloudCustomExercises(exercises) {
  const ref = getPlannerDoc('customExercises');
  if (!ref) return false;
  await setDoc(ref, exercises || {}, { merge: false });
  return true;
}

export async function saveCloudDailyMetadata(metadata) {
  const ref = getPlannerDoc('dailyMetadata');
  if (!ref) return false;
  await setDoc(ref, metadata || {}, { merge: false });
  return true;
}

export async function saveCloudSchedule(schedule) {
  const ref = getPlannerDoc('schedule');
  if (!ref) return false;
  await setDoc(ref, schedule || {}, { merge: true });
  return true;
}

export async function saveCloudDayWorkout(day, dayData) {
  const ref = getPlannerDoc('workouts');
  if (!ref) return false;
  await setDoc(ref, { [day]: dayData }, { merge: true });
  return true;
}

export async function saveCloudWorkoutsMap(workoutsMap) {
  const ref = getPlannerDoc('workouts');
  if (!ref) return false;
  await setDoc(ref, workoutsMap || {}, { merge: false });
  return true;
}

export async function saveCloudCompletionEntry(day, session, value) {
  const ref = getPlannerDoc('completion');
  if (!ref) return false;
  await setDoc(ref, { [`${day}_${session}`]: value }, { merge: true });
  return true;
}

export async function saveCloudCompletionMap(completionMap) {
  const ref = getPlannerDoc('completion');
  if (!ref) return false;
  await setDoc(ref, completionMap || {}, { merge: false });
  return true;
}

export async function saveCloudExerciseDb(exerciseDb) {
  const ref = getPlannerDoc('exerciseDb');
  if (!ref) return false;
  await setDoc(ref, exerciseDb || {}, { merge: false });
  return true;
}

export async function saveCloudSessionTitles(sessionTitles) {
  const ref = getPlannerDoc('sessionTitles');
  if (!ref) return false;
  await setDoc(ref, sessionTitles || {}, { merge: false });
  return true;
}

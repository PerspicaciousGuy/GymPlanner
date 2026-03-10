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

  const [schedule, workouts, completion, exerciseDb, sessionTitles] = await Promise.all([
    readPlannerDoc('schedule'),
    readPlannerDoc('workouts'),
    readPlannerDoc('completion'),
    readPlannerDoc('exerciseDb'),
    readPlannerDoc('sessionTitles'),
  ]);

  return {
    schedule: schedule || null,
    workouts: workouts || null,
    completion: completion || null,
    exerciseDb: exerciseDb || null,
    sessionTitles: sessionTitles || null,
  };
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

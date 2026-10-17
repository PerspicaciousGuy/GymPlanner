import { exerciseDatabase } from '../data/exerciseDatabase.js';
import {
  saveCloudExerciseDb,
  saveCloudTemplates,
  saveCloudCustomExercises,
} from './cloudSync.js';
import { runCloudSync } from './cloudSyncRunner.js';
import {
  CUSTOM_EXERCISES_KEY,
  EXERCISE_DB_KEY,
  TEMPLATES_KEY,
} from '../constants/storageKeys.js';
import { safeLoad } from './storageCore.js';

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
    runCloudSync(
      () => saveCloudCustomExercises(all),
      '[storage] Cloud custom exercise sync failed:'
    );
  }
}

// ─── Workout Templates ────────────────────────────────────────
export function loadTemplates() {
  const res = safeLoad(TEMPLATES_KEY, []);
  return Array.isArray(res) ? res : [];
}

export function saveTemplate(name, groups, standaloneExercises) {
  const templates = loadTemplates();
  const newTemplate = {
    id: crypto.randomUUID(),
    name,
    groups: groups ? JSON.parse(JSON.stringify(groups)) : [], // Deep clone to avoid references
    standaloneExercises: standaloneExercises ? JSON.parse(JSON.stringify(standaloneExercises)) : [],
    createdAt: new Date().toISOString()
  };
  templates.push(newTemplate);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  runCloudSync(
    () => saveCloudTemplates(templates),
    '[storage] Cloud templates sync failed:'
  );
  return newTemplate;
}

export function updateTemplate(id, name, groups, standaloneExercises) {
  const templates = loadTemplates();
  const idx = templates.findIndex(t => t.id === id);
  if (idx === -1) return null;

  templates[idx] = {
    ...templates[idx],
    name,
    groups: groups ? JSON.parse(JSON.stringify(groups)) : [],
    standaloneExercises: standaloneExercises ? JSON.parse(JSON.stringify(standaloneExercises)) : [],
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  runCloudSync(
    () => saveCloudTemplates(templates),
    '[storage] Cloud templates sync failed:'
  );
  return templates[idx];
}

export function deleteTemplate(id) {
  const templates = loadTemplates().filter(t => t.id !== id);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  runCloudSync(
    () => saveCloudTemplates(templates),
    '[storage] Cloud templates delete sync failed:'
  );
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
  runCloudSync(
    () => saveCloudExerciseDb(db),
    '[storage] Cloud exercise DB sync failed:'
  );
}

export function isValidDb(db) {
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

  if (!db) return;
  runCloudSync(
    () => saveCloudExerciseDb(db),
    '[storage] Cloud exercise add sync failed:'
  );
}

export function removeExerciseWithSync(muscle, subMuscle, name) {
  removeExerciseFromCache(muscle, subMuscle, name);
  const db = loadExerciseDb();

  if (!db) return;
  runCloudSync(
    () => saveCloudExerciseDb(db),
    '[storage] Cloud exercise delete sync failed:'
  );
}

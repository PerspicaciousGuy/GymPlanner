// ─── Google Sheets (Apps Script) API ─────────────────────────
const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

// All requests use GET to avoid Apps Script CORS issues with POST redirects.
// Object values are JSON-encoded into query params.
async function callApi(params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).map(([k, v]) => [
        k,
        typeof v === 'object' ? JSON.stringify(v) : v,
      ])
    )
  ).toString();
  const res = await fetch(`${API_URL}?${qs}`, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Sheets API failed: ${res.status}`);
  return res.json();
}

// ─── Schedule ─────────────────────────────────────────────────
export async function apiGetSchedule() {
  return callApi({ action: 'getSchedule' });
}

export async function apiSaveSchedule(data) {
  return callApi({ action: 'saveSchedule', data });
}

// ─── Workouts ─────────────────────────────────────────────────
export async function apiGetWorkouts(day) {
  return callApi({ action: 'getWorkouts', day });
}

export async function apiSaveWorkout(day, data) {
  return callApi({ action: 'saveWorkout', day, data });
}

// ─── Completion ───────────────────────────────────────────────
export async function apiGetCompletion() {
  return callApi({ action: 'getCompletion' });
}

export async function apiMarkComplete(day, session) {
  return callApi({ action: 'markComplete', day, session });
}

// ─── Exercise Database ─────────────────────────────────────────
export async function apiGetExerciseDatabase() {
  return callApi({ action: 'getExerciseDatabase' });
}

export async function apiSaveExercise(muscle, subMuscle, name) {
  return callApi({ action: 'saveExercise', muscle, subMuscle, name });
}

export async function apiDeleteExercise(muscle, subMuscle, name) {
  return callApi({ action: 'deleteExercise', muscle, subMuscle, name });
}

// ─── Bulk sync helpers ────────────────────────────────────────
// Returns { schedule, completion, exerciseDb } or null on failure
export async function apiFetchAll() {
  try {
    const [schedule, completion] = await Promise.all([
      apiGetSchedule(),
      apiGetCompletion(),
    ]);
    // Exercise DB is optional — don't block if handler not yet in Apps Script
    let exerciseDb = null;
    try {
      exerciseDb = await apiGetExerciseDatabase();
    } catch {
      console.warn('[api] Exercise DB fetch failed — using local fallback');
    }
    return { schedule, completion, exerciseDb };
  } catch (err) {
    console.warn('[api] fetchAll failed — offline?', err);
    return null;
  }
}

// ─── Google Sheets (Apps Script) API ─────────────────────────
const API_URL =
  'https://script.google.com/macros/s/AKfycbzDQ1XYShC-DkBkkhmanle8r1Zw8m8mJ1wY2naHuIwDMd-2TAbpnAzHrufpbRoNtbmt/exec';

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

// ─── Custom Exercises ─────────────────────────────────────────
export async function apiGetCustomExercises() {
  return callApi({ action: 'getCustomExercises' });
}

export async function apiSaveCustomExercise(muscle, subMuscle, name) {
  return callApi({ action: 'saveCustomExercise', muscle, subMuscle, name });
}

// ─── Bulk sync helpers ────────────────────────────────────────
// Returns { schedule, completion } or null on failure
export async function apiFetchAll() {
  try {
    const [schedule, completion, customExercises] = await Promise.all([
      apiGetSchedule(),
      apiGetCompletion(),
      apiGetCustomExercises(),
    ]);
    return { schedule, completion, customExercises };
  } catch (err) {
    console.warn('[api] fetchAll failed — offline?', err);
    return null;
  }
}

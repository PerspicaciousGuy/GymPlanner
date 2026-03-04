// ─── Google Sheets (Apps Script) API ─────────────────────────
const API_URL =
  'https://script.google.com/macros/s/AKfycbzDQ1XYShC-DkBkkhmanle8r1Zw8m8mJ1wY2naHuIwDMd-2TAbpnAzHrufpbRoNtbmt/exec';

async function get(params = {}) {
  const qs = new URLSearchParams({ ...params }).toString();
  const res = await fetch(`${API_URL}?${qs}`);
  if (!res.ok) throw new Error(`Sheets GET failed: ${res.status}`);
  return res.json();
}

async function post(body = {}) {
  const res = await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Sheets POST failed: ${res.status}`);
  return res.json();
}

// ─── Schedule ─────────────────────────────────────────────────
export async function apiGetSchedule() {
  return get({ action: 'getSchedule' });
}

export async function apiSaveSchedule(data) {
  return post({ action: 'saveSchedule', data });
}

// ─── Workouts ─────────────────────────────────────────────────
export async function apiGetWorkouts(day) {
  return get({ action: 'getWorkouts', day });
}

export async function apiSaveWorkout(day, data) {
  return post({ action: 'saveWorkout', day, data });
}

// ─── Completion ───────────────────────────────────────────────
export async function apiGetCompletion() {
  return get({ action: 'getCompletion' });
}

export async function apiMarkComplete(day, session) {
  return post({ action: 'markComplete', day, session });
}

// ─── Bulk sync helpers ────────────────────────────────────────
// Returns { schedule, completion } or null on failure
export async function apiFetchAll() {
  try {
    const [schedule, completion] = await Promise.all([
      apiGetSchedule(),
      apiGetCompletion(),
    ]);
    return { schedule, completion };
  } catch (err) {
    console.warn('[api] fetchAll failed — offline?', err);
    return null;
  }
}

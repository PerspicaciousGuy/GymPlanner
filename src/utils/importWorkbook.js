import * as XLSX from 'xlsx';
import { DAYS } from '../data/exerciseDatabase';
import { formatDateKey, getDayOfWeek } from './dateUtils';

const WORKOUT_KEYS = [
  'muscle',
  'subMuscle',
  'exercise',
  'sets',
  'reps',
  'weight',
  'dropSets',
  'dropWeight',
];

function normalizeSession(value) {
  const session = String(value || '').trim().toLowerCase();
  return session === 'pm' ? 'pm' : 'am';
}

function normalizeDateOrDay(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return formatDateKey(parsed);
  }

  const day = DAYS.find((d) => d.toLowerCase() === raw.toLowerCase());
  return day || raw;
}

function parseSessionsSheet(rows) {
  if (!rows || rows.length === 0) return null;

  const am = {};
  const pm = {};

  for (const row of rows) {
    const day = String(row.Day || row.day || '').trim();
    if (!DAYS.includes(day)) continue;

    am[day] = String(row['AM Session Title'] || row.am || '').trim();
    pm[day] = String(row['PM Session Title'] || row.pm || '').trim();
  }

  for (const day of DAYS) {
    if (!(day in am)) am[day] = '';
    if (!(day in pm)) pm[day] = '';
  }

  return { am, pm };
}

function parseWorkoutsSheet(rows) {
  if (!rows || rows.length === 0) return null;

  const parsed = [];

  for (const row of rows) {
    const dateCell = row.Date || row.date || row['Date/Day'] || row.dateOrDay || '';
    const dayCell = row.Day || row.day || '';
    const key = normalizeDateOrDay(dateCell || dayCell);
    if (!key) continue;

    const dayName = /^\d{4}-\d{2}-\d{2}$/.test(key) ? getDayOfWeek(key) : key;

    const rowData = {
      dateOrDay: key,
      day: dayName,
      session: normalizeSession(row.Session || row.session),
      groupIndex: String(row['Group Index'] || row.groupIndex || '1').trim() || '1',
      rowIndex: String(row['Row Index'] || row.rowIndex || '1').trim() || '1',
      muscle: String(row.Muscle || row.muscle || '').trim(),
      subMuscle: String(row['Sub Muscle'] || row.subMuscle || '').trim(),
      exercise: String(row.Exercise || row.exercise || '').trim(),
      sets: String(row.Sets || row.sets || '').trim(),
      reps: String(row.Reps || row.reps || '').trim(),
      weight: String(row.Weight || row.weight || '').trim(),
      dropSets: String(row['Drop Sets'] || row.dropSets || '').trim(),
      dropWeight: String(row['Drop Weight'] || row.dropWeight || '').trim(),
    };

    const hasData = WORKOUT_KEYS.some((k) => rowData[k] !== '');
    if (hasData) parsed.push(rowData);
  }

  return parsed;
}

function parseCompletionSheet(rows) {
  if (!rows || rows.length === 0) return null;

  const completion = {};

  for (const row of rows) {
    const dateOrDay = normalizeDateOrDay(row['Date/Day'] || row.Date || row.Day || row.date || row.day);
    if (!dateOrDay) continue;

    const session = normalizeSession(row.Session || row.session);
    const status = String(row.Status || row.status || '').trim().toLowerCase();

    if (status === 'done') {
      completion[`${dateOrDay}_${session}`] = true;
    } else if (status === 'skipped') {
      completion[`${dateOrDay}_${session}`] = 'skipped';
    }
  }

  return completion;
}

function parseExerciseDbSheet(rows) {
  if (!rows || rows.length === 0) return null;

  return rows
    .map((row) => ({
      muscle: String(row.Muscle || row.muscle || '').trim(),
      subMuscle: String(row['Sub Muscle'] || row.subMuscle || '').trim(),
      exercise: String(row.Exercise || row.exercise || '').trim(),
    }))
    .filter((row) => row.muscle || row.subMuscle || row.exercise);
}

function readSheetRows(workbook, name) {
  const sheet = workbook.Sheets[name];
  if (!sheet) return null;

  return XLSX.utils.sheet_to_json(sheet, {
    defval: '',
    raw: false,
  });
}

export async function importPlannerWorkbook(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  const sessionsRows = readSheetRows(workbook, 'Sessions');
  const workoutsRows = readSheetRows(workbook, 'Workouts');
  const completionRows = readSheetRows(workbook, 'Completion');
  const exerciseRows = readSheetRows(workbook, 'ExerciseDB');

  return {
    sessionTitles: parseSessionsSheet(sessionsRows),
    workoutRows: parseWorkoutsSheet(workoutsRows),
    completion: parseCompletionSheet(completionRows),
    exerciseRows: parseExerciseDbSheet(exerciseRows),
  };
}

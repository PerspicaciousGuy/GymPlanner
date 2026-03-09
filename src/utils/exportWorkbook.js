import * as XLSX from 'xlsx';
import { DAYS } from '../data/exerciseDatabase';

const WORKOUT_FIELDS = [
  'muscle',
  'subMuscle',
  'exercise',
  'sets',
  'reps',
  'weight',
  'dropSets',
  'dropWeight',
];

function hasWorkoutData(row) {
  return WORKOUT_FIELDS.some((field) => String(row?.[field] ?? '').trim() !== '');
}

function completionStatus(value) {
  if (value === 'skipped') return 'Skipped';
  if (value === true) return 'Done';
  return '';
}

function toSafeCell(value) {
  return value == null ? '' : String(value);
}

function addSheet(workbook, name, headers, rows) {
  const matrix = [headers, ...rows];
  const sheet = XLSX.utils.aoa_to_sheet(matrix);
  XLSX.utils.book_append_sheet(workbook, sheet, name);
}

function buildFileName() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const date = [now.getFullYear(), pad(now.getMonth() + 1), pad(now.getDate())].join('');
  const time = [pad(now.getHours()), pad(now.getMinutes()), pad(now.getSeconds())].join('');
  return `GymPlanner-Export-${date}-${time}.xlsx`;
}

export function exportPlannerWorkbook({
  sessionTitles,
  workoutRows,
  completion,
  exerciseRows,
  mode = 'all',
  activeTab = 'schedule',
}) {
  const workbook = XLSX.utils.book_new();

  const includeAll = mode === 'all';
  const includeTab = (tabKey) => includeAll || activeTab === tabKey;

  if (includeTab('schedule')) {
    const sessionsRows = DAYS.map((day) => [
      day,
      toSafeCell(sessionTitles?.am?.[day]),
      toSafeCell(sessionTitles?.pm?.[day]),
    ]);
    addSheet(workbook, 'Sessions', ['Day', 'AM Session Title', 'PM Session Title'], sessionsRows);
  }

  if (includeTab('workouts')) {
    const workoutsRows = (workoutRows || [])
      .filter((row) => hasWorkoutData(row))
      .map((row) => [
        toSafeCell(row.dateOrDay),
        toSafeCell(row.day),
        toSafeCell(String(row.session || '').toUpperCase()),
        toSafeCell(row.groupIndex),
        toSafeCell(row.rowIndex),
        toSafeCell(row.muscle),
        toSafeCell(row.subMuscle),
        toSafeCell(row.exercise),
        toSafeCell(row.sets),
        toSafeCell(row.reps),
        toSafeCell(row.weight),
        toSafeCell(row.dropSets),
        toSafeCell(row.dropWeight),
      ]);
    addSheet(
      workbook,
      'Workouts',
      [
        'Date',
        'Day',
        'Session',
        'Group Index',
        'Row Index',
        'Muscle',
        'Sub Muscle',
        'Exercise',
        'Sets',
        'Reps',
        'Weight',
        'Drop Sets',
        'Drop Weight',
      ],
      workoutsRows
    );
  }

  if (includeTab('completion')) {
    // Export all completion data with dates (not just current week)
    const completionEntries = Object.entries(completion || {})
      .filter(([key]) => /_(?:am|pm)$/.test(key))
      .map(([key, value]) => {
        const match = key.match(/^(.+)_(am|pm)$/);
        if (!match) return null;
        const [_, identifier, session] = match;
        // Check if identifier is a date (YYYY-MM-DD) or day name
        const isDate = /^\d{4}-\d{2}-\d{2}$/.test(identifier);
        return [
          isDate ? identifier : identifier, // Date or Day
          session.toUpperCase(),
          completionStatus(value),
        ];
      })
      .filter(Boolean)
      .sort((a, b) => {
        // Sort by date/day, then by session
        const cmp = a[0].localeCompare(b[0]);
        return cmp !== 0 ? cmp : a[1].localeCompare(b[1]);
      });

    if (completionEntries.length === 0) {
      // Fallback: show empty week structure if no data
      const completionRows = DAYS.map((day) => [day, '', '']);
      addSheet(workbook, 'Completion', ['Day', 'Session', 'Status'], completionRows);
    } else {
      addSheet(workbook, 'Completion', ['Date/Day', 'Session', 'Status'], completionEntries);
    }
  }

  if (includeTab('exerciseDb')) {
    const exerciseDbRows = (exerciseRows || [])
      .filter((row) => {
        const muscle = String(row?.muscle ?? '').trim();
        const subMuscle = String(row?.subMuscle ?? '').trim();
        const exercise = String(row?.exercise ?? '').trim();
        return Boolean(muscle || subMuscle || exercise);
      })
      .map((row) => [
        toSafeCell(row.muscle),
        toSafeCell(row.subMuscle),
        toSafeCell(row.exercise),
      ]);
    addSheet(workbook, 'ExerciseDB', ['Muscle', 'Sub Muscle', 'Exercise'], exerciseDbRows);
  }

  XLSX.writeFile(workbook, buildFileName());
}

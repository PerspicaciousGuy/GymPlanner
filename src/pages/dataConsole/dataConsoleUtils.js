import { DAYS } from '../../data/exerciseDatabase';
import {
  defaultDayWorkout,
  defaultGroup,
  defaultRow,
  ensureAmPm,
  loadWorkouts,
} from '../../utils/storage';
import {
  formatDateKey,
  getDayOfWeek,
  getDateForDayInWeek,
  getWeekStart,
} from '../../utils/dateUtils';

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

function hasWorkoutRowData(row) {
  return WORKOUT_FIELDS.some((key) => String(row?.[key] ?? '').trim() !== '');
}

export function normalizeWorkoutDateKey(value) {
  if (value instanceof Date) return formatDateKey(value);
  const raw = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (DAYS.includes(raw)) {
    return formatDateKey(getDateForDayInWeek(getWeekStart(new Date()), raw));
  }
  return '';
}

export function blankWorkoutGridRow(dateOrDay = formatDateKey(new Date()), session = 'am') {
  const dateKey = normalizeWorkoutDateKey(dateOrDay) || formatDateKey(new Date());
  const day = getDayOfWeek(dateKey);

  return {
    dateOrDay: dateKey,
    day,
    session,
    groupIndex: '1',
    rowIndex: '1',
    muscle: '',
    subMuscle: '',
    exercise: '',
    sets: '',
    reps: '',
    weight: '',
    dropSets: '',
    dropWeight: '',
  };
}

export function flattenWorkoutsForGrid(workoutsMap, { includeEmpty = false } = {}) {
  const rows = [];

  for (const [dateOrDayKey, dayData] of Object.entries(workoutsMap)) {
    const dateKey = normalizeWorkoutDateKey(dateOrDayKey);
    if (!dateKey) continue;
    const data = ensureAmPm(dayData);
    const dayName = getDayOfWeek(new Date(dateKey));

    for (const session of ['am', 'pm']) {
      const sessData = data?.[session] ?? {};
      const groups = sessData.groups ?? [];
      const standalone = sessData.standaloneExercises ?? [];

      groups.forEach((group, groupIdx) => {
        (group.rows ?? []).forEach((row, rowIdx) => {
          const flatRow = {
            dateOrDay: dateKey,
            day: dayName,
            session,
            groupIndex: String(groupIdx + 1),
            rowIndex: String(rowIdx + 1),
            muscle: row.muscle || '',
            subMuscle: row.subMuscle || '',
            exercise: row.exercise || '',
            sets: row.sets || '',
            reps: row.reps || '',
            weight: row.weight || '',
            dropSets: row.dropSets || '',
            dropWeight: row.dropWeight || '',
            isAdvanced: false
          };

          if (includeEmpty || hasWorkoutRowData(flatRow)) {
            rows.push(flatRow);
          }
        });
      });

      standalone.forEach((ex, exIdx) => {
        const flatRow = {
          dateOrDay: dateKey,
          day: dayName,
          session,
          groupIndex: `Adv ${exIdx + 1}`,
          rowIndex: '1',
          muscle: ex.muscle || '',
          subMuscle: ex.subMuscle || '',
          exercise: ex.exercise || '',
          sets: String(ex.sets?.length || 0),
          reps: ex.sets?.map(s => s.reps).filter(v => v !== '').join(',') || '',
          weight: ex.sets?.map(s => s.weight).filter(v => v !== '').join(',') || '',
          dropSets: '',
          dropWeight: '',
          isAdvanced: true,
          originalId: ex.id
        };

        if (includeEmpty || hasWorkoutRowData(flatRow)) {
          rows.push(flatRow);
        }
      });
    }
  }

  if (rows.length === 0) return [blankWorkoutGridRow()];
  return rows.sort((a, b) => b.dateOrDay.localeCompare(a.dateOrDay));
}

export function buildInitialWorkoutRows() {
  return flattenWorkoutsForGrid(loadWorkouts());
}

export function buildWorkoutsFromGrid(rows) {
  const workouts = {};

  for (const row of rows) {
    const key = normalizeWorkoutDateKey(row.dateOrDay || row.day);
    if (!key) continue;
    const session = row.session === 'pm' ? 'pm' : 'am';

    if (!workouts[key]) {
      workouts[key] = defaultDayWorkout();
    }

    const isAdvanced = String(row.groupIndex || '').startsWith('Adv');

    if (isAdvanced) {
      if (!workouts[key][session].standaloneExercises) {
        workouts[key][session].standaloneExercises = [];
      }

      const repsArr = String(row.reps || '').split(',').map(v => v.trim());
      const weightArr = String(row.weight || '').split(',').map(v => v.trim());
      const setInfo = [];
      const setLen = Math.max(repsArr.length, weightArr.length, Number(row.sets) || 1);

      for (let i = 0; i < setLen; i++) {
        setInfo.push({
          reps: repsArr[i] || '',
          weight: weightArr[i] || ''
        });
      }

      workouts[key][session].standaloneExercises.push({
        id: row.originalId || crypto.randomUUID(),
        muscle: row.muscle || '',
        subMuscle: row.subMuscle || '',
        exercise: row.exercise || '',
        totalSets: setInfo.length,
        sets: setInfo
      });
      continue;
    }

    const groupIndex = Math.max(1, Number.parseInt(String(row.groupIndex), 10) || 1);
    const rowIndex = Math.max(1, Number.parseInt(String(row.rowIndex), 10) || 1);

    const rowData = {
      muscle: row.muscle || '',
      subMuscle: row.subMuscle || '',
      exercise: row.exercise || '',
      sets: row.sets || '',
      reps: row.reps || '',
      weight: row.weight || '',
      dropSets: row.dropSets || '',
      dropWeight: row.dropWeight || '',
    };

    const hasData = WORKOUT_FIELDS.some((key) => String(rowData[key]).trim() !== '');
    if (!hasData) continue;

    const groups = workouts[key][session].groups;
    while (groups.length < groupIndex) {
      groups.push({ rows: [] });
    }

    const group = groups[groupIndex - 1];
    while (group.rows.length < rowIndex) {
      group.rows.push(defaultRow());
    }

    group.rows[rowIndex - 1] = rowData;
  }

  for (const key of Object.keys(workouts)) {
    for (const session of ['am', 'pm']) {
      const sess = workouts[key][session];
      const groups = sess.groups;
      if (groups.length === 0 && (!sess.standaloneExercises || sess.standaloneExercises.length === 0)) {
        sess.groups = [defaultGroup()];
        continue;
      }

      groups.forEach((group) => {
        if (!group.rows || group.rows.length === 0) {
          group.rows = [defaultRow()];
        }
      });
    }
  }

  return workouts;
}

export function flattenDbRows(db) {
  const rows = [];
  for (const [muscle, subMap] of Object.entries(db || {})) {
    for (const [subMuscle, exercises] of Object.entries(subMap || {})) {
      for (const exercise of exercises || []) {
        rows.push({ muscle, subMuscle, exercise });
      }
    }
  }
  return rows;
}

export function buildDbFromRows(rows) {
  const db = {};
  for (const row of rows) {
    const muscle = (row.muscle || '').trim();
    const subMuscle = (row.subMuscle || '').trim();
    const exercise = (row.exercise || '').trim();
    if (!muscle || !subMuscle || !exercise) continue;

    if (!db[muscle]) db[muscle] = {};
    if (!db[muscle][subMuscle]) db[muscle][subMuscle] = [];
    if (!db[muscle][subMuscle].includes(exercise)) {
      db[muscle][subMuscle].push(exercise);
    }
  }
  return db;
}

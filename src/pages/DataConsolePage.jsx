import { useState } from 'react';
import { DAYS, exerciseDatabase } from '../data/exerciseDatabase';
import {
  defaultDayWorkout,
  defaultGroup,
  defaultRow,
  ensureAmPm,
  loadCompletion,
  loadExerciseDb,
  loadSessionTitles,
  loadWorkouts,
  saveCompletionWithSync,
  saveDayWorkoutWithSync,
  saveExerciseDbWithSync,
  saveSessionTitlesWithSync,
} from '../utils/storage';
import { exportPlannerWorkbook } from '../utils/exportWorkbook';

const TABS = [
  { key: 'schedule', label: 'Sessions' },
  { key: 'workouts', label: 'Workouts' },
  { key: 'completion', label: 'Completion' },
  { key: 'exerciseDb', label: 'Exercise DB' },
];

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

function blankWorkoutGridRow(day = DAYS[0], session = 'am') {
  return {
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

function flattenWorkoutsForGrid(workoutsMap, { includeEmpty = false } = {}) {
  const rows = [];

  for (const day of DAYS) {
    const dayData = ensureAmPm(workoutsMap?.[day]);

    for (const session of ['am', 'pm']) {
      const groups = dayData?.[session]?.groups ?? [];
      groups.forEach((group, groupIdx) => {
        (group.rows ?? []).forEach((row, rowIdx) => {
          const flatRow = {
            day,
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
          };

          if (includeEmpty || hasWorkoutRowData(flatRow)) {
            rows.push(flatRow);
          }
        });
      });
    }
  }

  if (rows.length === 0) return [blankWorkoutGridRow()];
  return rows;
}

function buildInitialWorkoutRows() {
  return flattenWorkoutsForGrid(loadWorkouts());
}

function buildWorkoutsFromGrid(rows) {
  const workouts = {};

  for (const day of DAYS) {
    workouts[day] = defaultDayWorkout();
    workouts[day].am = { groups: [] };
    workouts[day].pm = { groups: [] };
  }

  for (const row of rows) {
    const day = DAYS.includes(row.day) ? row.day : DAYS[0];
    const session = row.session === 'pm' ? 'pm' : 'am';
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

    const groups = workouts[day][session].groups;
    while (groups.length < groupIndex) {
      groups.push({ rows: [] });
    }

    const group = groups[groupIndex - 1];
    while (group.rows.length < rowIndex) {
      group.rows.push(defaultRow());
    }

    group.rows[rowIndex - 1] = rowData;
  }

  for (const day of DAYS) {
    for (const session of ['am', 'pm']) {
      const groups = workouts[day][session].groups;
      if (groups.length === 0) {
        workouts[day][session] = { groups: [defaultGroup()] };
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

function flattenDbRows(db) {
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

function buildDbFromRows(rows) {
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

function completionStatus(val) {
  if (val === 'skipped') return 'skipped';
  if (val === true) return 'done';
  return '';
}

export default function DataConsolePage() {
  const [activeTab, setActiveTab] = useState('schedule');

  const [sessionTitles, setSessionTitles] = useState(() => loadSessionTitles());
  const [titlesSaved, setTitlesSaved] = useState(false);

  const [workoutRows, setWorkoutRows] = useState(() => buildInitialWorkoutRows());
  const [workoutsSaved, setWorkoutsSaved] = useState(false);
  const [workoutFilterDay, setWorkoutFilterDay] = useState('all');
  const [workoutFilterSession, setWorkoutFilterSession] = useState('all');
  const [showAdvancedCols, setShowAdvancedCols] = useState(false);

  const [completion, setCompletion] = useState(() => loadCompletion());
  const [completionSaved, setCompletionSaved] = useState(false);

  const [exerciseRows, setExerciseRows] = useState(() => {
    const db = loadExerciseDb() || exerciseDatabase;
    return flattenDbRows(db);
  });
  const [exerciseSaved, setExerciseSaved] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportNote, setExportNote] = useState('');

  const flashSaved = (setter) => {
    setter(true);
    setTimeout(() => setter(false), 1800);
  };

  const tabClass = (tabKey) => [
    'px-4 py-2 text-sm font-semibold border-b-2 transition-colors',
    activeTab === tabKey
      ? 'text-blue-700 border-blue-600'
      : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300',
  ].join(' ');

  const updateWorkoutRow = (idx, field, value) => {
    setWorkoutRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };

  const addWorkoutGridRow = () => {
    setWorkoutRows((prev) => {
      const fallbackDay = workoutFilterDay === 'all' ? DAYS[0] : workoutFilterDay;
      const fallbackSession = workoutFilterSession === 'all' ? 'am' : workoutFilterSession;
      const last = prev[prev.length - 1] || blankWorkoutGridRow(fallbackDay, fallbackSession);
      const day = workoutFilterDay === 'all' ? last.day : workoutFilterDay;
      const session = workoutFilterSession === 'all' ? last.session : workoutFilterSession;
      return [...prev, blankWorkoutGridRow(day, session)];
    });
  };

  const removeWorkoutGridRow = (idx) => {
    setWorkoutRows((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== idx);
    });
  };

  const saveWorkoutGrid = () => {
    const workouts = buildWorkoutsFromGrid(workoutRows);
    for (const day of DAYS) {
      saveDayWorkoutWithSync(day, ensureAmPm(workouts[day]));
    }
    setWorkoutRows(flattenWorkoutsForGrid(workouts));
    flashSaved(setWorkoutsSaved);
  };

  const visibleWorkoutRows = workoutRows
    .map((row, idx) => ({ row, idx }))
    .filter(({ row }) => {
      const dayOk = workoutFilterDay === 'all' || row.day === workoutFilterDay;
      const sessionOk = workoutFilterSession === 'all' || row.session === workoutFilterSession;
      return dayOk && sessionOk;
    });

  const setCompletionCell = (day, session, status) => {
    const key = `${day}_${session}`;
    setCompletion((prev) => {
      const next = { ...prev };
      if (status === '') {
        delete next[key];
      } else if (status === 'done') {
        next[key] = true;
      } else {
        next[key] = 'skipped';
      }
      return next;
    });
  };

  const saveCompletionGrid = () => {
    saveCompletionWithSync(completion);
    flashSaved(setCompletionSaved);
  };

  const updateExerciseRow = (idx, field, value) => {
    setExerciseRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };

  const addExerciseRow = () => {
    setExerciseRows((prev) => [...prev, { muscle: '', subMuscle: '', exercise: '' }]);
  };

  const removeExerciseRow = (idx) => {
    setExerciseRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const saveExerciseGrid = () => {
    const db = buildDbFromRows(exerciseRows);
    saveExerciseDbWithSync(db);
    setExerciseRows(flattenDbRows(db));
    flashSaved(setExerciseSaved);
  };

  const handleExport = (mode = 'current') => {
    try {
      setExporting(true);
      exportPlannerWorkbook({
        sessionTitles,
        workoutRows,
        completion,
        exerciseRows,
        mode: mode === 'all' ? 'all' : 'current',
        activeTab,
      });
      setExportNote(mode === 'all' ? 'All tabs exported' : 'Current tab exported');
    } catch {
      setExportNote('Export failed');
    } finally {
      setExporting(false);
      setTimeout(() => setExportNote(''), 2200);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Data Console</h1>
          <p className="text-sm text-gray-500">
            Spreadsheet-style editable tables for all planner data.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleExport('current')}
            disabled={exporting}
            className="px-4 py-2 rounded text-sm font-semibold border border-emerald-300 text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
          >
            {exporting ? 'Exporting...' : 'Export Current Tab (.xlsx)'}
          </button>
          <button
            onClick={() => handleExport('all')}
            disabled={exporting}
            className="px-4 py-2 rounded text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-60"
          >
            Export All Tabs (.xlsx)
          </button>
          {exportNote && <span className="text-xs text-emerald-700">{exportNote}</span>}
        </div>
      </div>

      <div className="border-b border-gray-200 overflow-x-auto">
        <div className="flex min-w-max gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={tabClass(tab.key)}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'schedule' && (
        <div className="flex flex-col gap-4">
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full bg-white text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 w-40">Day</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">AM Session Title</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">PM Session Title</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {DAYS.map((day) => (
                  <tr key={day}>
                    <td className="px-4 py-2 font-medium text-gray-800">{day}</td>
                    <td className="px-4 py-2">
                      <input
                        value={sessionTitles.am?.[day] || ''}
                        onChange={(e) =>
                          setSessionTitles((prev) => ({
                            ...prev,
                            am: { ...prev.am, [day]: e.target.value },
                          }))
                        }
                        className="border border-gray-300 rounded px-3 py-1.5 bg-white text-gray-800 w-full min-w-72"
                        placeholder="AM title"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={sessionTitles.pm?.[day] || ''}
                        onChange={(e) =>
                          setSessionTitles((prev) => ({
                            ...prev,
                            pm: { ...prev.pm, [day]: e.target.value },
                          }))
                        }
                        className="border border-gray-300 rounded px-3 py-1.5 bg-white text-gray-800 w-full min-w-72"
                        placeholder="PM title"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                saveSessionTitlesWithSync(sessionTitles);
                flashSaved(setTitlesSaved);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded text-sm"
            >
              Save Session Titles
            </button>
            {titlesSaved && (
              <span className="text-green-600 text-sm font-medium">Saved session titles</span>
            )}
          </div>
        </div>
      )}

      {activeTab === 'workouts' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm font-medium text-gray-700">
              Day
              <select
                value={workoutFilterDay}
                onChange={(e) => setWorkoutFilterDay(e.target.value)}
                className="ml-2 border border-gray-300 rounded px-3 py-1.5 bg-white"
              >
                <option value="all">All</option>
                {DAYS.map((day) => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-gray-700">
              Session
              <select
                value={workoutFilterSession}
                onChange={(e) => setWorkoutFilterSession(e.target.value)}
                className="ml-2 border border-gray-300 rounded px-3 py-1.5 bg-white"
              >
                <option value="all">All</option>
                <option value="am">AM</option>
                <option value="pm">PM</option>
              </select>
            </label>
            <button
              onClick={() => setShowAdvancedCols((v) => !v)}
              className="border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm font-medium px-4 py-2 rounded"
            >
              {showAdvancedCols ? 'Hide Advanced' : 'Show Advanced'}
            </button>
            <button
              onClick={addWorkoutGridRow}
              className="border border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 text-sm font-medium px-4 py-2 rounded"
            >
              Add Workout Row
            </button>
            <button
              onClick={saveWorkoutGrid}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded text-sm"
            >
              Save Workouts Grid
            </button>
            {workoutsSaved && (
              <span className="text-green-600 text-sm font-medium">Saved workouts</span>
            )}
            <span className="text-xs text-gray-500">
              Showing {visibleWorkoutRows.length} of {workoutRows.length} rows
            </span>
            {!showAdvancedCols && (
              <span className="text-xs text-gray-400">
                Group/Row index columns are hidden in basic view.
              </span>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className={`${showAdvancedCols ? 'min-w-[1550px]' : 'min-w-[1280px]'} bg-white text-sm`}>
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600 w-12">#</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600 w-36">Day</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600 w-24">Session</th>
                  {showAdvancedCols && <th className="px-3 py-2 text-left font-semibold text-gray-600 w-28">GroupIndex</th>}
                  {showAdvancedCols && <th className="px-3 py-2 text-left font-semibold text-gray-600 w-28">RowIndex</th>}
                  <th className="px-3 py-2 text-left font-semibold text-gray-600 w-40">Muscle</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600 w-40">SubMuscle</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600 w-52">Exercise</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600 w-24">Sets</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600 w-24">Reps</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600 w-24">Weight</th>
                  {showAdvancedCols && <th className="px-3 py-2 text-left font-semibold text-gray-600 w-24">DropSets</th>}
                  {showAdvancedCols && <th className="px-3 py-2 text-left font-semibold text-gray-600 w-28">DropWeight</th>}
                  <th className="px-3 py-2 text-left font-semibold text-gray-600 w-20">Row</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleWorkoutRows.map(({ row, idx }, visibleIdx) => (
                  <tr key={`workout-row-${idx}`}>
                    <td className="px-3 py-2 text-gray-500">{visibleIdx + 1}</td>
                    <td className="px-3 py-2">
                      <select
                        value={row.day}
                        onChange={(e) => updateWorkoutRow(idx, 'day', e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 w-full bg-white"
                      >
                        {DAYS.map((day) => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={row.session}
                        onChange={(e) => updateWorkoutRow(idx, 'session', e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 w-full bg-white"
                      >
                        <option value="am">AM</option>
                        <option value="pm">PM</option>
                      </select>
                    </td>
                    {showAdvancedCols && (
                      <td className="px-3 py-2">
                        <input
                          value={row.groupIndex}
                          onChange={(e) => updateWorkoutRow(idx, 'groupIndex', e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 w-full"
                          inputMode="numeric"
                        />
                      </td>
                    )}
                    {showAdvancedCols && (
                      <td className="px-3 py-2">
                        <input
                          value={row.rowIndex}
                          onChange={(e) => updateWorkoutRow(idx, 'rowIndex', e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 w-full"
                          inputMode="numeric"
                        />
                      </td>
                    )}
                    <td className="px-3 py-2">
                      <input
                        value={row.muscle}
                        onChange={(e) => updateWorkoutRow(idx, 'muscle', e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 w-full"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={row.subMuscle}
                        onChange={(e) => updateWorkoutRow(idx, 'subMuscle', e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 w-full"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={row.exercise}
                        onChange={(e) => updateWorkoutRow(idx, 'exercise', e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 w-full"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={row.sets}
                        onChange={(e) => updateWorkoutRow(idx, 'sets', e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 w-full"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={row.reps}
                        onChange={(e) => updateWorkoutRow(idx, 'reps', e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 w-full"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={row.weight}
                        onChange={(e) => updateWorkoutRow(idx, 'weight', e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 w-full"
                      />
                    </td>
                    {showAdvancedCols && (
                      <td className="px-3 py-2">
                        <input
                          value={row.dropSets}
                          onChange={(e) => updateWorkoutRow(idx, 'dropSets', e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 w-full"
                        />
                      </td>
                    )}
                    {showAdvancedCols && (
                      <td className="px-3 py-2">
                        <input
                          value={row.dropWeight}
                          onChange={(e) => updateWorkoutRow(idx, 'dropWeight', e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 w-full"
                        />
                      </td>
                    )}
                    <td className="px-3 py-2">
                      <button
                        onClick={() => removeWorkoutGridRow(idx)}
                        className="text-red-600 hover:text-red-700 text-xs font-semibold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {visibleWorkoutRows.length === 0 && (
                  <tr>
                    <td colSpan={showAdvancedCols ? 14 : 10} className="px-4 py-6 text-center text-sm text-gray-500">
                      No rows match this filter. Add a workout row or switch filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'completion' && (
        <div className="flex flex-col gap-4">
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full bg-white text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 w-40">Day</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">AM</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">PM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {DAYS.map((day) => (
                  <tr key={day}>
                    <td className="px-4 py-2 font-medium text-gray-800">{day}</td>
                    {['am', 'pm'].map((session) => (
                      <td key={session} className="px-4 py-2">
                        <select
                          value={completionStatus(completion[`${day}_${session}`])}
                          onChange={(e) => setCompletionCell(day, session, e.target.value)}
                          className="border border-gray-300 rounded px-3 py-1.5 bg-white"
                        >
                          <option value="">None</option>
                          <option value="done">Done</option>
                          <option value="skipped">Skipped</option>
                        </select>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={saveCompletionGrid}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded text-sm"
            >
              Save Completion
            </button>
            {completionSaved && (
              <span className="text-green-600 text-sm font-medium">Saved completion</span>
            )}
          </div>
        </div>
      )}

      {activeTab === 'exerciseDb' && (
        <div className="flex flex-col gap-4">
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full bg-white text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Muscle</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Sub Muscle</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Exercise</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 w-16">Row</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {exerciseRows.map((row, idx) => (
                  <tr key={`${row.muscle}-${row.subMuscle}-${row.exercise}-${idx}`}>
                    <td className="px-4 py-2">
                      <input
                        value={row.muscle}
                        onChange={(e) => updateExerciseRow(idx, 'muscle', e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 w-44"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={row.subMuscle}
                        onChange={(e) => updateExerciseRow(idx, 'subMuscle', e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 w-44"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={row.exercise}
                        onChange={(e) => updateExerciseRow(idx, 'exercise', e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 w-64"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => removeExerciseRow(idx)}
                        className="text-red-600 hover:text-red-700 text-xs font-semibold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={addExerciseRow}
              className="border border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 text-sm font-medium px-4 py-2 rounded"
            >
              Add Exercise Row
            </button>
            <button
              onClick={saveExerciseGrid}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded text-sm"
            >
              Save Exercise DB
            </button>
            {exerciseSaved && (
              <span className="text-green-600 text-sm font-medium">Saved exercise DB</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

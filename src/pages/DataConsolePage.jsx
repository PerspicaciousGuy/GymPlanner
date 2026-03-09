import { useRef, useState } from 'react';
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
  getCompletionForWeek,
  setCompletionStatusWithSync,
} from '../utils/storage';
import { exportPlannerWorkbook } from '../utils/exportWorkbook';
import { importPlannerWorkbook } from '../utils/importWorkbook';
import { 
  getWeekStart, 
  formatDateCompact, 
  formatDateKey,
  getDayOfWeek,
} from '../utils/dateUtils';
import WeekPicker from '../components/WeekPicker';

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

function blankWorkoutGridRow(dateOrDay = formatDateKey(new Date()), session = 'am') {
  // If dateOrDay is a date string or Date object, extract the day name
  const day = typeof dateOrDay === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateOrDay)
    ? getDayOfWeek(new Date(dateOrDay))
    : dateOrDay instanceof Date
    ? getDayOfWeek(dateOrDay)
    : dateOrDay;
  
  return {
    dateOrDay: dateOrDay,
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

    // Workouts are now keyed by date (YYYY-MM-DD) instead of day names
    for (const [dateKey, dayData] of Object.entries(workoutsMap)) {
      const data = ensureAmPm(dayData);
      const dayName = /^\d{4}-\d{2}-\d{2}$/.test(dateKey)
        ? getDayOfWeek(new Date(dateKey))
        : dateKey; // Fallback for old day-name keys during transition

    for (const session of ['am', 'pm']) {
        const groups = data?.[session]?.groups ?? [];
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
          };

          if (includeEmpty || hasWorkoutRowData(flatRow)) {
            rows.push(flatRow);
          }
        });
      });
    }
  }

  if (rows.length === 0) return [blankWorkoutGridRow()];
  // Sort by date descending (newest first)
  return rows.sort((a, b) => b.dateOrDay.localeCompare(a.dateOrDay));
}

function buildInitialWorkoutRows() {
  return flattenWorkoutsForGrid(loadWorkouts());
}

function buildWorkoutsFromGrid(rows) {
  const workouts = {};

  for (const row of rows) {
    const key = row.dateOrDay || row.day; // Use date if available, fall back to day
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

    if (!workouts[key]) {
      workouts[key] = defaultDayWorkout();
    }

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

  // Ensure at least one group with one row for each date/session
  for (const key of Object.keys(workouts)) {
    for (const session of ['am', 'pm']) {
      const groups = workouts[key][session].groups;
      if (groups.length === 0) {
        workouts[key][session] = { groups: [defaultGroup()] };
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

  // Week state for Completion tab
  const [selectedWeek, setSelectedWeek] = useState(() => getWeekStart(new Date()));
  const [completionSaved, setCompletionSaved] = useState(false);

  const [exerciseRows, setExerciseRows] = useState(() => {
    const db = loadExerciseDb() || exerciseDatabase;
    return flattenDbRows(db);
  });
  const [exerciseSaved, setExerciseSaved] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportNote, setExportNote] = useState('');
  const [importing, setImporting] = useState(false);
  const [importNote, setImportNote] = useState('');
  const importInputRef = useRef(null);

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
    for (const [key, data] of Object.entries(workouts)) {
      saveDayWorkoutWithSync(key, ensureAmPm(data));
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

  // Load completion for selected week
  const weekCompletion = getCompletionForWeek(selectedWeek);

  const setCompletionCell = (date, session, status) => {
    setCompletionStatusWithSync(date, session, status);
    // Force re-render by updating selectedWeek to same value
    setSelectedWeek(new Date(selectedWeek));
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
        completion: loadCompletion(),
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

  const handleImportClick = () => {
    if (importing) return;
    importInputRef.current?.click();
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const parsed = await importPlannerWorkbook(file);

      if (parsed.sessionTitles) {
        saveSessionTitlesWithSync(parsed.sessionTitles);
        setSessionTitles(parsed.sessionTitles);
      }

      if (parsed.workoutRows?.length) {
        const workoutsMap = buildWorkoutsFromGrid(parsed.workoutRows);
        for (const [key, data] of Object.entries(workoutsMap)) {
          saveDayWorkoutWithSync(key, ensureAmPm(data));
        }
        setWorkoutRows(flattenWorkoutsForGrid(loadWorkouts()));
      }

      if (parsed.completion) {
        saveCompletionWithSync(parsed.completion);
        setSelectedWeek(new Date(selectedWeek));
      }

      if (parsed.exerciseRows) {
        const db = buildDbFromRows(parsed.exerciseRows);
        saveExerciseDbWithSync(db);
        setExerciseRows(flattenDbRows(db));
      }

      setImportNote('Import complete');
    } catch {
      setImportNote('Import failed');
    } finally {
      setImporting(false);
      event.target.value = '';
      setTimeout(() => setImportNote(''), 2400);
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
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportFile}
            className="hidden"
          />
          <button
            onClick={handleImportClick}
            disabled={importing}
            className="px-4 py-2 rounded text-sm font-semibold border border-blue-300 text-blue-700 hover:bg-blue-50 disabled:opacity-60"
          >
            {importing ? 'Importing...' : 'Import Data (.xlsx)'}
          </button>
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
          {importNote && <span className="text-xs text-blue-700">{importNote}</span>}
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
            <table className={`${showAdvancedCols ? 'min-w-[1700px]' : 'min-w-[1400px]'} bg-white text-sm`}>
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600 w-12">#</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600 w-36">Day</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600 w-32">Date</th>
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
                      <input
                        value={row.day}
                        readOnly
                        className="border border-gray-300 rounded px-2 py-1 w-full bg-gray-50"
                        title="Day name is auto-calculated from date"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="date"
                        value={row.dateOrDay || ''}
                        onChange={(e) => {
                          const newDate = e.target.value;
                          updateWorkoutRow(idx, 'dateOrDay', newDate);
                          // Update day name based on date
                          if (newDate) {
                            const dayName = getDayOfWeek(newDate);
                            updateWorkoutRow(idx, 'day', dayName);
                          }
                        }}
                        className="border border-gray-300 rounded px-2 py-1 w-full"
                      />
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
          <WeekPicker 
            currentWeekStart={selectedWeek} 
            onWeekChange={setSelectedWeek} 
          />
          
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full bg-white text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 w-40">Day</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 w-32">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">AM</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">PM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {DAYS.map((day) => {
                  const dayData = weekCompletion[day];
                  const dateDisplay = dayData ? formatDateCompact(dayData.date) : '';
                  const dateKey = dayData ? dayData.date : null;
                  
                  return (
                    <tr key={day}>
                      <td className="px-4 py-2 font-medium text-gray-800">{day}</td>
                      <td className="px-4 py-2 text-gray-600 text-xs">{dateDisplay}</td>
                      {['am', 'pm'].map((session) => {
                        const value = dayData?.[session];
                        const status = value === true ? 'done' : value === 'skipped' ? 'skipped' : '';
                        
                        return (
                          <td key={session} className="px-4 py-2">
                            <select
                              value={status}
                              onChange={(e) => setCompletionCell(dateKey, session, e.target.value)}
                              className="border border-gray-300 rounded px-3 py-1.5 bg-white"
                              disabled={!dateKey}
                            >
                              <option value="">None</option>
                              <option value="done">Done</option>
                              <option value="skipped">Skipped</option>
                            </select>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-3">
            {completionSaved && (
              <span className="text-green-600 text-sm font-medium">✓ Saved completion</span>
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

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
import { importPlannerWorkbook } from '../utils/importWorkbook';
import { useRef } from 'react';
import AppleSelect from '../components/AppleSelect';

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
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);

  const flashSaved = (setter) => {
    setter(true);
    setTimeout(() => setter(false), 1800);
  };

  const tabClass = (tabKey) => [
    'px-6 py-2 text-xs font-black uppercase tracking-widest transition-all rounded-xl border-2',
    activeTab === tabKey
      ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100'
      : 'bg-white border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50',
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
    setCompletion((prev) => {
      const next = { ...prev };
      if (!next[day]) next[day] = {};

      if (status === 'none') {
        delete next[day][session];
      } else {
        next[day][session] = status === 'done' ? 'done' : 'skipped';
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

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const data = await importPlannerWorkbook(file);

      let importedCount = 0;
      if (data.sessionTitles) {
        setSessionTitles(data.sessionTitles);
        importedCount++;
      }
      if (data.workoutRows) {
        setWorkoutRows(data.workoutRows);
        importedCount++;
      }
      if (data.completion) {
        setCompletion(data.completion);
        importedCount++;
      }
      if (data.exerciseRows) {
        setExerciseRows(data.exerciseRows);
        importedCount++;
      }

      if (importedCount > 0) {
        setExportNote(`Imported data from ${importedCount} tab(s). Don't forget to SAVE.`);
      } else {
        setExportNote('No valid GymPlanner tabs found in file.');
      }
    } catch (err) {
      console.error(err);
      setExportNote('Import failed: invalid or corrupt file');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setExportNote(''), 4000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col gap-8 bg-gray-50/50 min-h-screen">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 bg-blue-600 h-6 rounded-full"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Administrative</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Data Console</h1>
          <p className="text-sm text-gray-400 font-medium">Manage your elite training datasets and cloud synchronization.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
          <button
            onClick={() => handleExport('current')}
            disabled={exporting}
            className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-100 text-emerald-600 hover:bg-emerald-50 transition-all disabled:opacity-60"
          >
            {exporting ? '...' : 'Export Tab'}
          </button>
          <button
            onClick={() => handleExport('all')}
            disabled={exporting}
            className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-gray-100 text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-60"
          >
            Export All
          </button>
          <div className="h-6 w-px bg-gray-100"></div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-60"
          >
            {importing ? '...' : 'Import Excel'}
          </button>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="inline-flex p-1.5 bg-gray-100 rounded-2xl border border-gray-200 shadow-inner gap-1">
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

      {exportNote && (
        <div className="flex justify-center -mt-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100 animate-in fade-in slide-in-from-top-1">
            {exportNote}
          </span>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="premium-card overflow-hidden">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-white">
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 w-40">Day</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">AM Session Title</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">PM Session Title</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {DAYS.map((day) => (
                  <tr key={day} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">{day}</td>
                    <td className="px-6 py-3">
                      <input
                        value={sessionTitles.am?.[day] || ''}
                        onChange={(e) =>
                          setSessionTitles((prev) => ({
                            ...prev,
                            am: { ...prev.am, [day]: e.target.value },
                          }))
                        }
                        className="w-full border border-gray-100 rounded-xl px-4 py-2.5 bg-gray-50/50 text-gray-800 text-sm focus:bg-white focus:ring-4 focus:ring-blue-100/50 outline-none transition-all font-semibold"
                        placeholder="e.g. Upper Body Focus"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <input
                        value={sessionTitles.pm?.[day] || ''}
                        onChange={(e) =>
                          setSessionTitles((prev) => ({
                            ...prev,
                            pm: { ...prev.pm, [day]: e.target.value },
                          }))
                        }
                        className="w-full border border-gray-100 rounded-xl px-4 py-2.5 bg-gray-50/50 text-gray-800 text-sm focus:bg-white focus:ring-4 focus:ring-blue-100/50 outline-none transition-all font-semibold"
                        placeholder="e.g. Cardio + Recovery"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                saveSessionTitlesWithSync(sessionTitles);
                flashSaved(setTitlesSaved);
              }}
              className="px-8 py-3 rounded-xl text-xs font-black uppercase tracking-[0.2em] bg-blue-600 text-white shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              Save Changes <span>→</span>
            </button>
            {titlesSaved && (
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                ✓ Strategy Updated
              </span>
            )}
          </div>
        </div>
      )}

      {activeTab === 'workouts' && (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Filter Day</label>
              <AppleSelect
                value={workoutFilterDay}
                onChange={setWorkoutFilterDay}
                options={[
                  { label: 'ALL DAYS', value: 'all' },
                  ...DAYS.map(day => ({ label: day.toUpperCase(), value: day }))
                ]}
                className="w-40"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Phase</label>
              <AppleSelect
                value={workoutFilterSession}
                onChange={setWorkoutFilterSession}
                options={[
                  { label: 'BOTH PHASES', value: 'all' },
                  { label: 'AM ONLY', value: 'am' },
                  { label: 'PM ONLY', value: 'pm' }
                ]}
                className="w-48"
              />
            </div>

            <div className="h-6 w-px bg-gray-100"></div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAdvancedCols((v) => !v)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${showAdvancedCols ? 'bg-blue-50 border-blue-100 text-blue-600' : 'border-gray-100 text-gray-400 hover:bg-gray-50'}`}
              >
                Advanced Mode
              </button>
              <button
                onClick={addWorkoutGridRow}
                className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-dashed border-blue-200 text-blue-600 hover:bg-blue-50 transition-all"
              >
                + New Exercise
              </button>
              <button
                onClick={saveWorkoutGrid}
                className="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
              >
                Save Workout Map
              </button>
            </div>

            <div className="ml-auto flex items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                {visibleWorkoutRows.length} Rows Active
              </span>
              {workoutsSaved && (
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                  Grid Synchronized
                </span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className={`${showAdvancedCols ? 'min-w-[1900px]' : 'min-w-[1600px]'} bg-white text-sm`}>
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600 w-12">#</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600 w-44">Day</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600 w-32">Session</th>
                  {showAdvancedCols && <th className="px-3 py-2 text-left font-semibold text-gray-600 w-32">GroupIndex</th>}
                  {showAdvancedCols && <th className="px-3 py-2 text-left font-semibold text-gray-600 w-32">RowIndex</th>}
                  <th className="px-3 py-2 text-left font-semibold text-gray-600 w-52">Muscle</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600 w-52">SubMuscle</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600 w-72">Exercise</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600 w-32">Sets</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600 w-32">Reps</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600 w-32">Weight</th>
                  {showAdvancedCols && <th className="px-3 py-2 text-left font-semibold text-gray-600 w-32">DropSets</th>}
                  {showAdvancedCols && <th className="px-3 py-2 text-left font-semibold text-gray-600 w-32">DropWeight</th>}
                  <th className="px-3 py-2 text-left font-semibold text-gray-600 w-20">Row</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleWorkoutRows.map(({ row, idx }, visibleIdx) => (
                  <tr key={`workout-row-${idx}`} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-3 py-2 text-gray-300 font-bold">{visibleIdx + 1}</td>
                    <td className="px-3 py-2">
                      <AppleSelect
                        value={row.day}
                        onChange={(val) => updateWorkoutRow(idx, 'day', val)}
                        options={DAYS.map(day => ({ label: day.toUpperCase(), value: day }))}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <AppleSelect
                        value={row.session}
                        onChange={(val) => updateWorkoutRow(idx, 'session', val)}
                        options={[
                          { label: 'AM', value: 'am' },
                          { label: 'PM', value: 'pm' }
                        ]}
                      />
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
                        className="border border-gray-100 rounded-lg px-3 py-1.5 bg-gray-50/50 text-gray-800 text-sm focus:bg-white focus:ring-4 focus:ring-blue-100/50 outline-none transition-all font-semibold"
                      />
                    </td>
                    {showAdvancedCols && (
                      <td className="px-3 py-2">
                        <input
                          value={row.dropSets}
                          onChange={(e) => updateWorkoutRow(idx, 'dropSets', e.target.value)}
                          className="border border-gray-100 rounded-lg px-2 py-1.5 bg-gray-50/50 text-gray-800 text-sm focus:bg-white outline-none transition-all font-semibold"
                        />
                      </td>
                    )}
                    {showAdvancedCols && (
                      <td className="px-3 py-2">
                        <input
                          value={row.dropWeight}
                          onChange={(e) => updateWorkoutRow(idx, 'dropWeight', e.target.value)}
                          className="border border-gray-100 rounded-lg px-2 py-1.5 bg-gray-50/50 text-gray-800 text-sm focus:bg-white outline-none transition-all font-semibold"
                        />
                      </td>
                    )}
                    <td className="px-3 py-2">
                      <button
                        onClick={() => removeWorkoutGridRow(idx)}
                        className="text-rose-400 hover:text-rose-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'completion' && (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="premium-card overflow-hidden">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-white">
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 w-40">Day</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">AM Status</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">PM Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {DAYS.map((day) => (
                  <tr key={day} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">{day}</td>
                    <td className="px-6 py-3">
                      <AppleSelect
                        value={completion[day]?.am || 'none'}
                        onChange={(val) => setCompletionCell(day, 'am', val)}
                        options={[
                          { label: 'PENDING', value: 'none' },
                          { label: 'COMPLETED', value: 'done' },
                          { label: 'SKIPPED', value: 'skipped' }
                        ]}
                      />
                    </td>
                    <td className="px-6 py-3">
                      <AppleSelect
                        value={completion[day]?.pm || 'none'}
                        onChange={(val) => setCompletionCell(day, 'pm', val)}
                        options={[
                          { label: 'PENDING', value: 'none' },
                          { label: 'COMPLETED', value: 'done' },
                          { label: 'SKIPPED', value: 'skipped' }
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={saveCompletionGrid}
              className="px-8 py-3 rounded-xl text-xs font-black uppercase tracking-[0.2em] bg-blue-600 text-white shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              Sync Log <span>→</span>
            </button>
            {completionSaved && (
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                ✓ History Locked
              </span>
            )}
          </div>
        </div>
      )}

      {activeTab === 'exerciseDb' && (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={addExerciseRow}
                className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-dashed border-blue-200 text-blue-600 hover:bg-blue-50 transition-all"
              >
                + Register New Movement
              </button>
              <button
                onClick={saveExerciseGrid}
                className="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
              >
                Update Repository
              </button>
            </div>
            {exerciseSaved && (
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                ✓ Master Data Locked
              </span>
            )}
          </div>

          <div className="premium-card overflow-hidden">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-white">
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Muscle</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Sub Muscle</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-center">Exercise Name</th>
                  <th className="px-6 py-4 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {exerciseRows.map((row, idx) => (
                  <tr key={`${row.muscle}-${row.subMuscle}-${row.exercise}-${idx}`} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3">
                      <input
                        value={row.muscle}
                        onChange={(e) => updateExerciseRow(idx, 'muscle', e.target.value)}
                        className="w-full border border-gray-100 rounded-lg px-4 py-2 bg-gray-50/50 text-gray-800 text-xs font-bold focus:bg-white outline-none transition-all"
                        placeholder="e.g. Back"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <input
                        value={row.subMuscle}
                        onChange={(e) => updateExerciseRow(idx, 'subMuscle', e.target.value)}
                        className="w-full border border-gray-100 rounded-lg px-4 py-2 bg-gray-50/50 text-gray-800 text-xs font-bold focus:bg-white outline-none transition-all"
                        placeholder="e.g. Lats"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <input
                        value={row.exercise}
                        onChange={(e) => updateExerciseRow(idx, 'exercise', e.target.value)}
                        className="w-full border border-gray-100 rounded-lg px-4 py-2 bg-gray-50/50 text-gray-800 text-xs font-bold focus:bg-white outline-none transition-all text-center"
                        placeholder="e.g. Pull Ups"
                      />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => removeExerciseRow(idx)}
                        className="text-rose-400 hover:text-rose-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Search, 
  Filter, 
  Settings2,
  LayoutGrid,
  Boxes,
  CheckCircle2,
  Database,
  ChevronLeft,
  ChevronRight,
  Save,
  Grid,
  Calendar,
  X,
  ArrowUpDown,
  MoreHorizontal
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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
  saveWorkoutsMapWithSync,
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
  getDateForDayInWeek,
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

function normalizeWorkoutDateKey(value) {
  if (value instanceof Date) return formatDateKey(value);
  const raw = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (DAYS.includes(raw)) {
    return formatDateKey(getDateForDayInWeek(getWeekStart(new Date()), raw));
  }
  return '';
}

function blankWorkoutGridRow(dateOrDay = formatDateKey(new Date()), session = 'am') {
  const dateKey = normalizeWorkoutDateKey(dateOrDay) || formatDateKey(new Date());
  // If dateOrDay is a date string or Date object, extract the day name
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

function flattenWorkoutsForGrid(workoutsMap, { includeEmpty = false } = {}) {
  const rows = [];

    // Workouts are keyed by date; convert legacy day keys to current-week dates for display.
    for (const [dateOrDayKey, dayData] of Object.entries(workoutsMap)) {
      const dateKey = normalizeWorkoutDateKey(dateOrDayKey);
      if (!dateKey) continue;
      const data = ensureAmPm(dayData);
      const dayName = getDayOfWeek(new Date(dateKey));

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
    const key = normalizeWorkoutDateKey(row.dateOrDay || row.day);
    if (!key) continue;
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

export default function DataConsolePage({ hideSidebar }) {
  const [activeTab, setActiveTab] = useState('schedule');
  const [searchQuery, setSearchQuery] = useState('');

  const [sessionTitles, setSessionTitles] = useState(() => loadSessionTitles());
  const [titlesSaved, setTitlesSaved] = useState(false);

  const [workoutRows, setWorkoutRows] = useState(() => buildInitialWorkoutRows());
  const [workoutsSaved, setWorkoutsSaved] = useState(false);
  const [workoutFilterDay, setWorkoutFilterDay] = useState('all');
  const [workoutFilterSession, setWorkoutFilterSession] = useState('all');
  const [workoutFilterDate, setWorkoutFilterDate] = useState('');
  const [showAdvancedCols, setShowAdvancedCols] = useState(false);

  // Week state for Completion tab
  const [selectedWeek, setSelectedWeek] = useState(() => getWeekStart(new Date()));
  const [completionSaved, setCompletionSaved] = useState(false);

  const [exerciseRows, setExerciseRows] = useState(() => {
    const db = loadExerciseDb() || exerciseDatabase;
    return flattenDbRows(db);
  });
  const [dbVersion, setDbVersion] = useState(0);

  useEffect(() => {
    const handleDbChange = () => setDbVersion((v) => v + 1);
    window.addEventListener('gymplanner_db_changed', handleDbChange);
    return () => window.removeEventListener('gymplanner_db_changed', handleDbChange);
  }, []);

  useEffect(() => {
    const db = loadExerciseDb() || exerciseDatabase;
    setExerciseRows(flattenDbRows(db));
  }, [dbVersion]);

  const [exerciseSaved, setExerciseSaved] = useState(false);
  const [exercisePage, setExercisePage] = useState(1);
  const EXERCISES_PER_PAGE = 25;

  // Reset pagination when search query changes
  useEffect(() => {
    setExercisePage(1);
  }, [searchQuery]);

  const filteredExerciseRows = exerciseRows
    .map((row, idx) => ({ row, idx }))
    .filter(({ row }) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (row.muscle || '').toLowerCase().includes(q) ||
        (row.subMuscle || '').toLowerCase().includes(q) ||
        (row.exercise || '').toLowerCase().includes(q)
      );
    });

  const totalExercisePages = Math.ceil(filteredExerciseRows.length / EXERCISES_PER_PAGE) || 1;
  const paginatedExerciseRows = filteredExerciseRows.slice(
    (exercisePage - 1) * EXERCISES_PER_PAGE,
    exercisePage * EXERCISES_PER_PAGE
  );

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
      const fallbackSession = workoutFilterSession === 'all' ? 'am' : workoutFilterSession;
      const last = prev[prev.length - 1] || blankWorkoutGridRow(formatDateKey(new Date()), fallbackSession);
      const dateKey = normalizeWorkoutDateKey(last.dateOrDay) || formatDateKey(new Date());
      const day = workoutFilterDay === 'all' ? last.day : workoutFilterDay;
      const session = workoutFilterSession === 'all' ? last.session : workoutFilterSession;
      const rowDate = workoutFilterDay === 'all'
        ? dateKey
        : formatDateKey(getDateForDayInWeek(getWeekStart(new Date()), day));
      return [...prev, blankWorkoutGridRow(rowDate, session)];
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
    // Save the full workouts map so removed rows/dates are deleted from storage.
    saveWorkoutsMapWithSync(workouts);
    setWorkoutRows(flattenWorkoutsForGrid(workouts));
    flashSaved(setWorkoutsSaved);
  };

  const visibleWorkoutRows = workoutRows
    .map((row, idx) => ({ row, idx }))
    .filter(({ row }) => {
      const dayOk = workoutFilterDay === 'all' || row.day === workoutFilterDay;
      const sessionOk = workoutFilterSession === 'all' || row.session === workoutFilterSession;
      const dateOk = !workoutFilterDate || row.dateOrDay === workoutFilterDate;
      const q = searchQuery.toLowerCase();
      const searchMatch = !q || 
        (row.exercise || '').toLowerCase().includes(q) ||
        (row.muscle || '').toLowerCase().includes(q) ||
        (row.subMuscle || '').toLowerCase().includes(q);
      return dayOk && sessionOk && dateOk && searchMatch;
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
    setExerciseRows((prev) => [{ muscle: '', subMuscle: '', exercise: '' }, ...prev]);
    setExercisePage(1);
    setSearchQuery(''); // Clear search so the new row is visible
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
    <div className={`flex flex-col gap-6 ${!hideSidebar ? 'min-h-screen bg-[#f8fafc]' : ''}`}>
      {!hideSidebar && (
        <aside className="fixed left-0 top-0 bottom-0 w-20 lg:w-24 bg-white border-r border-slate-200 flex flex-col items-center py-8 gap-10 z-50">
          <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => setActiveTab('schedule')}>
            <div className={`p-3 rounded-xl transition-all ${activeTab === 'schedule' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}>
              <LayoutGrid size={24} />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${activeTab === 'schedule' ? 'text-indigo-600' : 'text-slate-400'}`}>Sessions</span>
          </div>

          <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => setActiveTab('workouts')}>
            <div className={`p-3 rounded-xl transition-all ${activeTab === 'workouts' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}>
              <Boxes size={24} />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${activeTab === 'workouts' ? 'text-indigo-600' : 'text-slate-400'}`}>Workouts</span>
          </div>

          <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => setActiveTab('completion')}>
            <div className={`p-3 rounded-xl transition-all ${activeTab === 'completion' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}>
              <CheckCircle2 size={24} />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${activeTab === 'completion' ? 'text-indigo-600' : 'text-slate-400'}`}>Completion</span>
          </div>

          <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => setActiveTab('exerciseDb')}>
            <div className={`p-3 rounded-xl transition-all ${activeTab === 'exerciseDb' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}>
              <Database size={24} />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${activeTab === 'exerciseDb' ? 'text-indigo-600' : 'text-slate-400'}`}>Exercise DB</span>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className={`flex-1 flex flex-col min-w-0 ${!hideSidebar ? 'md:pl-24 py-6 md:py-10 px-4 md:pr-8' : 'px-4 py-6 md:py-10'}`}>


        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:mb-6">
          <div className="flex-1">
            <h1 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">Data Console</h1>
            <p className="text-[10px] md:text-xs text-slate-400 font-medium">Configure workouts, sessions, and database.</p>
          </div>
          
          <div className="flex items-center gap-1.5 md:gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
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
              className="group flex items-center gap-2 px-2.5 md:px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold text-[10px] md:text-xs hover:bg-slate-50 transition-all shadow-sm shrink-0"
              title="Import Data"
            >
              <Upload size={14} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
              <span className="hidden xs:inline">Import</span>
            </button>
            <button
              onClick={() => handleExport('current')}
              disabled={exporting}
              className="flex items-center gap-2 px-2.5 md:px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold text-[10px] md:text-xs hover:bg-slate-50 transition-all shadow-sm shrink-0"
              title="Export Current Tab"
            >
              <Download size={14} className="text-slate-400" />
              <span className="hidden xs:inline">Export</span>
            </button>
            <button
              onClick={() => handleExport('all')}
              disabled={exporting}
              className="flex items-center gap-2 px-2.5 md:px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-[10px] md:text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 shrink-0"
              title="Export All Data"
            >
              <Database size={14} />
              <span className="hidden xs:inline">Export All</span>
            </button>

            <div className="hidden xs:block w-px h-6 bg-slate-100 mx-0.5 md:mx-1" />
            <button
              onClick={() => setShowAdvancedCols(!showAdvancedCols)}
              className="flex items-center gap-2 px-2.5 md:px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold text-[10px] md:text-xs hover:bg-slate-50 transition-all shadow-sm shrink-0"
              title="Display Options"
            >
              <Settings2 size={14} className="text-slate-400" />
              <span className="hidden xs:inline">Display</span>
            </button>
          </div>
        </div>


        {/* Tab Navigation */}
        <div className="flex items-center gap-4 md:gap-6 border-b border-slate-100 mb-4 md:mb-6 px-1 overflow-x-auto scrollbar-none whitespace-nowrap">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 px-1 text-[11px] md:text-xs font-bold transition-all relative shrink-0 ${
                activeTab === tab.key 
                  ? 'text-indigo-600' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl md:rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
          {/* Table Toolbar */}
          <div className="px-3 md:px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
            <div className="flex-1 w-full sm:max-w-xs relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
              <Input 
                placeholder={`Search ${activeTab === 'schedule' ? 'sessions' : 'data'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-slate-50 border-slate-200 rounded-xl text-[11px] md:text-xs focus-visible:ring-indigo-500/10 focus-visible:border-indigo-500 transition-all font-medium"
              />
            </div>
            
            <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
              {activeTab === 'workouts' && (
                <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                    <div 
                      onClick={(e) => e.currentTarget.querySelector('input').showPicker?.()}
                      className="flex items-center gap-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 focus-within:ring-2 focus-within:ring-indigo-500/10 focus-within:border-indigo-500 cursor-pointer"
                    >
                      <Calendar size={12} className="text-slate-400 shrink-0" />
                      <input
                        type="date"
                        value={workoutFilterDate}
                        onFocus={(e) => e.target.showPicker?.()}
                        onChange={(e) => setWorkoutFilterDate(e.target.value)}
                        className="bg-transparent py-1.5 text-[10px] md:text-xs font-bold text-slate-700 focus:outline-none w-24 md:w-28 cursor-pointer h-7"
                      />
                      {workoutFilterDate && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setWorkoutFilterDate('');
                          }}
                          className="p-0.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-md transition-all shrink-0"
                          title="Clear Date"
                        >
                          <X size={12} strokeWidth={3} />
                        </button>
                      )}
                    </div>
                  <select
                    value={workoutFilterDay}
                    onChange={(e) => setWorkoutFilterDay(e.target.value)}
                    className="flex-1 sm:flex-initial border border-slate-200 rounded-lg px-2 md:px-3 py-1.5 text-[10px] md:text-xs bg-slate-50 font-bold text-slate-700 focus:outline-none transition-all"
                  >
                    <option value="all">Day</option>
                    {DAYS.map((day) => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                  <select
                    value={workoutFilterSession}
                    onChange={(e) => setWorkoutFilterSession(e.target.value)}
                    className="flex-1 sm:flex-initial border border-slate-200 rounded-lg px-2 md:px-3 py-1.5 text-[10px] md:text-xs bg-slate-50 font-bold text-slate-700 focus:outline-none transition-all"
                  >
                    <option value="all">Ses</option>
                    <option value="am">AM</option>
                    <option value="pm">PM</option>
                  </select>
                  <button
                    onClick={addWorkoutGridRow}
                    className="p-1.5 rounded-lg border border-dashed border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors shrink-0"
                    title="Add Row"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              )}

              {activeTab === 'completion' && (
                <WeekPicker 
                  currentWeekStart={selectedWeek} 
                  onWeekChange={setSelectedWeek} 
                  compact
                />
              )}
              {activeTab === 'exerciseDb' && (
                <button
                  onClick={addExerciseRow}
                  className="flex items-center gap-1.5 rounded-lg border border-dashed border-indigo-200 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  <Plus size={14} />
                  New Exercise
                </button>
              )}
              <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                <Filter size={14} />
                Filter
              </button>
            </div>
          </div>

          {activeTab === 'schedule' && (
            <div className="flex-1 overflow-auto scrollbar-none">
              <Table className="min-w-[600px]">
                <TableHeader className="sticky top-0 bg-slate-50/50 backdrop-blur-sm border-b border-slate-100 z-10">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="px-4 py-3 text-left font-bold text-[10px] uppercase tracking-widest text-slate-400 w-40">Day</TableHead>
                    <TableHead className="px-4 py-3 text-left font-bold text-[10px] uppercase tracking-widest text-slate-400">AM Session Title</TableHead>
                    <TableHead className="px-4 py-3 text-left font-bold text-[10px] uppercase tracking-widest text-slate-400">PM Session Title</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-50">
                  {DAYS.map((day) => (
                    <TableRow key={day} className="group hover:bg-slate-50/50 transition-colors border-none">
                      <TableCell className="px-4 py-3 font-bold text-slate-700 italic">{day}</TableCell>
                      <TableCell className="px-4 py-2">
                        <Input
                          value={sessionTitles.am?.[day] || ''}
                          onChange={(e) =>
                            setSessionTitles((prev) => ({
                              ...prev,
                              am: { ...prev.am, [day]: e.target.value },
                            }))
                          }
                          className="h-9 bg-transparent border-transparent rounded-lg text-slate-700 focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-indigo-500/5 transition-all font-medium"
                          placeholder="e.g. Upper Body"
                        />
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        <Input
                          value={sessionTitles.pm?.[day] || ''}
                          onChange={(e) =>
                            setSessionTitles((prev) => ({
                              ...prev,
                              pm: { ...prev.pm, [day]: e.target.value },
                            }))
                          }
                          className="h-9 bg-transparent border-transparent rounded-lg text-slate-700 focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-indigo-500/5 transition-all font-medium"
                          placeholder="e.g. Cardio + Core"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {activeTab === 'workouts' && (
            <div className="flex-1 overflow-auto">
              <Table className="min-w-[1000px]">
                <TableHeader className="sticky top-0 bg-slate-50/50 backdrop-blur-sm border-b border-slate-100 z-10">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="px-3 py-3 text-left font-bold text-[10px] uppercase tracking-widest text-slate-400 w-10">#</TableHead>
                    <TableHead className="px-3 py-3 text-left font-bold text-[10px] uppercase tracking-widest text-slate-400 w-24">Day</TableHead>
                    <TableHead className="px-3 py-3 text-left font-bold text-[10px] uppercase tracking-widest text-slate-400 w-32">Date</TableHead>
                    <TableHead className="px-3 py-3 text-left font-bold text-[10px] uppercase tracking-widest text-slate-400 w-20">Session</TableHead>
                    {showAdvancedCols && <TableHead className="px-3 py-3 text-left font-bold text-[10px] uppercase tracking-widest text-slate-400 w-16">Group</TableHead>}
                    {showAdvancedCols && <TableHead className="px-3 py-3 text-left font-bold text-[10px] uppercase tracking-widest text-slate-400 w-16">Row</TableHead>}
                    <TableHead className="px-3 py-3 text-left font-bold text-[10px] uppercase tracking-widest text-slate-400">Muscle</TableHead>
                    <TableHead className="px-3 py-3 text-left font-bold text-[10px] uppercase tracking-widest text-slate-400">Sub Muscle</TableHead>
                    <TableHead className="px-3 py-3 text-left font-bold text-[10px] uppercase tracking-widest text-slate-400 w-80">Exercise</TableHead>
                    <TableHead className="px-3 py-3 text-left font-bold text-[10px] uppercase tracking-widest text-slate-400 w-16 text-center">Sets</TableHead>
                    <TableHead className="px-3 py-3 text-left font-bold text-[10px] uppercase tracking-widest text-slate-400 w-16 text-center">Reps</TableHead>
                    <TableHead className="px-3 py-3 text-left font-bold text-[10px] uppercase tracking-widest text-slate-400 w-20 text-center">Weight</TableHead>
                    <TableHead className="px-3 py-3 text-center font-bold text-[10px] uppercase tracking-widest text-slate-400 w-12">Del</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-50">
                  {visibleWorkoutRows.map(({ row, idx }, visibleIdx) => (
                    <TableRow key={`workout-row-${idx}`} className="group hover:bg-slate-50/50 transition-colors border-none">
                      <TableCell className="px-3 py-2 text-slate-300 font-bold text-[10px]">{visibleIdx + 1}</TableCell>
                      <TableCell className="px-3 py-2">
                        <span className="text-slate-700 font-bold italic text-[11px]">{row.day}</span>
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <Input
                          type="date"
                          value={row.dateOrDay || ''}
                          onChange={(e) => {
                            const newDate = e.target.value;
                            updateWorkoutRow(idx, 'dateOrDay', newDate);
                            if (newDate) {
                              const dayName = getDayOfWeek(newDate);
                              updateWorkoutRow(idx, 'day', dayName);
                            }
                          }}
                          className="h-8 bg-transparent border-transparent rounded-md text-slate-700 text-[11px] focus:bg-white focus:border-slate-200 transition-all"
                        />
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <select
                          value={row.session}
                          onChange={(e) => updateWorkoutRow(idx, 'session', e.target.value)}
                          className="w-full px-1 py-1 bg-transparent border border-transparent rounded-md text-slate-700 text-[10px] font-bold uppercase focus:bg-white focus:border-slate-200"
                        >
                          <option value="am">AM</option>
                          <option value="pm">PM</option>
                        </select>
                      </TableCell>
                      {showAdvancedCols && (
                        <TableCell className="px-3 py-2">
                          <Input
                            value={String(row.groupIndex)}
                            onChange={(e) => updateWorkoutRow(idx, 'groupIndex', e.target.value)}
                            className="h-8 bg-transparent border-transparent rounded-md text-slate-700 text-[10px] text-center focus:bg-white focus:border-slate-200"
                          />
                        </TableCell>
                      )}
                      {showAdvancedCols && (
                        <TableCell className="px-3 py-2">
                          <Input
                            value={String(row.rowIndex)}
                            onChange={(e) => updateWorkoutRow(idx, 'rowIndex', e.target.value)}
                            className="h-8 bg-transparent border-transparent rounded-md text-slate-700 text-[10px] text-center focus:bg-white focus:border-slate-200"
                          />
                        </TableCell>
                      )}
                      <TableCell className="px-3 py-2">
                        <Input
                          value={row.muscle}
                          onChange={(e) => updateWorkoutRow(idx, 'muscle', e.target.value)}
                          className="h-8 bg-transparent border-transparent rounded-md text-slate-700 text-[11px] font-medium focus:bg-white focus:border-slate-200"
                        />
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <Input
                          value={row.subMuscle}
                          onChange={(e) => updateWorkoutRow(idx, 'subMuscle', e.target.value)}
                          className="h-8 bg-transparent border-transparent rounded-md text-slate-700 text-[11px] font-medium focus:bg-white focus:border-slate-200"
                        />
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <Input
                          value={row.exercise}
                          onChange={(e) => updateWorkoutRow(idx, 'exercise', e.target.value)}
                          className="h-8 bg-transparent border-transparent rounded-md text-slate-700 text-[11px] font-bold focus:bg-white focus:border-slate-200"
                        />
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <Input
                          value={row.sets}
                          onChange={(e) => updateWorkoutRow(idx, 'sets', e.target.value)}
                          className="h-8 bg-transparent border-transparent rounded-md text-slate-700 text-[11px] text-center font-bold focus:bg-white focus:border-slate-200"
                        />
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <Input
                          value={row.reps}
                          onChange={(e) => updateWorkoutRow(idx, 'reps', e.target.value)}
                          className="h-8 bg-transparent border-transparent rounded-md text-slate-700 text-[11px] text-center font-bold focus:bg-white focus:border-slate-200"
                        />
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <Input
                          value={row.weight}
                          onChange={(e) => updateWorkoutRow(idx, 'weight', e.target.value)}
                          className="h-8 bg-transparent border-transparent rounded-md text-indigo-600 text-[11px] text-center font-bold focus:bg-white focus:border-slate-200"
                        />
                      </TableCell>
                      <TableCell className="px-3 py-2 text-center">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeWorkoutGridRow(idx)}
                          className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {activeTab === 'completion' && (
            <div className="flex-1 overflow-auto scrollbar-none">
              <Table className="min-w-[600px]">
                <TableHeader className="sticky top-0 bg-slate-50/50 backdrop-blur-sm border-b border-slate-100 z-10">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="px-4 py-3 text-left font-bold text-[10px] uppercase tracking-widest text-slate-400 w-40">Day</TableHead>
                    <TableHead className="px-4 py-3 text-left font-bold text-[10px] uppercase tracking-widest text-slate-400 w-40">Date</TableHead>
                    <TableHead className="px-4 py-3 text-left font-bold text-[10px] uppercase tracking-widest text-slate-400">AM Status</TableHead>
                    <TableHead className="px-4 py-3 text-left font-bold text-[10px] uppercase tracking-widest text-slate-400">PM Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-50">
                  {DAYS.map((day) => {
                    const dayData = weekCompletion[day];
                    const dateDisplay = dayData ? formatDateCompact(dayData.date) : '';
                    const dateKey = dayData ? dayData.date : null;
                    
                    return (
                      <TableRow key={day} className="group hover:bg-slate-50/50 transition-colors border-none">
                        <TableCell className="px-4 py-3 font-bold text-slate-700 italic">{day}</TableCell>
                        <TableCell className="px-4 py-3 text-slate-400 font-bold text-[10px] uppercase tracking-tight">{dateDisplay}</TableCell>
                        {['am', 'pm'].map((session) => {
                          const value = dayData?.[session];
                          const status = value === true ? 'done' : value === 'skipped' ? 'skipped' : '';
                          
                          return (
                            <TableCell key={session} className="px-4 py-2">
                              <select
                                value={status}
                                onChange={(e) => setCompletionCell(dateKey, session, e.target.value)}
                                className={cn(
                                  "px-3 py-1.5 rounded-lg text-[10px] font-bold border underline-offset-2 transition-all focus:outline-none",
                                  status === 'done' 
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                    : status === 'skipped'
                                    ? "bg-amber-50 text-amber-700 border-amber-100"
                                    : "bg-transparent text-slate-300 border-transparent hover:border-slate-100"
                                )}
                                disabled={!dateKey}
                              >
                                <option value="">PENDING</option>
                                <option value="done">DONE</option>
                                <option value="skipped">SKIPPED</option>
                              </select>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {activeTab === 'exerciseDb' && (
            <div className="flex-1 overflow-auto scrollbar-none relative">
              <Table className="min-w-[700px]">
                <TableHeader className="sticky top-0 bg-slate-50/50 backdrop-blur-sm border-b border-slate-100 z-10">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="px-4 py-3 text-left font-bold text-[10px] uppercase tracking-widest text-slate-400 w-1/4">Muscle</TableHead>
                    <TableHead className="px-4 py-3 text-left font-bold text-[10px] uppercase tracking-widest text-slate-400 w-1/4">Sub Muscle</TableHead>
                    <TableHead className="px-4 py-3 text-left font-bold text-[10px] uppercase tracking-widest text-slate-400">Exercise</TableHead>
                    <TableHead className="px-4 py-3 text-center font-bold text-[10px] uppercase tracking-widest text-slate-400 w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-50">
                  {paginatedExerciseRows.map(({ row, idx }) => (
                    <TableRow key={`${row.muscle}-${row.subMuscle}-${row.exercise}-${idx}`} className="group hover:bg-slate-50/50 transition-colors border-none">
                      <TableCell className="px-4 py-2">
                        <Input
                          value={row.muscle}
                          onChange={(e) => updateExerciseRow(idx, 'muscle', e.target.value)}
                          className="h-8 bg-transparent border-transparent rounded-lg text-slate-700 text-[11px] font-medium focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                        />
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        <Input
                          value={row.subMuscle}
                          onChange={(e) => updateExerciseRow(idx, 'subMuscle', e.target.value)}
                          className="h-8 bg-transparent border-transparent rounded-lg text-slate-700 text-[11px] font-medium focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                        />
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        <Input
                          value={row.exercise}
                          onChange={(e) => updateExerciseRow(idx, 'exercise', e.target.value)}
                          className="h-8 bg-transparent border-transparent rounded-lg text-slate-700 text-[11px] font-bold focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                        />
                      </TableCell>
                      <TableCell className="px-4 py-2 text-center">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeExerciseRow(idx)}
                          className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={15} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {/* Table Footer */}
          <footer className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {activeTab === 'exerciseDb' ? (
                <>Showing {Math.min(EXERCISES_PER_PAGE, filteredExerciseRows.length)} of {filteredExerciseRows.length} Exercises</>
              ) : activeTab === 'workouts' ? (
                <>Displaying {visibleWorkoutRows.length} training entries</>
              ) : activeTab === 'schedule' ? (
                <>Full 7-day training week</>
              ) : (
                <>Training completion status</>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setExercisePage(p => Math.max(1, p - 1))}
                disabled={activeTab !== 'exerciseDb' || exercisePage === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-600 disabled:opacity-30 transition-all shadow-sm bg-white"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white text-indigo-600 font-bold text-[10px] border border-slate-200 rounded-lg shadow-sm">
                {activeTab === 'exerciseDb' ? (
                  <>
                    <span>{exercisePage}</span>
                    <span className="text-slate-300">/</span>
                    <span>{totalExercisePages}</span>
                  </>
                ) : (
                  <span>1</span>
                )}
              </div>
              <button 
                onClick={() => setExercisePage(p => Math.min(totalExercisePages, p + 1))}
                disabled={activeTab !== 'exerciseDb' || exercisePage === totalExercisePages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-600 disabled:opacity-30 transition-all shadow-sm bg-white"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </footer>

          {/* Action Footer */}
          <div className="flex items-center gap-4 mt-6 px-4 pb-6">
            {activeTab === 'schedule' && (
              <Button
                onClick={() => {
                  saveSessionTitlesWithSync(sessionTitles);
                  flashSaved(setTitlesSaved);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-8 shadow-lg shadow-indigo-100"
              >
                <Save size={16} className="mr-2" />
                Save Session Titles
              </Button>
            )}
            {activeTab === 'workouts' && (
              <Button
                onClick={saveWorkoutGrid}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-8 shadow-lg shadow-indigo-100"
              >
                <Save size={16} className="mr-2" />
                Save Workouts
              </Button>
            )}
            {activeTab === 'exerciseDb' && (
              <Button
                onClick={saveExerciseGrid}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-8 shadow-lg shadow-indigo-100"
              >
                <Save size={16} className="mr-2" />
                Save Changes
              </Button>
            )}
            
            {(titlesSaved || workoutsSaved || exerciseSaved || completionSaved) && (
              <Badge variant="outline" className="text-emerald-500 border-emerald-200 bg-emerald-50/50 animate-pulse font-bold px-3 py-1">
                ✓ SAVED TO CLOUD
              </Badge>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


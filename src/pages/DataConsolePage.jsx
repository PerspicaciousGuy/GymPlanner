import { useEffect, useRef, useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Download,
  Upload,
  Search,
  Filter,
  Settings2,
  Boxes,
  CheckCircle2,
  Database,
  ChevronLeft,
  ChevronRight,
  Save,
  Calendar,
  X
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
  getEffectiveSessionTitle,
} from '../utils/storage';
import { exportPlannerWorkbook } from '../utils/exportWorkbook';
import { importPlannerWorkbook } from '../utils/importWorkbook';
import { loadTrainingPlan } from '../utils/trainingPlan';
import {
  getWeekStart,
  formatDateCompact,
  formatDateKey,
  getDayOfWeek,
  getDateForDayInWeek,
} from '../utils/dateUtils';
import WeekPicker from '../components/WeekPicker';

const TABS = [
  { key: 'workouts', label: 'Workouts' },
  { key: 'completion', label: 'Completion' },
  { key: 'exerciseDb', label: 'Exercise DB' },
];

const consoleButtonClass =
  "flex shrink-0 items-center gap-2 rounded-[var(--app-radius-sm)] border border-[var(--app-border)] bg-[var(--app-surface)] px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground shadow-[var(--app-shadow-sm)] transition-colors hover:bg-[var(--app-surface-muted)] hover:text-foreground md:px-3 md:text-xs";

const consolePrimaryButtonClass =
  "flex shrink-0 items-center gap-2 rounded-[var(--app-radius-sm)] bg-foreground px-2.5 py-1.5 text-[10px] font-semibold text-background shadow-[var(--app-shadow-sm)] transition-colors hover:bg-foreground/90 md:px-3 md:text-xs";

const compactControlClass =
  "rounded-[var(--app-radius-sm)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-2 py-1.5 text-[10px] font-semibold text-foreground outline-none transition-colors focus:border-[var(--app-border-strong)] md:px-3 md:text-xs";

const consoleTableHeaderClass =
  "sticky top-0 z-10 border-b border-[var(--app-border)] bg-[var(--app-surface-muted)]/80 backdrop-blur-sm";

const consoleTableBodyClass = "divide-y divide-[var(--app-border)]";

const consoleRowClass =
  "border-none transition-colors hover:bg-[var(--app-surface-muted)]/70";

const consoleHeadCellClass =
  "px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-normal text-muted-foreground";

const consoleHeadCellWideClass =
  "px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-normal text-muted-foreground";

const consoleInputClass =
  "h-8 rounded-[var(--app-radius-sm)] border-transparent bg-transparent text-[11px] font-medium text-foreground transition-colors focus:border-[var(--app-border)] focus:bg-[var(--app-surface)]";

const consoleStrongInputClass =
  "h-8 rounded-[var(--app-radius-sm)] border-transparent bg-transparent text-[11px] font-semibold text-foreground transition-colors focus:border-[var(--app-border)] focus:bg-[var(--app-surface)]";

const consoleCompactInputClass =
  "h-8 rounded-[var(--app-radius-sm)] border-transparent bg-transparent text-center text-[10px] font-semibold text-foreground transition-colors focus:border-[var(--app-border)] focus:bg-[var(--app-surface)]";

const consoleDeleteButtonClass =
  "p-1.5 text-muted-foreground/45 transition-colors hover:bg-red-500/10 hover:text-red-500";

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
      const sessData = data?.[session] ?? {};
      const groups = sessData.groups ?? [];
      const standalone = sessData.standaloneExercises ?? [];

      // Flatten traditional groups
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

      // Flatten standalone (advanced) exercises
      standalone.forEach((ex, exIdx) => {
        // We represent advanced exercises as a single row in the grid for simplicity, 
        // joining their multiple sets into comma-separated values.
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

  // Ensure at least one group with one row for each date/session
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

export default function DataConsolePage({ hideSidebar }) {
  const [activeTab, setActiveTab] = useState('workouts');
  const [searchQuery, setSearchQuery] = useState('');

  const plan = useMemo(() => loadTrainingPlan(), []);
  const isSplitLayout = plan.sessionLayout === 'split';
  const s1Label = isSplitLayout ? 'AM' : 'S1';
  const s2Label = isSplitLayout ? 'PM' : 'S2';
  const s1FullLabel = isSplitLayout ? 'AM Status' : 'Session 1';
  const s2FullLabel = isSplitLayout ? 'PM Status' : 'Session 2';

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
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef(null);

  const flashSaved = (setter) => {
    setter(true);
    setTimeout(() => setter(false), 1800);
  };

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
        sessionTitles: loadSessionTitles(),
        workoutRows,
        completion: loadCompletion(),
        exerciseRows,
        mode: mode === 'all' ? 'all' : 'current',
        activeTab,
      });
    } catch (error) {
      console.warn('[data-console] Export failed:', error);
    } finally {
      setExporting(false);
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
    } catch (error) {
      console.warn('[data-console] Import failed:', error);
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };


  return (
    <div className={`flex flex-col gap-6 ${!hideSidebar ? 'min-h-screen bg-[var(--app-bg)]' : ''}`}>
      {!hideSidebar && (
        <aside className="fixed bottom-0 left-0 top-0 z-50 flex w-20 flex-col items-center gap-8 border-r border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-8 shadow-[var(--app-shadow-sm)] lg:w-24">

          <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => setActiveTab('workouts')}>
            <div className={`rounded-[var(--app-radius-md)] p-3 transition-colors ${activeTab === 'workouts' ? 'bg-foreground text-background shadow-[var(--app-shadow-sm)]' : 'text-muted-foreground hover:bg-[var(--app-surface-muted)] hover:text-foreground'}`}>
              <Boxes size={24} />
            </div>
            <span className={`text-[10px] font-semibold uppercase tracking-normal ${activeTab === 'workouts' ? 'text-foreground' : 'text-muted-foreground'}`}>Workouts</span>
          </div>

          <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => setActiveTab('completion')}>
            <div className={`rounded-[var(--app-radius-md)] p-3 transition-colors ${activeTab === 'completion' ? 'bg-foreground text-background shadow-[var(--app-shadow-sm)]' : 'text-muted-foreground hover:bg-[var(--app-surface-muted)] hover:text-foreground'}`}>
              <CheckCircle2 size={24} />
            </div>
            <span className={`text-[10px] font-semibold uppercase tracking-normal ${activeTab === 'completion' ? 'text-foreground' : 'text-muted-foreground'}`}>Completion</span>
          </div>

          <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => setActiveTab('exerciseDb')}>
            <div className={`rounded-[var(--app-radius-md)] p-3 transition-colors ${activeTab === 'exerciseDb' ? 'bg-foreground text-background shadow-[var(--app-shadow-sm)]' : 'text-muted-foreground hover:bg-[var(--app-surface-muted)] hover:text-foreground'}`}>
              <Database size={24} />
            </div>
            <span className={`text-[10px] font-semibold uppercase tracking-normal ${activeTab === 'exerciseDb' ? 'text-foreground' : 'text-muted-foreground'}`}>Exercise DB</span>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className={`flex-1 flex flex-col min-w-0 ${!hideSidebar ? 'md:pl-24 py-6 md:py-10 px-4 md:pr-8' : 'px-4 py-6 md:py-10'}`}>


        {/* Page Header */}
        <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center md:mb-6">
          <div className="flex-1">
            <h1 className="text-lg font-semibold tracking-normal text-foreground md:text-xl">Data Console</h1>
            <p className="text-[10px] font-medium text-muted-foreground md:text-xs">Configure workouts, sessions, and database.</p>
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
              className={consoleButtonClass}
              title="Import Data"
            >
              <Upload size={14} />
              <span className="hidden xs:inline">Import</span>
            </button>
            <button
              onClick={() => handleExport('current')}
              disabled={exporting}
              className={consoleButtonClass}
              title="Export Current Tab"
            >
              <Download size={14} />
              <span className="hidden xs:inline">Export</span>
            </button>
            <button
              onClick={() => handleExport('all')}
              disabled={exporting}
              className={consolePrimaryButtonClass}
              title="Export All Data"
            >
              <Database size={14} />
              <span className="hidden xs:inline">Export All</span>
            </button>

            <div className="hidden h-6 w-px bg-[var(--app-border)] xs:block mx-0.5 md:mx-1" />
            <button
              onClick={() => setShowAdvancedCols(!showAdvancedCols)}
              className={consoleButtonClass}
              title="Display Options"
            >
              <Settings2 size={14} />
              <span className="hidden xs:inline">Display</span>
            </button>
          </div>
        </div>


        {/* Tab Navigation */}
        <div className="mb-4 flex items-center gap-2 overflow-x-auto whitespace-nowrap border-b border-[var(--app-border)] px-1 scrollbar-none md:mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative shrink-0 px-3 pb-3 text-[11px] font-semibold uppercase tracking-normal transition-colors md:text-xs ${activeTab === tab.key
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-foreground" />
              )}
            </button>
          ))}
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--app-radius-lg)] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--app-shadow-sm)]">
          {/* Table Toolbar */}
          <div className="flex flex-col justify-between gap-3 border-b border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-3 sm:flex-row sm:items-center md:px-4">
            <div className="flex-1 w-full sm:max-w-xs relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={14} />
              <Input
                placeholder={`Search data...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 rounded-[var(--app-radius-md)] border-[var(--app-border)] bg-[var(--app-surface-muted)] pl-9 text-[11px] font-medium transition-colors focus-visible:border-[var(--app-border-strong)] focus-visible:ring-0 md:text-xs"
              />
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
              {activeTab === 'workouts' && (
                <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                  <div
                    onClick={(e) => e.currentTarget.querySelector('input').showPicker?.()}
                    className="flex cursor-pointer items-center gap-1.5 rounded-[var(--app-radius-sm)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-2 transition-colors hover:border-[var(--app-border-strong)] focus-within:border-[var(--app-border-strong)]"
                  >
                    <Calendar size={12} className="shrink-0 text-muted-foreground" />
                    <input
                      type="date"
                      value={workoutFilterDate}
                      onFocus={(e) => e.target.showPicker?.()}
                      onChange={(e) => setWorkoutFilterDate(e.target.value)}
                      className="h-7 w-24 cursor-pointer bg-transparent py-1.5 text-[10px] font-semibold text-foreground focus:outline-none md:w-28 md:text-xs"
                    />
                    {workoutFilterDate && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setWorkoutFilterDate('');
                        }}
                        className="shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-[var(--app-surface)] hover:text-foreground"
                        title="Clear Date"
                      >
                        <X size={12} strokeWidth={3} />
                      </button>
                    )}
                  </div>
                  <select
                    value={workoutFilterDay}
                    onChange={(e) => setWorkoutFilterDay(e.target.value)}
                    className={`${compactControlClass} flex-1 sm:flex-initial`}
                  >
                    <option value="all">Day</option>
                    {DAYS.map((day) => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                  <select
                    value={workoutFilterSession}
                    onChange={(e) => setWorkoutFilterSession(e.target.value)}
                    className={`${compactControlClass} flex-1 sm:flex-initial`}
                  >
                    <option value="all">Ses</option>
                    <option value="am">{s1Label}</option>
                    <option value="pm">{s2Label}</option>
                  </select>
                  <button
                    onClick={addWorkoutGridRow}
                    className="shrink-0 rounded-[var(--app-radius-sm)] border border-dashed border-[var(--app-border)] p-1.5 text-muted-foreground transition-colors hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface-muted)] hover:text-foreground"
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
                  className="flex items-center gap-1.5 rounded-[var(--app-radius-sm)] border border-dashed border-[var(--app-border)] px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface-muted)] hover:text-foreground"
                >
                  <Plus size={14} />
                  New Exercise
                </button>
              )}
              <button className="flex items-center gap-2 rounded-[var(--app-radius-sm)] border border-[var(--app-border)] px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-[var(--app-surface-muted)] hover:text-foreground">
                <Filter size={14} />
                Filter
              </button>
            </div>
          </div>

          {activeTab === 'workouts' && (
            <div className="flex-1 overflow-auto">
              <Table className="min-w-[1000px]">
                <TableHeader className={consoleTableHeaderClass}>
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className={`${consoleHeadCellClass} w-10`}>#</TableHead>
                    <TableHead className={`${consoleHeadCellClass} w-24`}>Day</TableHead>
                    <TableHead className={`${consoleHeadCellClass} w-32`}>Date</TableHead>
                    <TableHead className={`${consoleHeadCellClass} w-20`}>Session</TableHead>
                    {showAdvancedCols && <TableHead className={`${consoleHeadCellClass} w-16`}>Group</TableHead>}
                    {showAdvancedCols && <TableHead className={`${consoleHeadCellClass} w-16`}>Row</TableHead>}
                    <TableHead className={consoleHeadCellClass}>Muscle</TableHead>
                    <TableHead className={consoleHeadCellClass}>Sub Muscle</TableHead>
                    <TableHead className={`${consoleHeadCellClass} w-80`}>Exercise</TableHead>
                    <TableHead className={`${consoleHeadCellClass} w-16 text-center`}>Sets</TableHead>
                    <TableHead className={`${consoleHeadCellClass} w-16 text-center`}>Reps</TableHead>
                    <TableHead className={`${consoleHeadCellClass} w-20 text-center`}>Weight</TableHead>
                    <TableHead className={`${consoleHeadCellClass} w-12 text-center`}>Del</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className={consoleTableBodyClass}>
                  {visibleWorkoutRows.map(({ row, idx }, visibleIdx) => (
                    <TableRow key={`workout-row-${idx}`} className={consoleRowClass}>
                      <TableCell className="px-3 py-2 text-[10px] font-semibold text-muted-foreground/45">{visibleIdx + 1}</TableCell>
                      <TableCell className="px-3 py-2">
                        <span className="text-[11px] font-semibold italic text-foreground">{row.day}</span>
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
                          className={consoleInputClass}
                        />
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <select
                          value={row.session}
                          onChange={(e) => updateWorkoutRow(idx, 'session', e.target.value)}
                          className="w-full rounded-[var(--app-radius-sm)] border border-transparent bg-transparent px-1 py-1 text-[10px] font-semibold uppercase tracking-normal text-foreground outline-none transition-colors focus:border-[var(--app-border)] focus:bg-[var(--app-surface)]"
                        >
                          <option value="am">{s1Label}</option>
                          <option value="pm">{s2Label}</option>
                        </select>
                      </TableCell>
                      {showAdvancedCols && (
                        <TableCell className="px-3 py-2">
                          <Input
                            value={String(row.groupIndex)}
                            onChange={(e) => updateWorkoutRow(idx, 'groupIndex', e.target.value)}
                            className={consoleCompactInputClass}
                          />
                        </TableCell>
                      )}
                      {showAdvancedCols && (
                        <TableCell className="px-3 py-2">
                          <Input
                            value={String(row.rowIndex)}
                            onChange={(e) => updateWorkoutRow(idx, 'rowIndex', e.target.value)}
                            className={consoleCompactInputClass}
                          />
                        </TableCell>
                      )}
                      <TableCell className="px-3 py-2">
                        <Input
                          value={row.muscle}
                          onChange={(e) => updateWorkoutRow(idx, 'muscle', e.target.value)}
                          className={consoleInputClass}
                        />
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <Input
                          value={row.subMuscle}
                          onChange={(e) => updateWorkoutRow(idx, 'subMuscle', e.target.value)}
                          className={consoleInputClass}
                        />
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <Input
                          value={row.exercise}
                          onChange={(e) => updateWorkoutRow(idx, 'exercise', e.target.value)}
                          className={consoleStrongInputClass}
                        />
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <Input
                          value={row.sets}
                          onChange={(e) => updateWorkoutRow(idx, 'sets', e.target.value)}
                          className={`${consoleStrongInputClass} text-center`}
                        />
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <Input
                          value={row.reps}
                          onChange={(e) => updateWorkoutRow(idx, 'reps', e.target.value)}
                          className={`${consoleStrongInputClass} text-center`}
                        />
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <Input
                          value={row.weight}
                          onChange={(e) => updateWorkoutRow(idx, 'weight', e.target.value)}
                          className={`${consoleStrongInputClass} text-center`}
                        />
                      </TableCell>
                      <TableCell className="px-3 py-2 text-center">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeWorkoutGridRow(idx)}
                          className={consoleDeleteButtonClass}
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
                <TableHeader className={consoleTableHeaderClass}>
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className={`${consoleHeadCellWideClass} w-40`}>Day</TableHead>
                    <TableHead className={`${consoleHeadCellWideClass} w-40`}>Date</TableHead>
                    <TableHead className={consoleHeadCellWideClass}>{s1FullLabel}</TableHead>
                    <TableHead className={consoleHeadCellWideClass}>{s2FullLabel}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className={consoleTableBodyClass}>
                  {DAYS.map((day) => {
                    const dayData = weekCompletion[day];
                    const dateDisplay = dayData ? formatDateCompact(dayData.date) : '';
                    const dateKey = dayData ? dayData.date : null;

                    return (
                      <TableRow key={day} className={consoleRowClass}>
                        <TableCell className="px-4 py-3 font-semibold italic text-foreground">{day}</TableCell>
                        <TableCell className="px-4 py-3 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">{dateDisplay}</TableCell>
                        {['am', 'pm'].map((session) => {
                          const value = dayData?.[session];
                          const status = value === true ? 'done' : value === 'skipped' ? 'skipped' : '';
                          const sessionTitle = getEffectiveSessionTitle(dateKey, session);
                          const isInactive = !sessionTitle || ['off', 'rest', ''].includes(sessionTitle.trim().toLowerCase());

                          if (isInactive && !status) {
                            return (
                              <TableCell key={session} className="px-4 py-2 opacity-35">
                                <span className="ml-4 text-[10px] font-semibold tracking-normal text-muted-foreground">—</span>
                              </TableCell>
                            );
                          }

                          return (
                            <TableCell key={session} className="px-4 py-2">
                              <select
                                value={status}
                                onChange={(e) => setCompletionCell(dateKey, session, e.target.value)}
                                className={cn(
                                  "rounded-[var(--app-radius-sm)] border px-3 py-1.5 text-[10px] font-semibold underline-offset-2 transition-colors focus:outline-none",
                                  status === 'done'
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                    : status === 'skipped'
                                      ? "bg-amber-50 text-amber-700 border-amber-100"
                                      : "border-transparent bg-transparent text-muted-foreground hover:border-[var(--app-border)]"
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
                <TableHeader className={consoleTableHeaderClass}>
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className={`${consoleHeadCellWideClass} w-1/4`}>Muscle</TableHead>
                    <TableHead className={`${consoleHeadCellWideClass} w-1/4`}>Sub Muscle</TableHead>
                    <TableHead className={consoleHeadCellWideClass}>Exercise</TableHead>
                    <TableHead className={`${consoleHeadCellWideClass} w-20 text-center`}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className={consoleTableBodyClass}>
                  {paginatedExerciseRows.map(({ row, idx }) => (
                    <TableRow key={`${row.muscle}-${row.subMuscle}-${row.exercise}-${idx}`} className={consoleRowClass}>
                      <TableCell className="px-4 py-2">
                        <Input
                          value={row.muscle}
                          onChange={(e) => updateExerciseRow(idx, 'muscle', e.target.value)}
                          className={consoleInputClass}
                        />
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        <Input
                          value={row.subMuscle}
                          onChange={(e) => updateExerciseRow(idx, 'subMuscle', e.target.value)}
                          className={consoleInputClass}
                        />
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        <Input
                          value={row.exercise}
                          onChange={(e) => updateExerciseRow(idx, 'exercise', e.target.value)}
                          className={consoleStrongInputClass}
                        />
                      </TableCell>
                      <TableCell className="px-4 py-2 text-center">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeExerciseRow(idx)}
                          className={consoleDeleteButtonClass}
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
          <footer className="flex items-center justify-between border-t border-[var(--app-border)] bg-[var(--app-surface-muted)]/60 px-4 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">
              {activeTab === 'exerciseDb' ? (
                <>Showing {Math.min(EXERCISES_PER_PAGE, filteredExerciseRows.length)} of {filteredExerciseRows.length} Exercises</>
              ) : activeTab === 'workouts' ? (
                <>Displaying {visibleWorkoutRows.length} training entries</>
              ) : (
                <>Training completion status</>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setExercisePage(p => Math.max(1, p - 1))}
                disabled={activeTab !== 'exerciseDb' || exercisePage === 1}
                className="rounded-[var(--app-radius-sm)] border border-[var(--app-border)] bg-[var(--app-surface)] p-1.5 text-muted-foreground shadow-[var(--app-shadow-sm)] transition-colors hover:bg-[var(--app-surface-muted)] hover:text-foreground disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1.5 rounded-[var(--app-radius-sm)] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1 text-[10px] font-semibold text-foreground shadow-[var(--app-shadow-sm)]">
                {activeTab === 'exerciseDb' ? (
                  <>
                    <span>{exercisePage}</span>
                    <span className="text-muted-foreground/40">/</span>
                    <span>{totalExercisePages}</span>
                  </>
                ) : (
                  <span>1</span>
                )}
              </div>
              <button
                onClick={() => setExercisePage(p => Math.min(totalExercisePages, p + 1))}
                disabled={activeTab !== 'exerciseDb' || exercisePage === totalExercisePages}
                className="rounded-[var(--app-radius-sm)] border border-[var(--app-border)] bg-[var(--app-surface)] p-1.5 text-muted-foreground shadow-[var(--app-shadow-sm)] transition-colors hover:bg-[var(--app-surface-muted)] hover:text-foreground disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </footer>

          {/* Action Footer */}
          <div className="mt-6 flex items-center gap-4 px-4 pb-6">
            {activeTab === 'workouts' && (
              <Button
                onClick={saveWorkoutGrid}
                className="rounded-[var(--app-radius-md)] bg-foreground px-8 font-semibold text-background shadow-[var(--app-shadow-sm)] hover:bg-foreground/90"
              >
                <Save size={16} className="mr-2" />
                Save Workouts
              </Button>
            )}
            {activeTab === 'exerciseDb' && (
              <Button
                onClick={saveExerciseGrid}
                className="rounded-[var(--app-radius-md)] bg-foreground px-8 font-semibold text-background shadow-[var(--app-shadow-sm)] hover:bg-foreground/90"
              >
                <Save size={16} className="mr-2" />
                Save Changes
              </Button>
            )}

            {(workoutsSaved || exerciseSaved || completionSaved) && (
              <Badge variant="outline" className="inline-flex items-center gap-1.5 border-emerald-200 bg-emerald-50/70 px-3 py-1 font-semibold text-emerald-700">
                <CheckCircle2 size={12} />
                Saved to cloud
              </Badge>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

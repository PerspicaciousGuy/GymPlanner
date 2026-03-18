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
  MoreHorizontal,
  Sparkles,
  Dumbbell,
  Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
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
  loadTemplates,
  deleteTemplate,
  updateTemplate
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
    <div className={`flex flex-col gap-6 ${!hideSidebar ? 'min-h-screen bg-background' : ''}`}>
      {!hideSidebar && (
        <aside className="fixed left-0 top-0 bottom-0 w-20 lg:w-26 bg-card border-r border-white/5 flex flex-col items-center py-10 gap-12 z-50">
          <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => setActiveTab('schedule')}>
            <div className={`p-4 rounded-[1.5rem] transition-all duration-500 scale-110 ${activeTab === 'schedule' ? 'bg-primary text-primary-foreground shadow-[0_0_30px_rgba(212,255,0,0.3)]' : 'text-slate-700 hover:text-primary hover:bg-white/5 shadow-inner'}`}>
              <LayoutGrid size={24} strokeWidth={3} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${activeTab === 'schedule' ? 'text-primary' : 'text-slate-600'}`}>Clock</span>
          </div>

          <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => setActiveTab('workouts')}>
            <div className={`p-4 rounded-[1.5rem] transition-all duration-500 scale-110 ${activeTab === 'workouts' ? 'bg-primary text-primary-foreground shadow-[0_0_30px_rgba(212,255,0,0.3)]' : 'text-slate-700 hover:text-primary hover:bg-white/5 shadow-inner'}`}>
              <Boxes size={24} strokeWidth={3} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${activeTab === 'workouts' ? 'text-primary' : 'text-slate-600'}`}>Matrix</span>
          </div>

          <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => setActiveTab('completion')}>
            <div className={`p-4 rounded-[1.5rem] transition-all duration-500 scale-110 ${activeTab === 'completion' ? 'bg-primary text-primary-foreground shadow-[0_0_30px_rgba(212,255,0,0.3)]' : 'text-slate-700 hover:text-primary hover:bg-white/5 shadow-inner'}`}>
              <CheckCircle2 size={24} strokeWidth={3} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${activeTab === 'completion' ? 'text-primary' : 'text-slate-600'}`}>Status</span>
          </div>

          <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => setActiveTab('exerciseDb')}>
            <div className={`p-4 rounded-[1.5rem] transition-all duration-500 scale-110 ${activeTab === 'exerciseDb' ? 'bg-primary text-primary-foreground shadow-[0_0_30px_rgba(212,255,0,0.3)]' : 'text-slate-700 hover:text-primary hover:bg-white/5 shadow-inner'}`}>
              <Database size={24} strokeWidth={3} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${activeTab === 'exerciseDb' ? 'text-primary' : 'text-slate-600'}`}>Library</span>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className={`flex-1 flex flex-col min-w-0 ${!hideSidebar ? 'md:pl-24 py-6 md:py-10 px-4 md:pr-8' : 'px-4 py-6 md:py-10'}`}>


        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase italic">Terminal</h1>
            <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em]">Master Data Architecture & Protocol Controls.</p>
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
              className="group flex items-center gap-3 px-4 py-2.5 rounded-[1.25rem] border border-white/5 bg-white/5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all shadow-xl shrink-0"
              title="Import Data"
            >
              <Upload size={16} className="text-slate-600 group-hover:text-primary transition-all duration-300" strokeWidth={3} />
              <span className="hidden xs:inline">Ingest</span>
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
              className="flex items-center gap-3 px-5 py-3 rounded-[1.25rem] bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-[0.2em] hover:bg-primary/90 transition-all shadow-[0_10px_30px_rgba(212,255,0,0.2)] shrink-0 italic"
              title="Export All Data"
            >
              <Database size={16} strokeWidth={3} />
              <span className="hidden xs:inline">Finalize Dump</span>
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
        <div className="flex items-center gap-4 md:gap-8 border-b border-white/5 mb-6 md:mb-8 px-2 overflow-x-auto scrollbar-none whitespace-nowrap">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-4 px-1 text-[11px] md:text-[13px] font-black uppercase tracking-[0.25em] transition-all relative shrink-0 ${
                activeTab === tab.key 
                  ? 'text-primary' 
                  : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <motion.div 
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full shadow-[0_0_15px_#d4ff00]" 
                />
              )}
            </button>
          ))}
        </div>

        <div className="bg-card rounded-3xl border border-white/5 shadow-2xl overflow-hidden flex-1 flex flex-col min-h-0 relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-20 -mr-48 -mt-48 pointer-events-none" />
          {/* Table Toolbar */}
            <div className="px-5 py-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/2 backdrop-blur-md">
              <div className="flex-1 w-full sm:max-w-md relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary transition-colors duration-300" size={16} />
                <Input 
                  placeholder={`IDENTIFY ${activeTab.toUpperCase()} DATA...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 bg-white/5 border-white/5 rounded-2xl text-[11px] focus-visible:ring-primary/10 focus-visible:border-primary/20 transition-all font-black uppercase tracking-widest placeholder:text-slate-700"
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
                    className="p-2 rounded-xl border border-dashed border-primary/30 text-primary hover:bg-primary/10 transition-all shrink-0 hover:scale-110 active:scale-95 shadow-xl bg-primary/5"
                    title="Add Row"
                  >
                    <Plus size={18} strokeWidth={3} />
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
                  className="flex items-center gap-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-primary-foreground transition-all shadow-xl hover:scale-105 active:scale-95 italic"
                >
                  <Plus size={16} strokeWidth={3} />
                  INITIALIZE LOAD
                </button>
              )}
              <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                <Filter size={14} />
                Filter
              </button>
            </div>
          </div>

          {activeTab === 'schedule' && (
            <div className="flex-1 overflow-auto scrollbar-none relative z-10">
              <Table className="min-w-[600px]">
                <TableHeader className="sticky top-0 bg-card/80 backdrop-blur-xl border-b border-white/5 z-10">
                  <TableRow className="hover:bg-transparent border-none h-16">
                    <TableHead className="px-6 py-4 text-left font-black text-[10px] uppercase tracking-[0.4em] text-slate-600 w-48">AXIS / DAY</TableHead>
                    <TableHead className="px-6 py-4 text-left font-black text-[10px] uppercase tracking-[0.4em] text-slate-600">ALPHA SESSION [AM]</TableHead>
                    <TableHead className="px-6 py-4 text-left font-black text-[10px] uppercase tracking-[0.4em] text-slate-600">OMEGA SESSION [PM]</TableHead>
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
                          className="h-10 bg-white/2 border-white/5 rounded-xl text-foreground focus:bg-white/5 focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all font-black uppercase tracking-tight italic"
                          placeholder="ASSIGN PROTOCOL..."
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
            <div className="flex-1 overflow-auto relative z-10">
              <Table className="min-w-[1200px]">
                <TableHeader className="sticky top-0 bg-card/80 backdrop-blur-xl border-b border-white/5 z-10">
                  <TableRow className="hover:bg-transparent border-none h-16">
                    <TableHead className="px-4 py-4 text-left font-black text-[10px] uppercase tracking-[0.3em] text-slate-600 w-12">#</TableHead>
                    <TableHead className="px-4 py-4 text-left font-black text-[10px] uppercase tracking-[0.3em] text-slate-600 w-28">AXIS</TableHead>
                    <TableHead className="px-4 py-4 text-left font-black text-[10px] uppercase tracking-[0.3em] text-slate-600 w-36">TIMESTAMP</TableHead>
                    <TableHead className="px-4 py-4 text-left font-black text-[10px] uppercase tracking-[0.3em] text-slate-600 w-24">PHASE</TableHead>
                    {showAdvancedCols && <TableHead className="px-3 py-4 text-left font-black text-[10px] uppercase tracking-[0.3em] text-slate-600 w-16">GRP</TableHead>}
                    {showAdvancedCols && <TableHead className="px-3 py-4 text-left font-black text-[10px] uppercase tracking-[0.3em] text-slate-600 w-16">ROW</TableHead>}
                    <TableHead className="px-4 py-4 text-left font-black text-[10px] uppercase tracking-[0.3em] text-slate-600 w-48">MUSCLE GROUP</TableHead>
                    <TableHead className="px-4 py-4 text-left font-black text-[10px] uppercase tracking-[0.3em] text-slate-600 w-48">SUB-CALIBRATION</TableHead>
                    <TableHead className="px-4 py-4 text-left font-black text-[10px] uppercase tracking-[0.3em] text-slate-600">EXERCISE / LOAD</TableHead>
                    <TableHead className="px-4 py-4 text-center font-black text-[10px] uppercase tracking-[0.3em] text-slate-600 w-20">SETS</TableHead>
                    <TableHead className="px-4 py-4 text-center font-black text-[10px] uppercase tracking-[0.3em] text-slate-600 w-20">REPS</TableHead>
                    <TableHead className="px-4 py-4 text-center font-black text-[10px] uppercase tracking-[0.3em] text-slate-600 w-24">MASS</TableHead>
                    <TableHead className="px-4 py-4 text-center font-black text-[10px] uppercase tracking-[0.3em] text-slate-600 w-16">X</TableHead>
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
                          className="w-full px-2 py-1.5 bg-white/2 border border-white/5 rounded-xl text-slate-400 text-[10px] font-black uppercase focus:bg-white/5 focus:border-primary/20"
                        >
                          <option value="am" className="bg-card">AM</option>
                          <option value="pm" className="bg-card">PM</option>
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
                          onChange={(e) => updateExerciseRow(idx, 'subMuscle', e.target.value)}
                          className="h-8 bg-transparent border-transparent rounded-md text-slate-700 text-[11px] font-medium focus:bg-white focus:border-slate-200"
                        />
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <Input
                          value={row.exercise}
                          onChange={(e) => updateWorkoutRow(idx, 'exercise', e.target.value)}
                          className="h-9 bg-white/2 border-white/5 rounded-xl text-foreground text-[11px] font-black uppercase focus:bg-white/5 focus:border-primary/20"
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
                          className="h-9 bg-white/2 border-white/5 rounded-xl text-primary text-[11px] text-center font-black italic focus:bg-white/5 focus:border-primary/20"
                        />
                      </TableCell>
                      <TableCell className="px-3 py-2 text-center">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeWorkoutGridRow(idx)}
                          className="p-1.5 text-slate-700 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                        >
                          <Trash2 size={15} strokeWidth={3} />
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
                    <TableHead className="px-6 py-4 text-left font-black text-[10px] uppercase tracking-[0.4em] text-slate-600 w-48">AXIS / DAY</TableHead>
                    <TableHead className="px-6 py-4 text-left font-black text-[10px] uppercase tracking-[0.4em] text-slate-600 w-48">TIMESTAMP</TableHead>
                    <TableHead className="px-6 py-4 text-left font-black text-[10px] uppercase tracking-[0.4em] text-slate-600">ALPHA STATUS</TableHead>
                    <TableHead className="px-6 py-4 text-left font-black text-[10px] uppercase tracking-[0.4em] text-slate-600">OMEGA STATUS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-50">
                  {DAYS.map((day) => {
                    const dayData = weekCompletion[day];
                    const dateDisplay = dayData ? formatDateCompact(dayData.date) : '';
                    const dateKey = dayData ? dayData.date : null;
                    
                    return (
                      <TableRow key={day} className="group hover:bg-white/2 transition-all border-none h-16">
                        <TableCell className="px-6 py-4 font-black text-foreground italic uppercase tracking-tighter">{day}</TableCell>
                        <TableCell className="px-6 py-4 text-slate-600 font-black text-[10px] uppercase tracking-[0.2em]">{dateDisplay}</TableCell>
                        {['am', 'pm'].map((session) => {
                          const value = dayData?.[session];
                          const status = value === true ? 'done' : value === 'skipped' ? 'skipped' : '';
                          
                          return (
                            <TableCell key={session} className="px-6 py-2">
                              <select
                                value={status}
                                onChange={(e) => setCompletionCell(dateKey, session, e.target.value)}
                                className={cn(
                                  "px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all focus:outline-none italic",
                                  status === 'done' 
                                    ? "bg-primary/20 text-primary border-primary/20 shadow-[0_0_20px_rgba(212,255,0,0.2)]" 
                                    : status === 'skipped'
                                    ? "bg-orange-500/20 text-orange-500 border-orange-500/20"
                                    : "bg-white/5 text-slate-700 border-white/5 hover:bg-white/10 hover:text-slate-500"
                                )}
                                disabled={!dateKey}
                              >
                                <option value="" className="bg-card">PENDING</option>
                                <option value="done" className="bg-card">OPTIMIZED</option>
                                <option value="skipped" className="bg-card">BYPASSED</option>
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
            <div className="flex-1 overflow-auto scrollbar-none relative z-10">
              <Table className="min-w-[700px]">
                <TableHeader className="sticky top-0 bg-card/80 backdrop-blur-xl border-b border-white/5 z-10">
                  <TableRow className="hover:bg-transparent border-none h-16">
                    <TableHead className="px-6 py-4 text-left font-black text-[10px] uppercase tracking-[0.4em] text-slate-600 w-1/4">PRIMARY AXIS</TableHead>
                    <TableHead className="px-6 py-4 text-left font-black text-[10px] uppercase tracking-[0.4em] text-slate-600 w-1/4">SUB-CALIBRATION</TableHead>
                    <TableHead className="px-6 py-4 text-left font-black text-[10px] uppercase tracking-[0.4em] text-slate-600">EXERCISE REPOSITORY</TableHead>
                    <TableHead className="px-6 py-4 text-center font-black text-[10px] uppercase tracking-[0.4em] text-slate-600 w-24">OPS</TableHead>
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

          {activeTab === 'templates' && (
            <div className="flex-1 overflow-auto p-4 md:p-8 bg-slate-50/30 animate-in fade-in duration-700">
              <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <Badge variant="outline" className="mb-2 bg-indigo-50/50 text-indigo-600 border-indigo-100 font-black tracking-tighter text-[9px] px-2 py-0.5 rounded-full uppercase">
                      Master Library
                    </Badge>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-none italic">Training Protocols</h2>
                    <p className="text-sm text-slate-400 font-medium tracking-tight mt-1">Curate and manage your high-performance routine repository.</p>
                  </div>
                  <div className="flex items-center gap-2 bg-white/50 p-1.5 rounded-2xl border border-slate-100 shadow-sm backdrop-blur-sm">
                    <div className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Inventory: <span className="text-indigo-600">{templateRows.length}</span>
                    </div>
                  </div>
                </div>

                {templateRows.length === 0 ? (
                  <div className="py-24 text-center bg-white rounded-[3rem] border border-dashed border-slate-200/60 shadow-inner group transition-all hover:bg-slate-50/30">
                    <div className="relative inline-block mb-6">
                      <div className="absolute inset-0 bg-indigo-100 rounded-full blur-3xl opacity-40 animate-pulse" />
                      <div className="relative bg-white w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-200 shadow-2xl border border-slate-50 rotate-6 transition-transform group-hover:rotate-0">
                        <Sparkles size={40} strokeWidth={1.5} />
                      </div>
                    </div>
                    <div className="max-w-xs mx-auto space-y-2">
                      <h3 className="text-lg font-black text-slate-800 tracking-tight">Repository Empty</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                        No protocols found. Initialize one via the workout screen to populate your library.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
                    {templateRows.map((t) => (
                      <div key={t.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 hover:shadow-[0_20px_50px_rgba(79,70,229,0.08)] hover:border-indigo-100 transition-all group relative overflow-hidden active:scale-[0.99]">
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-indigo-50/30 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="absolute top-6 right-6 flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon-sm"
                            onClick={() => setEditingTemplate(t)}
                            className="h-10 w-10 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all shadow-sm hover:shadow-inner"
                          >
                            <Pencil size={18} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon-sm"
                            onClick={() => removeTemplate(t.id)}
                            className="h-10 w-10 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all shadow-sm hover:shadow-inner"
                          >
                            <Trash2 size={18} />
                          </Button>
                        </div>
                        
                        <div className="flex items-start gap-6 relative z-10">
                          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-4 rounded-[1.75rem] shadow-lg shadow-indigo-100 shrink-0 transform group-hover:-rotate-3 transition-transform">
                            <Dumbbell size={24} />
                          </div>
                          <div className="flex-1 pr-10">
                            <h3 className="text-xl font-black text-slate-800 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors uppercase italic">{t.name}</h3>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                Saved on {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'Unknown Date'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-8 space-y-4 relative z-10">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                              Routine Overview
                            </span>
                            <Badge variant="secondary" className="bg-slate-50 text-slate-500 border-none font-black text-[9px] px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm">
                              {t.groups?.length || 0} Sections
                            </Badge>
                          </div>
                          
                          <div className="bg-slate-50/50 rounded-[2rem] p-5 space-y-3 border border-slate-100/50 group-hover:bg-white group-hover:border-indigo-50 transition-all">
                            {(t.groups || []).slice(0, 3).map((group, gIdx) => (
                              <div key={gIdx} className="flex items-center gap-3 group/ex">
                                <div className="w-2 h-2 rounded-full bg-slate-200 group-hover/ex:bg-indigo-400 transition-colors shrink-0 shadow-inner" />
                                <span className="text-xs font-black text-slate-600 truncate tracking-tight">
                                  {group.rows?.[0]?.exercise || 'Unnamed Exercise'}
                                  {(group.rows || []).length > 1 && (
                                    <span className="text-indigo-400 ml-1.5 font-bold text-[10px] bg-indigo-50/50 px-1.5 py-0.5 rounded-md">+{(group.rows || []).length - 1} more</span>
                                  )}
                                </span>
                              </div>
                            ))}
                            {(t.groups || []).length > 3 && (
                              <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-center">
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                                  + {(t.groups || []).length - 3} Additional Sections
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Table Footer */}
          <footer className="px-6 py-4 bg-white/2 border-t border-white/5 flex items-center justify-between backdrop-blur-md">
            <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
              {activeTab === 'exerciseDb' ? (
                <>METRICS: {Math.min(EXERCISES_PER_PAGE, filteredExerciseRows.length)} / {filteredExerciseRows.length} REPOSITORY ENTRIES</>
              ) : activeTab === 'workouts' ? (
                <>METRICS: {visibleWorkoutRows.length} DATA VECTORS IDENTIFIED</>
              ) : activeTab === 'schedule' ? (
                <>METRICS: 168 HOUR TEMPORAL ARCHITECTURE</>
              ) : activeTab === 'templates' ? (
                <>METRICS: {templateRows.length} PROTOCOLS ESTABLISHED</>
              ) : (
                <>METRICS: GLOBAL PERFORMANCE STATUS</>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setExercisePage(p => Math.max(1, p - 1))}
                disabled={activeTab !== 'exerciseDb' || exercisePage === 1}
                className="p-2 rounded-xl border border-white/5 text-slate-700 hover:text-primary hover:bg-primary/5 disabled:opacity-10 transition-all shadow-xl bg-card"
              >
                <ChevronLeft size={18} strokeWidth={3} />
              </button>
              <div className="flex items-center gap-3 px-5 py-2 bg-primary/10 text-primary font-black text-[11px] border border-primary/20 rounded-xl shadow-[0_0_20px_rgba(212,255,0,0.1)] italic">
                {activeTab === 'exerciseDb' ? (
                  <>
                    <span>{exercisePage}</span>
                    <span className="text-primary/30 font-light mx-1">|</span>
                    <span>{totalExercisePages}</span>
                  </>
                ) : (
                  <span>01</span>
                )}
              </div>
              <button 
                onClick={() => setExercisePage(p => Math.min(totalExercisePages, p + 1))}
                disabled={activeTab !== 'exerciseDb' || exercisePage === totalExercisePages}
                className="p-2 rounded-xl border border-white/5 text-slate-700 hover:text-primary hover:bg-primary/5 disabled:opacity-10 transition-all shadow-xl bg-card"
              >
                <ChevronRight size={18} strokeWidth={3} />
              </button>
            </div>
          </footer>

          {/* Action Footer */}
          <div className="flex items-center gap-6 mt-8 px-6 pb-10">
            {activeTab === 'schedule' && (
              <Button
                onClick={() => {
                  saveSessionTitlesWithSync(sessionTitles);
                  flashSaved(setTitlesSaved);
                }}
                className="h-16 bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-3xl px-10 shadow-[0_20px_40px_rgba(212,255,0,0.2)] uppercase text-[11px] tracking-[0.3em] transition-all transform active:scale-95"
              >
                <Save size={18} className="mr-3" strokeWidth={3} />
                COMMIT ARCHITECTURE
              </Button>
            )}
            {activeTab === 'workouts' && (
              <Button
                onClick={saveWorkoutGrid}
                className="h-16 bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-3xl px-10 shadow-[0_20px_40px_rgba(212,255,0,0.2)] uppercase text-[11px] tracking-[0.3em] transition-all transform active:scale-95"
              >
                <Save size={18} className="mr-3" strokeWidth={3} />
                SYNC MATRIX DATA
              </Button>
            )}
            {activeTab === 'exerciseDb' && (
              <Button
                onClick={saveExerciseGrid}
                className="h-16 bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-3xl px-10 shadow-[0_20px_40px_rgba(212,255,0,0.2)] uppercase text-[11px] tracking-[0.3em] transition-all transform active:scale-95"
              >
                <Save size={18} className="mr-3" strokeWidth={3} />
                COMMIT REPOSITORY
              </Button>
            )}
            
            {(titlesSaved || workoutsSaved || exerciseSaved || completionSaved) && (
              <Badge variant="outline" className="text-primary border-primary/20 bg-primary/10 animate-pulse font-black px-5 py-2 rounded-2xl uppercase text-[10px] tracking-[0.2em]">
                ✓ INFRASTRUCTURE RESONATING [SYNCED]
              </Badge>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

import { useEffect, useRef, useState, useMemo } from 'react';
import { exerciseDatabase } from '../data/exerciseDatabase';
import {
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
  formatDateKey,
  getDateForDayInWeek,
} from '../utils/dateUtils';
import { DataConsoleSidebar } from './dataConsole/DataConsoleSidebar';
import { DataConsoleHeader } from './dataConsole/DataConsoleHeader';
import { DataConsoleTabs } from './dataConsole/DataConsoleTabs';
import { DataConsoleToolbar } from './dataConsole/DataConsoleToolbar';
import { WorkoutRowsTable } from './dataConsole/WorkoutRowsTable';
import { CompletionTable } from './dataConsole/CompletionTable';
import { ExerciseDbTable } from './dataConsole/ExerciseDbTable';
import { DataConsoleFooter } from './dataConsole/DataConsoleFooter';
import {
  blankWorkoutGridRow,
  buildDbFromRows,
  buildInitialWorkoutRows,
  buildWorkoutsFromGrid,
  flattenDbRows,
  flattenWorkoutsForGrid,
  normalizeWorkoutDateKey,
} from './dataConsole/dataConsoleUtils';

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
        <DataConsoleSidebar activeTab={activeTab} onSetActiveTab={setActiveTab} />
      )}

      <main className={`flex min-w-0 flex-1 flex-col ${!hideSidebar ? 'px-4 py-6 md:py-10 md:pl-24 md:pr-8' : 'px-4 py-6 md:py-10'}`}>
        <DataConsoleHeader
          exporting={exporting}
          importing={importing}
          importInputRef={importInputRef}
          onExport={handleExport}
          onImportClick={handleImportClick}
          onImportFile={handleImportFile}
          onToggleAdvancedCols={setShowAdvancedCols}
          showAdvancedCols={showAdvancedCols}
        />

        <DataConsoleTabs activeTab={activeTab} onSetActiveTab={setActiveTab} />

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--app-radius-lg)] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--app-shadow-sm)]">
          <DataConsoleToolbar
            activeTab={activeTab}
            onAddExerciseRow={addExerciseRow}
            onAddWorkoutGridRow={addWorkoutGridRow}
            onSetSearchQuery={setSearchQuery}
            onSetSelectedWeek={setSelectedWeek}
            onSetWorkoutFilterDate={setWorkoutFilterDate}
            onSetWorkoutFilterDay={setWorkoutFilterDay}
            onSetWorkoutFilterSession={setWorkoutFilterSession}
            s1Label={s1Label}
            s2Label={s2Label}
            searchQuery={searchQuery}
            selectedWeek={selectedWeek}
            workoutFilterDate={workoutFilterDate}
            workoutFilterDay={workoutFilterDay}
            workoutFilterSession={workoutFilterSession}
          />

          {activeTab === 'workouts' && (
            <WorkoutRowsTable
              onRemoveWorkoutGridRow={removeWorkoutGridRow}
              onUpdateWorkoutRow={updateWorkoutRow}
              s1Label={s1Label}
              s2Label={s2Label}
              showAdvancedCols={showAdvancedCols}
              visibleWorkoutRows={visibleWorkoutRows}
            />
          )}

          {activeTab === 'completion' && (
            <CompletionTable
              getSessionTitle={getEffectiveSessionTitle}
              onSetCompletionCell={setCompletionCell}
              s1FullLabel={s1FullLabel}
              s2FullLabel={s2FullLabel}
              weekCompletion={weekCompletion}
            />
          )}

          {activeTab === 'exerciseDb' && (
            <ExerciseDbTable
              onRemoveExerciseRow={removeExerciseRow}
              onUpdateExerciseRow={updateExerciseRow}
              paginatedExerciseRows={paginatedExerciseRows}
            />
          )}

          <DataConsoleFooter
            activeTab={activeTab}
            completionSaved={completionSaved}
            exercisePage={exercisePage}
            exerciseSaved={exerciseSaved}
            exercisesPerPage={EXERCISES_PER_PAGE}
            filteredExerciseRows={filteredExerciseRows}
            onSaveExerciseGrid={saveExerciseGrid}
            onSaveWorkoutGrid={saveWorkoutGrid}
            onSetExercisePage={setExercisePage}
            totalExercisePages={totalExercisePages}
            visibleWorkoutRows={visibleWorkoutRows}
            workoutsSaved={workoutsSaved}
          />
        </div>
      </main>
    </div>
  );
}

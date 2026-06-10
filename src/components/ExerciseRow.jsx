import { useEffect, useMemo, useState, useCallback, memo } from 'react';
import {
  addExerciseWithSync,
  removeExerciseWithSync,
  findPreviousExerciseEntry,
  getExerciseOccurrenceCount,
  getExercisesForSubMuscle,
  getMuscleGroupKeys,
  getSubMusclesForMuscle,
} from '../utils/storage';
import ExerciseRowCardLayout from './exerciseRow/ExerciseRowCardLayout';
import ExerciseRowTableLayout from './exerciseRow/ExerciseRowTableLayout';

const ExerciseRow = memo(function ExerciseRow({ row, workoutDate, sessionKey, onChange, onDelete, layout = 'row' }) {
  const { muscle, subMuscle, exercise, sets, reps, weight, dropSets, dropWeight } = row;

  const [isAdding, setIsAdding] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [appliedHistoryDate, setAppliedHistoryDate] = useState('');
  const [dbVersion, setDbVersion] = useState(0);

  useEffect(() => {
    const handleDbChange = () => setDbVersion((version) => version + 1);
    window.addEventListener('gymplanner_db_changed', handleDbChange);
    return () => window.removeEventListener('gymplanner_db_changed', handleDbChange);
  }, []);

  const muscleGroupKeys = useMemo(() => getMuscleGroupKeys(), [dbVersion]);
  const subMuscles = useMemo(() => (muscle ? getSubMusclesForMuscle(muscle) : []), [muscle, dbVersion]);
  const allExercises = useMemo(() => (
    muscle && subMuscle ? getExercisesForSubMuscle(muscle, subMuscle) : []
  ), [muscle, subMuscle, dbVersion]);

  const setRow = useCallback((patch) => onChange({ ...row, ...patch }), [row, onChange]);

  const previousEntry = useMemo(
    () => findPreviousExerciseEntry({ exercise, beforeDate: workoutDate, session: sessionKey }),
    [exercise, workoutDate, sessionKey]
  );

  const hasCurrentTrackedValues = [sets, reps, weight, dropSets, dropWeight].some(
    (value) => String(value || '').trim() !== ''
  );

  const occurrenceCount = useMemo(() => {
    if (!exercise || !reps || !weight) return 0;
    return getExerciseOccurrenceCount({ exercise, reps, weight, beforeDate: workoutDate });
  }, [exercise, reps, weight, workoutDate]);

  const applyPreviousValues = (entry) => {
    if (!entry) return;
    setRow({
      sets: entry.row.sets,
      reps: entry.row.reps,
      weight: entry.row.weight,
      dropSets: entry.row.dropSets,
      dropWeight: entry.row.dropWeight,
    });
    setAppliedHistoryDate(entry.date);
  };

  useEffect(() => {
    if (!exercise) {
      setAppliedHistoryDate('');
    }
  }, [exercise]);

  const handleMuscleChange = (value) => setRow({ muscle: value, subMuscle: '', exercise: '' });
  const handleSubMuscleChange = (value) => setRow({ subMuscle: value, exercise: '' });

  const handleExerciseChange = (value) => {
    if (value === '__ADD_NEW__') {
      setIsAdding(true);
      setNewExName('');
      return;
    }

    const entry = findPreviousExerciseEntry({ exercise: value, beforeDate: workoutDate, session: sessionKey });
    const nextPatch = { exercise: value };
    if (entry && !hasCurrentTrackedValues) {
      nextPatch.sets = entry.row.sets;
      nextPatch.reps = entry.row.reps;
      nextPatch.weight = entry.row.weight;
      nextPatch.dropSets = entry.row.dropSets;
      nextPatch.dropWeight = entry.row.dropWeight;
      setAppliedHistoryDate(entry.date);
    } else {
      setAppliedHistoryDate('');
    }
    setRow(nextPatch);
  };

  const handleConfirmNew = () => {
    const name = newExName.trim();
    if (!name) return;
    addExerciseWithSync(muscle, subMuscle, name);
    setRow({ exercise: name });
    setIsAdding(false);
    setNewExName('');
  };

  const handleCancelNew = () => {
    setIsAdding(false);
    setNewExName('');
  };

  const handleDeleteExercise = () => {
    if (!exercise) return;
    setConfirmingDelete(true);
  };

  const handleConfirmDelete = () => {
    removeExerciseWithSync(muscle, subMuscle, exercise);
    setRow({ exercise: '' });
    setConfirmingDelete(false);
  };

  const previousSummary = previousEntry
    ? [
        previousEntry.row.reps && `${previousEntry.row.reps} reps`,
        previousEntry.row.weight && `${previousEntry.row.weight} kg`,
        previousEntry.row.dropSets && `${previousEntry.row.dropSets} drop`,
        previousEntry.row.dropWeight && `${previousEntry.row.dropWeight} drop kg`,
      ].filter(Boolean).join(' - ')
    : '';

  const rendererProps = {
    row,
    muscle,
    subMuscle,
    exercise,
    sets,
    reps,
    weight,
    dropSets,
    dropWeight,
    muscleGroupKeys,
    subMuscles,
    allExercises,
    isAdding,
    newExName,
    setNewExName,
    confirmingDelete,
    appliedHistoryDate,
    previousEntry,
    previousSummary,
    showHistoryRow: previousEntry && previousSummary,
    occurrenceCount,
    sessionKey,
    setRow,
    onChange,
    onDelete,
    handleMuscleChange,
    handleSubMuscleChange,
    handleExerciseChange,
    handleConfirmNew,
    handleCancelNew,
    handleDeleteExercise,
    handleConfirmDelete,
    handleCancelDelete: () => setConfirmingDelete(false),
    applyPreviousValues,
  };

  if (layout === 'card') {
    return <ExerciseRowCardLayout {...rendererProps} />;
  }

  return <ExerciseRowTableLayout {...rendererProps} />;
});

export default ExerciseRow;

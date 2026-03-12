import { useEffect, useMemo, useState } from 'react';
import { formatDateCompact } from '../utils/dateUtils';
import {
  getMuscleGroupKeys,
  getSubMusclesForMuscle,
  getExercisesForSubMuscle,
  addExerciseWithSync,
  removeExerciseWithSync,
  findPreviousExerciseEntry,
} from '../utils/storage';

const selectCls =
  'w-full border border-gray-300 rounded px-2 py-1.5 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-400';

const inputCls =
  'w-full border border-gray-300 rounded px-2 py-1.5 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400';

/**
 * ExerciseRow — one full row of the exercise table.
 * Columns: Muscle Group | Sub Muscle | Exercise | Sets | Reps | Weight
 *
 * Props:
 *   row      – { muscle, subMuscle, exercise, sets, reps, weight }
 *   onChange – (updatedRow) => void
 */
export default function ExerciseRow({ row, workoutDate, sessionKey, onChange, onDelete }) {
  const { muscle, subMuscle, exercise, sets, reps, weight, dropSets, dropWeight } = row;

  const [isAdding, setIsAdding] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [appliedHistoryDate, setAppliedHistoryDate] = useState('');

  const muscleGroupKeys = getMuscleGroupKeys();
  const subMuscles = muscle ? getSubMusclesForMuscle(muscle) : [];
  const allExercises = muscle && subMuscle ? getExercisesForSubMuscle(muscle, subMuscle) : [];

  const set = (patch) => onChange({ ...row, ...patch });

  const previousEntry = useMemo(
    () => findPreviousExerciseEntry({ exercise, beforeDate: workoutDate, session: sessionKey }),
    [exercise, workoutDate, sessionKey]
  );

  const hasCurrentTrackedValues = [sets, reps, weight, dropSets, dropWeight].some(
    (value) => String(value || '').trim() !== ''
  );

  const applyPreviousValues = (entry) => {
    if (!entry) return;
    set({
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

  const handleMuscleChange = (value) =>
    set({ muscle: value, subMuscle: '', exercise: '' });

  const handleSubMuscleChange = (value) =>
    set({ subMuscle: value, exercise: '' });

  const handleExerciseChange = (value) => {
    if (value === '__ADD_NEW__') {
      setIsAdding(true);
      setNewExName('');
    } else {
      const entry = findPreviousExerciseEntry({ exercise: value, beforeDate: workoutDate, session: sessionKey });
      const nextPatch = { exercise: value };
      const canAutoFill = entry && !hasCurrentTrackedValues;
      if (canAutoFill) {
        nextPatch.sets = entry.row.sets;
        nextPatch.reps = entry.row.reps;
        nextPatch.weight = entry.row.weight;
        nextPatch.dropSets = entry.row.dropSets;
        nextPatch.dropWeight = entry.row.dropWeight;
        setAppliedHistoryDate(entry.date);
      } else {
        setAppliedHistoryDate('');
      }
      set(nextPatch);
    }
  };

  const handleConfirmNew = () => {
    const name = newExName.trim();
    if (!name) return;
    addExerciseWithSync(muscle, subMuscle, name);
    set({ exercise: name });
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
    set({ exercise: '' });
    setConfirmingDelete(false);
  };

  const handleCancelDelete = () => setConfirmingDelete(false);

  const previousSummary = previousEntry
    ? [
        previousEntry.row.sets && `${previousEntry.row.sets} sets`,
        previousEntry.row.reps && `${previousEntry.row.reps} reps`,
        previousEntry.row.weight && `${previousEntry.row.weight} kg`,
        previousEntry.row.dropSets && `${previousEntry.row.dropSets} drop`,
        previousEntry.row.dropWeight && `${previousEntry.row.dropWeight} drop kg`,
      ].filter(Boolean).join(' • ')
    : '';

  const showHistoryRow = previousEntry && previousSummary;

  return (
    <>
    <tr className="hover:bg-gray-50 transition-colors align-top">
      {/* Muscle Group */}
      <td className="px-3 py-2 min-w-[140px]">
        <select
          value={muscle}
          onChange={(e) => handleMuscleChange(e.target.value)}
          className={selectCls}
        >
          <option value="">— Select —</option>
          {muscleGroupKeys.map((mg) => (
            <option key={mg} value={mg}>
              {mg}
            </option>
          ))}
        </select>
      </td>

      {/* Sub Muscle */}
      <td className="px-3 py-2 min-w-[140px]">
        <select
          value={subMuscle}
          onChange={(e) => handleSubMuscleChange(e.target.value)}
          className={selectCls}
          disabled={!muscle}
        >
          <option value="">— Select —</option>
          {subMuscles.map((sm) => (
            <option key={sm} value={sm}>
              {sm}
            </option>
          ))}
        </select>
      </td>

      {/* Exercise */}
      <td className="px-3 py-2 min-w-[220px]">
        {isAdding ? (
          <div className="flex gap-1 items-center">
            <input
              type="text"
              autoFocus
              value={newExName}
              onChange={(e) => setNewExName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmNew();
                if (e.key === 'Escape') handleCancelNew();
              }}
              placeholder="New exercise name…"
              className={inputCls + ' flex-1'}
            />
            <button onClick={handleConfirmNew} className="text-green-600 hover:text-green-800 font-bold px-1 text-sm" title="Confirm">✓</button>
            <button onClick={handleCancelNew} className="text-red-400 hover:text-red-600 px-1 text-sm" title="Cancel">✕</button>
          </div>
        ) : confirmingDelete ? (
          <div className="flex flex-col gap-1 rounded border border-red-300 bg-red-50 px-2 py-1.5 text-sm">
            <span className="text-red-700 font-medium leading-snug">Delete <span className="font-semibold">"{exercise}"</span> from database?</span>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmDelete}
                className="flex-1 rounded bg-red-500 hover:bg-red-600 text-white text-xs font-semibold py-1 transition-colors"
              >Delete</button>
              <button
                onClick={handleCancelDelete}
                className="flex-1 rounded border border-gray-300 hover:bg-gray-100 text-gray-600 text-xs font-semibold py-1 transition-colors"
              >Cancel</button>
            </div>
          </div>
        ) : (
          <div className="flex gap-1 items-center">
            <select
              value={exercise}
              onChange={(e) => handleExerciseChange(e.target.value)}
              className={selectCls + ' flex-1'}
              disabled={!subMuscle}
            >
              <option value="">— Select —</option>
              {allExercises.map((ex) => (
                <option key={ex} value={ex}>
                  {ex}
                </option>
              ))}
              {subMuscle && <option value="__ADD_NEW__">＋ Add new exercise…</option>}
            </select>
            {exercise && (
              <button
                onClick={handleDeleteExercise}
                className="text-red-300 hover:text-red-600 px-1 text-base shrink-0 transition-colors"
                title="Delete exercise from database"
              >🗑</button>
            )}
          </div>
        )}
      </td>

      {/* Sets */}
      <td className="px-3 py-2 min-w-[90px]">
        <input
          type="text"
          value={sets}
          onChange={(e) => set({ sets: e.target.value })}
          placeholder="e.g. 4"
          className={inputCls}
        />
      </td>

      {/* Reps */}
      <td className="px-3 py-2 min-w-[90px]">
        <input
          type="text"
          value={reps}
          onChange={(e) => set({ reps: e.target.value })}
          placeholder="e.g. 10"
          className={inputCls}
        />
      </td>

      {/* Weight (kg) */}
      <td className="px-3 py-2 min-w-[120px]">
        <input
          type="text"
          value={weight}
          onChange={(e) => set({ weight: e.target.value })}
          placeholder="kg"
          className={inputCls}
        />
      </td>

      {/* Drop Set */}
      <td className="px-3 py-2 min-w-[100px]">
        <input
          type="text"
          value={dropSets}
          onChange={(e) => set({ dropSets: e.target.value })}
          placeholder="e.g. 2"
          className={inputCls}
        />
      </td>

      {/* Drop Weight (kg) */}
      <td className="px-3 py-2 min-w-[140px]">
        <input
          type="text"
          value={dropWeight}
          onChange={(e) => set({ dropWeight: e.target.value })}
          placeholder="kg"
          className={inputCls}
        />
      </td>

      {/* Delete Row */}
      <td className="px-2 py-2 text-center">
        <button
          onClick={onDelete}
          className="text-gray-300 hover:text-red-500 transition-colors text-xl leading-none"
          title="Remove row"
        >×</button>
      </td>

    </tr>
    {showHistoryRow && (
      <tr className="bg-blue-50/60">
        <td colSpan={9} className="px-3 py-2 text-xs text-blue-800">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>
              {appliedHistoryDate === previousEntry.date ? 'Prefilled from' : 'Last time:'} {formatDateCompact(previousEntry.date)}
              {previousEntry.session ? ` (${previousEntry.session.toUpperCase()})` : ''}
              {' '}• {previousSummary}
            </span>
            {appliedHistoryDate !== previousEntry.date && (
              <button
                onClick={() => applyPreviousValues(previousEntry)}
                className="font-semibold text-blue-700 hover:text-blue-800 underline underline-offset-2"
                type="button"
              >
                Use previous values
              </button>
            )}
          </div>
        </td>
      </tr>
    )}
    </>
  );
}

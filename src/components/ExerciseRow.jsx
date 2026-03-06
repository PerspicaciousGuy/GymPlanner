import { useState } from 'react';
import { getMuscleGroupKeys, getSubMusclesForMuscle, getExercisesForSubMuscle, addExerciseToCache, removeExerciseFromCache } from '../utils/storage';
import { apiSaveExercise, apiDeleteExercise } from '../utils/api';

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
export default function ExerciseRow({ row, onChange, onDelete }) {
  const { muscle, subMuscle, exercise, sets, reps, weight, dropSets, dropWeight } = row;

  const [isAdding, setIsAdding] = useState(false);
  const [newExName, setNewExName] = useState('');

  const muscleGroupKeys = getMuscleGroupKeys();
  const subMuscles = muscle ? getSubMusclesForMuscle(muscle) : [];
  const allExercises = muscle && subMuscle ? getExercisesForSubMuscle(muscle, subMuscle) : [];

  const set = (patch) => onChange({ ...row, ...patch });

  const handleMuscleChange = (value) =>
    set({ muscle: value, subMuscle: '', exercise: '' });

  const handleSubMuscleChange = (value) =>
    set({ subMuscle: value, exercise: '' });

  const handleExerciseChange = (value) => {
    if (value === '__ADD_NEW__') {
      setIsAdding(true);
      setNewExName('');
    } else {
      set({ exercise: value });
    }
  };

  const handleConfirmNew = () => {
    const name = newExName.trim();
    if (!name) return;
    addExerciseToCache(muscle, subMuscle, name);
    apiSaveExercise(muscle, subMuscle, name).catch((err) =>
      console.warn('[api] saveExercise failed:', err)
    );
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
    if (!window.confirm(`Delete "${exercise}" from the exercise database? This cannot be undone.`)) return;
    removeExerciseFromCache(muscle, subMuscle, exercise);
    apiDeleteExercise(muscle, subMuscle, exercise).catch((err) =>
      console.warn('[api] deleteExercise failed:', err)
    );
    set({ exercise: '' });
  };

  return (
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
  );
}

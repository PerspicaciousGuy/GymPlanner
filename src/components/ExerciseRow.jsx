import { useState } from 'react';
import { exerciseDatabase, muscleGroupKeys } from '../data/exerciseDatabase';
import { getCustomExercisesForSubMuscle, saveCustomExercise } from '../utils/storage';
import { apiSaveCustomExercise } from '../utils/api';

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
export default function ExerciseRow({ row, onChange }) {
  const { muscle, subMuscle, exercise, sets, reps, weight, dropSets, dropWeight } = row;

  const [isAdding, setIsAdding] = useState(false);
  const [newExName, setNewExName] = useState('');

  const subMuscles = muscle ? Object.keys(exerciseDatabase[muscle]) : [];
  const dbExercises = muscle && subMuscle ? exerciseDatabase[muscle][subMuscle] : [];
  const customExs = muscle && subMuscle ? getCustomExercisesForSubMuscle(muscle, subMuscle) : [];
  const allExercises = [...dbExercises, ...customExs.filter((e) => !dbExercises.includes(e))];

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
    saveCustomExercise(muscle, subMuscle, name);
    apiSaveCustomExercise(muscle, subMuscle, name).catch((err) =>
      console.warn('[api] saveCustomExercise failed:', err)
    );
    set({ exercise: name });
    setIsAdding(false);
    setNewExName('');
  };

  const handleCancelNew = () => {
    setIsAdding(false);
    setNewExName('');
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
          <select
            value={exercise}
            onChange={(e) => handleExerciseChange(e.target.value)}
            className={selectCls}
            disabled={!subMuscle}
          >
            <option value="">— Select —</option>
            {allExercises.map((ex) => (
              <option key={ex} value={ex}>
                {ex}
              </option>
            ))}
            {subMuscle && <option value="__ADD_NEW__">️ Add new exercise…</option>}
          </select>
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

    </tr>
  );
}

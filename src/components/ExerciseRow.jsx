import { exerciseDatabase, muscleGroupKeys } from '../data/exerciseDatabase';

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

  const subMuscles = muscle ? Object.keys(exerciseDatabase[muscle]) : [];
  const exercises = muscle && subMuscle ? exerciseDatabase[muscle][subMuscle] : [];

  const set = (patch) => onChange({ ...row, ...patch });

  const handleMuscleChange = (value) =>
    set({ muscle: value, subMuscle: '', exercise: '' });

  const handleSubMuscleChange = (value) =>
    set({ subMuscle: value, exercise: '' });

  return (
    <tr className="hover:bg-gray-50 transition-colors align-top">
      {/* Muscle Group */}
      <td className="px-3 py-2">
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
      <td className="px-3 py-2">
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
      <td className="px-3 py-2">
        <select
          value={exercise}
          onChange={(e) => set({ exercise: e.target.value })}
          className={selectCls}
          disabled={!subMuscle}
        >
          <option value="">— Select —</option>
          {exercises.map((ex) => (
            <option key={ex} value={ex}>
              {ex}
            </option>
          ))}
        </select>
      </td>

      {/* Sets */}
      <td className="px-3 py-2">
        <input
          type="number"
          min="1"
          max="99"
          value={sets}
          onChange={(e) => set({ sets: e.target.value })}
          placeholder="e.g. 4"
          className={inputCls}
        />
      </td>

      {/* Reps */}
      <td className="px-3 py-2">
        <input
          type="number"
          min="1"
          max="999"
          value={reps}
          onChange={(e) => set({ reps: e.target.value })}
          placeholder="e.g. 10"
          className={inputCls}
        />
      </td>

      {/* Weight (kg) */}
      <td className="px-3 py-2">
        <input
          type="number"
          min="0"
          step="0.5"
          value={weight}
          onChange={(e) => set({ weight: e.target.value })}
          placeholder="kg"
          className={inputCls}
        />
      </td>

      {/* Drop Set */}
      <td className="px-3 py-2">
        <input
          type="number"
          min="1"
          max="99"
          value={dropSets}
          onChange={(e) => set({ dropSets: e.target.value })}
          placeholder="e.g. 2"
          className={inputCls}
        />
      </td>

      {/* Drop Weight (kg) */}
      <td className="px-3 py-2">
        <input
          type="number"
          min="0"
          step="0.5"
          value={dropWeight}
          onChange={(e) => set({ dropWeight: e.target.value })}
          placeholder="kg"
          className={inputCls}
        />
      </td>

    </tr>
  );
}

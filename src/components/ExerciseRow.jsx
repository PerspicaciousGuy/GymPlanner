const inputCls =
  'w-full border border-gray-300 rounded px-2 py-1.5 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400';

/**
 * ExerciseRow — one row: Exercise (free text) | Sets | Reps | Weight | Drop Set | Drop Weight
 */
export default function ExerciseRow({ row, onChange }) {
  const { exercise, sets, reps, weight, dropSets, dropWeight } = row;

  const set = (patch) => onChange({ ...row, ...patch });

  return (
    <tr className="hover:bg-gray-50 transition-colors align-top">
      {/* Exercise */}
      <td className="px-3 py-2 min-w-[180px]">
        <input
          type="text"
          value={exercise}
          onChange={(e) => set({ exercise: e.target.value })}
          placeholder="e.g. Bench Press"
          className={inputCls}
        />
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

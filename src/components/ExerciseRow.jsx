import { useState } from 'react';
import { getMuscleGroupKeys, getSubMusclesForMuscle, getExercisesForSubMuscle, addExerciseWithSync, removeExerciseWithSync } from '../utils/storage';
import AppleSelect from './AppleSelect';

const inputCls =
  'w-full border border-gray-100 rounded-xl px-4 py-3 bg-gray-50/20 text-[#1C1C1E] text-sm focus:outline-none focus:ring-4 focus:ring-blue-100/30 focus:border-[#007AFF] focus:bg-white transition-all duration-300 font-semibold placeholder-[#AEAEC0]/70';

export default function ExerciseRow({ row, onChange, onDelete }) {
  const { muscle, subMuscle, exercise, sets, reps, weight, dropSets, dropWeight } = row;

  const [isAdding, setIsAdding] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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
    addExerciseWithSync(muscle, subMuscle, name);
    set({ exercise: name });
    setIsAdding(false);
    setNewExName('');
  };

  return (
    <tr className="hover:bg-gray-50/20 transition-all duration-300 align-middle group">
      {/* Muscle Group */}
      <td className="px-2 py-4 min-w-[180px]">
        <AppleSelect
          value={muscle}
          onChange={handleMuscleChange}
          options={muscleGroupKeys}
          placeholder="e.g. Legs"
        />
      </td>

      {/* Sub Muscle */}
      <td className="px-2 py-4 min-w-[180px]">
        <AppleSelect
          value={subMuscle}
          onChange={handleSubMuscleChange}
          options={subMuscles}
          placeholder="e.g. Abs"
          disabled={!muscle}
        />
      </td>

      {/* Exercise */}
      <td className="px-2 py-4 min-w-[340px]">
        {isAdding ? (
          <div className="flex gap-2 items-center animate-apple">
            <input
              type="text"
              autoFocus
              value={newExName}
              onChange={(e) => setNewExName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmNew();
                if (e.key === 'Escape') setIsAdding(false);
              }}
              placeholder="New exercise…"
              className={inputCls + ' flex-1'}
            />
          </div>
        ) : (
          <div className="flex gap-2 items-center">
            <AppleSelect
              value={exercise}
              onChange={handleExerciseChange}
              options={[
                ...allExercises.map(ex => ({ label: ex, value: ex })),
                ...(subMuscle ? [{ label: '＋ Add New Movement', value: '__ADD_NEW__' }] : [])
              ]}
              placeholder="Select Movement"
              disabled={!subMuscle}
              className="flex-1"
            />
          </div>
        )}
      </td>

      {/* Sets */}
      <td className="px-2 py-4 min-w-[120px]">
        <input
          type="text"
          value={sets}
          onChange={(e) => set({ sets: e.target.value })}
          placeholder="e.g. 3"
          className={inputCls}
        />
      </td>

      {/* Reps */}
      <td className="px-2 py-4 min-w-[120px]">
        <input
          type="text"
          value={reps}
          onChange={(e) => set({ reps: e.target.value })}
          placeholder="e.g. 12"
          className={inputCls}
        />
      </td>

      {/* Weight (kg) */}
      <td className="px-2 py-4 min-w-[140px]">
        <input
          type="text"
          value={weight}
          onChange={(e) => set({ weight: e.target.value })}
          placeholder="kg"
          className={inputCls}
        />
      </td>

      {/* Drop Set */}
      <td className="px-2 py-4 min-w-[120px]">
        <input
          type="text"
          value={dropSets}
          onChange={(e) => set({ dropSets: e.target.value })}
          placeholder="Drop"
          className={inputCls}
        />
      </td>

      {/* Drop Weight (kg) */}
      <td className="px-2 py-4 min-w-[140px]">
        <input
          type="text"
          value={dropWeight}
          onChange={(e) => set({ dropWeight: e.target.value })}
          placeholder="kg"
          className={inputCls}
        />
      </td>

      {/* Action: Delete Row */}
      <td className="px-4 py-4 text-right">
        <button
          onClick={onDelete}
          className="p-1.5 text-gray-300 hover:text-[#FF3B30] transition-all opacity-0 group-hover:opacity-100"
          title="Remove"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </td>
    </tr>
  );
}

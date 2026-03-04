import { useState, useEffect } from 'react';
import ExerciseGroup from '../components/ExerciseGroup';
import { loadWorkoutPlan, saveWorkoutPlan, defaultGroupRow } from '../utils/storage';

const GROUP_COUNT = 4;

export default function ExercisePlannerPage() {
  const [plan, setPlan] = useState(() => loadWorkoutPlan(GROUP_COUNT));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (saved) {
      const t = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(t);
    }
  }, [saved]);

  const handleGroupChange = (groupKey, updatedRow) => {
    setPlan((prev) => ({ ...prev, [groupKey]: updatedRow }));
    setSaved(false);
  };

  const handleSave = () => {
    saveWorkoutPlan(plan);
    setSaved(true);
  };

  const groupKeys = Array.from({ length: GROUP_COUNT }, (_, i) => `group${i + 1}`);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Exercise Planner</h1>
      <p className="text-gray-500 mb-6 text-sm">
        Build your workout by selecting exercises and logging sets, reps, weight, and notes for each group.
      </p>

      <div className="flex flex-col gap-6">
        {groupKeys.map((key, index) => (
          <ExerciseGroup
            key={key}
            groupNumber={index + 1}
            row={plan[key] || defaultGroupRow()}
            onChange={(updatedRow) => handleGroupChange(key, updatedRow)}
          />
        ))}
      </div>

      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded transition-colors shadow-sm"
        >
          Save Workout
        </button>
        {saved && (
          <span className="text-green-600 font-medium text-sm">✓ Workout saved!</span>
        )}
      </div>
    </div>
  );
}

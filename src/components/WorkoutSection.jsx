import { useState } from 'react';
import ExerciseGroup from './ExerciseGroup';
import { saveDayWorkout, markDayComplete } from '../utils/storage';

/**
 * WorkoutSection — renders one full day workout (4 groups x 3 rows).
 * Props:
 *   day         – e.g. "Monday"
 *   muscleGroup – e.g. "Chest" (from the schedule)
 *   isMissed    – boolean, shows a red "Missed" badge when true
 *   initialData – { groups: [...] } loaded from storage
 */
export default function WorkoutSection({ day, muscleGroup, isMissed, initialData }) {
  const [dayData, setDayData] = useState(initialData);
  const [saveFlash, setSaveFlash] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleGroupChange = (groupIdx, updatedGroup) => {
    const updatedGroups = dayData.groups.map((g, i) => (i === groupIdx ? updatedGroup : g));
    setDayData({ ...dayData, groups: updatedGroups });
  };

  const handleSave = () => {
    saveDayWorkout(day, dayData);
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 2000);
  };

  const handleComplete = () => {
    saveDayWorkout(day, dayData);
    markDayComplete(day);
    setCompleted(true);
  };

  if (completed) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg px-6 py-4 flex items-center gap-3">
        <span className="text-green-600 text-xl">✓</span>
        <span className="text-green-800 font-semibold">{day} workout marked as complete!</span>
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        {isMissed ? (
          <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
            Missed Workout
          </span>
        ) : (
          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
            Today's Workout
          </span>
        )}
        <h2 className="text-lg font-bold text-gray-800">
          {day}
          {muscleGroup ? (
            <span className="text-gray-400 font-normal ml-2">— {muscleGroup}</span>
          ) : (
            <span className="text-gray-400 font-normal ml-2">— No muscle group scheduled</span>
          )}
        </h2>
      </div>

      {/* Groups */}
      {dayData.groups.map((group, idx) => (
        <ExerciseGroup
          key={idx}
          groupIndex={idx}
          group={group}
          onChange={(updated) => handleGroupChange(idx, updated)}
        />
      ))}

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded transition-colors shadow-sm text-sm"
        >
          Save Workout
        </button>
        <button
          onClick={handleComplete}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded transition-colors shadow-sm text-sm"
        >
          Mark Workout Complete
        </button>
        {saveFlash && (
          <span className="text-green-600 font-medium text-sm">✓ Saved!</span>
        )}
      </div>
    </section>
  );
}

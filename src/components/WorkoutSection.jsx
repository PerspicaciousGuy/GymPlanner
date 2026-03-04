import { useState } from 'react';
import ExerciseGroup from './ExerciseGroup';
import { saveDayWorkoutWithSync, markDayCompleteWithSync, isDayComplete, ensureAmPm } from '../utils/storage';
import { AM_TITLES, PM_TITLES } from '../data/ampmTitles';

export default function WorkoutSection({ day, muscleGroup, isMissed, isTomorrow, initialData, hideBadge }) {
  const [dayData, setDayData] = useState(() => ensureAmPm(initialData));
  const [saveFlash, setSaveFlash] = useState(false);
  const [completed, setCompleted]  = useState(() => isDayComplete(day, 'am') && isDayComplete(day, 'pm'));

  const handleGroupChange = (session, groupIdx, updatedGroup) => {
    setDayData((prev) => {
      const s = { ...prev[session] };
      s.groups = s.groups.map((g, i) => (i === groupIdx ? updatedGroup : g));
      return { ...prev, [session]: s };
    });
  };

  const handleSave = () => {
    saveDayWorkoutWithSync(day, dayData);
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 2000);
  };

  const handleComplete = () => {
    saveDayWorkoutWithSync(day, dayData);
    markDayCompleteWithSync(day, 'am');
    markDayCompleteWithSync(day, 'pm');
    setCompleted(true);
  };

  const badge = isMissed ? (
    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Missed Workout</span>
  ) : isTomorrow ? (
    <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Tomorrow</span>
  ) : (
    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Today</span>
  );

  const amTitle = AM_TITLES[day] || '';
  const pmTitle = PM_TITLES[day] || '';
  // Use AM groups as the single workout log (same data, one set of groups)
  const groups = dayData.am?.groups ?? [];

  return (
    <section className="flex flex-col gap-4">
      {!hideBadge && (
        <div className="flex items-center gap-3 flex-wrap">
          {badge}
          <h2 className="text-lg font-bold text-gray-800">
            {day}
            {muscleGroup ? <span className="text-gray-400 font-normal ml-2">— {muscleGroup}</span> : null}
          </h2>
        </div>
      )}

      {/* AM / PM plain text info */}
      <div className="flex flex-col gap-1">
        <p className="text-sm text-gray-700">
          <span className="font-semibold text-amber-700">🌅 AM</span>
          {amTitle ? <span className="text-gray-500 ml-2">— {amTitle}</span> : null}
        </p>
        <p className="text-sm text-gray-700">
          <span className="font-semibold text-slate-600">🌆 PM</span>
          {pmTitle ? <span className="text-gray-500 ml-2">— {pmTitle}</span> : null}
        </p>
      </div>

      {/* Exercise groups */}
      {groups.map((group, idx) => (
        <ExerciseGroup
          key={idx}
          groupIndex={idx}
          group={group}
          onChange={(updated) => handleGroupChange('am', idx, updated)}
        />
      ))}

      {/* Actions */}
      {completed ? (
        <div className="bg-green-50 border border-green-200 rounded-lg px-5 py-3 flex items-center gap-2">
          <span className="text-green-600">✓</span>
          <span className="text-green-800 font-semibold text-sm">{day} workout marked as complete!</span>
        </div>
      ) : (
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded transition-colors shadow-sm text-sm">
            Save Workout
          </button>
          <button onClick={handleComplete} className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded transition-colors shadow-sm text-sm">
            Mark Complete
          </button>
          {saveFlash && <span className="text-green-600 font-medium text-sm">✓ Saved!</span>}
        </div>
      )}
    </section>
  );
}
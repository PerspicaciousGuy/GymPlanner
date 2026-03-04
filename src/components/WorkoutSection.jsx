import { useState } from 'react';
import ExerciseGroup from './ExerciseGroup';
import { saveDayWorkout, markDayComplete, isDayComplete, ensureAmPm } from '../utils/storage';
import { AM_TITLES, PM_TITLES } from '../data/ampmTitles';

/**
 * WorkoutSection — renders one full day with AM / PM tab sessions.
 * Props:
 *   day         – e.g. "Wednesday"
 *   muscleGroup – from the weekly schedule (shown in header)
 *   isMissed    – boolean, shows red "Missed" badge
 *   isTomorrow  – boolean, shows indigo "Tomorrow" badge
 *   initialData – { am: { groups }, pm: { groups } } from storage
 */
export default function WorkoutSection({ day, muscleGroup, isMissed, isTomorrow, initialData, hideBadge }) {
  const [dayData, setDayData]   = useState(() => ensureAmPm(initialData));
  const [activeTab, setActiveTab] = useState('am');
  const [saveFlash, setSaveFlash] = useState(false);
  const [amDone, setAmDone]     = useState(() => isDayComplete(day, 'am'));
  const [pmDone, setPmDone]     = useState(() => isDayComplete(day, 'pm'));

  // ── Group change within the active session ────────────────────
  const handleGroupChange = (groupIdx, updatedGroup) => {
    setDayData((prev) => {
      const session = { ...prev[activeTab] };
      session.groups = session.groups.map((g, i) => (i === groupIdx ? updatedGroup : g));
      return { ...prev, [activeTab]: session };
    });
  };

  // ── Save active session ───────────────────────────────────────
  const handleSave = () => {
    saveDayWorkout(day, dayData);
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 2000);
  };

  // ── Mark active session complete ──────────────────────────────
  const handleComplete = () => {
    saveDayWorkout(day, dayData);
    markDayComplete(day, activeTab);
    if (activeTab === 'am') setAmDone(true);
    else setPmDone(true);
  };

  // ── Badge ─────────────────────────────────────────────────────
  const badge = isMissed ? (
    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
      Missed Workout
    </span>
  ) : isTomorrow ? (
    <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
      Tomorrow — Plan Ahead
    </span>
  ) : (
    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
      Today's Workout
    </span>
  );

  const amTitle = AM_TITLES[day] || '';
  const pmTitle = PM_TITLES[day] || '';
  const sessionTitle = activeTab === 'am' ? amTitle : pmTitle;
  const sessionGroups = dayData[activeTab]?.groups ?? [];
  const sessionDone   = activeTab === 'am' ? amDone : pmDone;

  return (
    <section className="flex flex-col gap-4">
      {/* ── Day header (hidden when inside accordion) ─────────── */}
      {!hideBadge && (
        <div className="flex items-center gap-3 flex-wrap">
          {badge}
          <h2 className="text-lg font-bold text-gray-800">
            {day}
            {muscleGroup ? (
              <span className="text-gray-400 font-normal ml-2">— {muscleGroup}</span>
            ) : null}
          </h2>
        </div>
      )}

      {/* ── AM / PM tab switcher ──────────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {['am', 'pm'].map((tab) => {
          const done = tab === 'am' ? amDone : pmDone;
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-5 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-white shadow text-gray-800'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'am' ? '🌅' : '🌆'} {tab.toUpperCase()}
              {done && (
                <span className="ml-1 bg-green-100 text-green-700 text-xs font-bold px-1.5 py-0.5 rounded-full">✓</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Session title (locked) ────────────────────────────── */}
      <div className={`rounded-md px-4 py-2 text-sm font-medium border ${
        activeTab === 'am'
          ? 'bg-amber-50 border-amber-200 text-amber-800'
          : 'bg-slate-50 border-slate-200 text-slate-700'
      }`}>
        <span className="font-bold">{day} {activeTab.toUpperCase()}</span>
        {sessionTitle ? <span className="ml-2">– {sessionTitle}</span> : null}
      </div>

      {/* ── Session complete banner ───────────────────────────── */}
      {sessionDone && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-5 py-3 flex items-center gap-3">
          <span className="text-green-600 text-lg">✓</span>
          <span className="text-green-800 font-semibold text-sm">
            {day} {activeTab.toUpperCase()} session marked as complete!
          </span>
        </div>
      )}

      {/* ── Exercise groups ───────────────────────────────────── */}
      {sessionGroups.map((group, idx) => (
        <ExerciseGroup
          key={`${activeTab}-${idx}`}
          groupIndex={idx}
          group={group}
          onChange={(updated) => handleGroupChange(idx, updated)}
        />
      ))}

      {/* ── Actions ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded transition-colors shadow-sm text-sm"
        >
          Save {activeTab.toUpperCase()}
        </button>
        {!sessionDone && (
          <button
            onClick={handleComplete}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded transition-colors shadow-sm text-sm"
          >
            Mark {activeTab.toUpperCase()} Complete
          </button>
        )}
        {saveFlash && (
          <span className="text-green-600 font-medium text-sm">✓ Saved!</span>
        )}
      </div>
    </section>
  );
}

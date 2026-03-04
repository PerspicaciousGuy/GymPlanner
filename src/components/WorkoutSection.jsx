import { useState } from 'react';
import ExerciseGroup from './ExerciseGroup';
import { saveDayWorkout, markDayComplete, isDayComplete, ensureAmPm } from '../utils/storage';
import { AM_TITLES, PM_TITLES } from '../data/ampmTitles';

function SessionBlock({ label, emoji, title, bgCls, borderCls, textCls, groups, done, onGroupChange, onSave, onComplete, saveFlash }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Session title bar */}
      <div className={`rounded-md px-4 py-2.5 border flex items-center gap-2 ${bgCls} ${borderCls}`}>
        <span className="text-base">{emoji}</span>
        <span className={`font-bold text-sm ${textCls}`}>{label}</span>
        {title ? <span className={`text-sm ${textCls} opacity-80`}>– {title}</span> : null}
        {done && (
          <span className="ml-auto bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">✓ Done</span>
        )}
      </div>

      {/* Exercise groups */}
      {groups.map((group, idx) => (
        <ExerciseGroup
          key={idx}
          groupIndex={idx}
          group={group}
          onChange={(updated) => onGroupChange(idx, updated)}
        />
      ))}

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={onSave}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded transition-colors shadow-sm text-sm"
        >
          Save {label}
        </button>
        {!done && (
          <button
            onClick={onComplete}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded transition-colors shadow-sm text-sm"
          >
            Mark {label} Complete
          </button>
        )}
        {saveFlash && <span className="text-green-600 font-medium text-sm">✓ Saved!</span>}
      </div>
    </div>
  );
}

export default function WorkoutSection({ day, muscleGroup, isMissed, isTomorrow, initialData, hideBadge }) {
  const [dayData, setDayData] = useState(() => ensureAmPm(initialData));
  const [amFlash, setAmFlash] = useState(false);
  const [pmFlash, setPmFlash] = useState(false);
  const [amDone, setAmDone]   = useState(() => isDayComplete(day, 'am'));
  const [pmDone, setPmDone]   = useState(() => isDayComplete(day, 'pm'));

  const handleGroupChange = (session, groupIdx, updatedGroup) => {
    setDayData((prev) => {
      const s = { ...prev[session] };
      s.groups = s.groups.map((g, i) => (i === groupIdx ? updatedGroup : g));
      return { ...prev, [session]: s };
    });
  };

  const handleSave = (session) => {
    saveDayWorkout(day, dayData);
    if (session === 'am') { setAmFlash(true); setTimeout(() => setAmFlash(false), 2000); }
    else                  { setPmFlash(true); setTimeout(() => setPmFlash(false), 2000); }
  };

  const handleComplete = (session) => {
    saveDayWorkout(day, dayData);
    markDayComplete(day, session);
    if (session === 'am') setAmDone(true);
    else setPmDone(true);
  };

  const badge = isMissed ? (
    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Missed Workout</span>
  ) : isTomorrow ? (
    <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Tomorrow</span>
  ) : (
    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Today</span>
  );

  return (
    <section className="flex flex-col gap-6">
      {!hideBadge && (
        <div className="flex items-center gap-3 flex-wrap">
          {badge}
          <h2 className="text-lg font-bold text-gray-800">
            {day}
            {muscleGroup ? <span className="text-gray-400 font-normal ml-2">— {muscleGroup}</span> : null}
          </h2>
        </div>
      )}

      {/* AM session */}
      <SessionBlock
        label="AM" emoji="🌅"
        title={AM_TITLES[day] || ''}
        bgCls="bg-amber-50" borderCls="border-amber-200" textCls="text-amber-800"
        groups={dayData.am?.groups ?? []}
        done={amDone}
        onGroupChange={(idx, g) => handleGroupChange('am', idx, g)}
        onSave={() => handleSave('am')}
        onComplete={() => handleComplete('am')}
        saveFlash={amFlash}
      />

      <div className="border-t border-gray-100" />

      {/* PM session */}
      <SessionBlock
        label="PM" emoji="🌆"
        title={PM_TITLES[day] || ''}
        bgCls="bg-slate-50" borderCls="border-slate-200" textCls="text-slate-700"
        groups={dayData.pm?.groups ?? []}
        done={pmDone}
        onGroupChange={(idx, g) => handleGroupChange('pm', idx, g)}
        onSave={() => handleSave('pm')}
        onComplete={() => handleComplete('pm')}
        saveFlash={pmFlash}
      />
    </section>
  );
}

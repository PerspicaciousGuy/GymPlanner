import { useEffect, useState } from 'react';
import ExerciseGroup from './ExerciseGroup';
import { saveDayWorkoutWithSync, markDayCompleteWithSync, markDaySkippedWithSync, isDayComplete, isDaySkipped, ensureAmPm, defaultSession, defaultGroup } from '../utils/storage';
import { AM_TITLES, PM_TITLES } from '../data/ampmTitles';

export default function WorkoutSection({ day, muscleGroup, isMissed, isTomorrow, initialData, hideBadge, syncToken }) {
  const [dayData, setDayData] = useState(() => ensureAmPm(initialData));
  const [activeSession, setActiveSession] = useState('am');
  const [saveFlash, setSaveFlash] = useState(false);
  const [amDone, setAmDone] = useState(() => isDayComplete(day, 'am') && !isDaySkipped(day, 'am'));
  const [pmDone, setPmDone] = useState(() => isDayComplete(day, 'pm') && !isDaySkipped(day, 'pm'));
  const [amSkipped, setAmSkipped] = useState(() => isDaySkipped(day, 'am'));
  const [pmSkipped, setPmSkipped] = useState(() => isDaySkipped(day, 'pm'));

  useEffect(() => {
    setDayData(ensureAmPm(initialData));
  }, [initialData]);

  useEffect(() => {
    const amIsSkipped = isDaySkipped(day, 'am');
    const pmIsSkipped = isDaySkipped(day, 'pm');
    setAmSkipped(amIsSkipped);
    setPmSkipped(pmIsSkipped);
    setAmDone(isDayComplete(day, 'am') && !amIsSkipped);
    setPmDone(isDayComplete(day, 'pm') && !pmIsSkipped);
  }, [day, syncToken]);

  const handleGroupChange = (groupIdx, updatedGroup) => {
    setDayData((prev) => {
      const s = { ...prev[activeSession] };
      s.groups = s.groups.map((g, i) => (i === groupIdx ? updatedGroup : g));
      return { ...prev, [activeSession]: s };
    });
  };

  const handleSave = () => {
    saveDayWorkoutWithSync(day, dayData);
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 2000);
  };

  const handleComplete = () => {
    saveDayWorkoutWithSync(day, dayData);
    markDayCompleteWithSync(day, activeSession);
    setDayData((prev) => ({ ...prev, [activeSession]: defaultSession() }));
    if (activeSession === 'am') {
      setAmDone(true);
      setAmSkipped(false);
    } else {
      setPmDone(true);
      setPmSkipped(false);
    }
  };

  const handleSkip = () => {
    markDaySkippedWithSync(day, activeSession);
    if (activeSession === 'am') {
      setAmDone(false);
      setAmSkipped(true);
      setActiveSession('pm');
    } else {
      setPmDone(false);
      setPmSkipped(true);
    }
  };

  const handleAddGroup = () => {
    setDayData((prev) => ({
      ...prev,
      [activeSession]: {
        ...prev[activeSession],
        groups: [...prev[activeSession].groups, defaultGroup()],
      },
    }));
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
  const sessionDone = activeSession === 'am' ? amDone : pmDone;
  const sessionSkipped = activeSession === 'am' ? amSkipped : pmSkipped;
  const bothDone = (amDone || amSkipped) && (pmDone || pmSkipped);
  const groups = dayData[activeSession]?.groups ?? [];

  const tabCls = (session, done, skipped) => [
    'flex flex-1 min-w-0 flex-wrap items-center gap-1.5 px-3 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer text-left',
    activeSession === session
      ? 'border-blue-500 text-blue-700'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
    (done || skipped) ? 'opacity-70' : '',
  ].join(' ');

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

      {bothDone ? (
        <div className="bg-green-50 border border-green-200 rounded-lg px-5 py-4 flex items-center gap-3">
          <span className="text-green-600 text-lg">✓</span>
          <div>
            <p className="text-green-800 font-semibold text-sm">{day} — workout complete</p>
            <p className="text-green-700 text-xs mt-0.5">
              AM {amDone ? '✓ done' : '⏭ skipped'} &nbsp;·&nbsp; PM {pmDone ? '✓ done' : '⏭ skipped'}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* AM / PM tab switcher */}
          <div className="flex border-b border-gray-200">
            <button className={tabCls('am', amDone, amSkipped)} onClick={() => setActiveSession('am')}>
              🌅 AM
              {amDone && <span className="text-green-500 text-xs">✓</span>}
              {amSkipped && <span className="text-gray-400 text-xs">⏭</span>}
              {amTitle && (
                <span className="basis-full text-gray-400 font-normal text-[11px] leading-4 whitespace-normal break-words sm:basis-auto sm:ml-1 sm:text-sm sm:leading-5">
                  — {amTitle}
                </span>
              )}
            </button>
            <button className={tabCls('pm', pmDone, pmSkipped)} onClick={() => setActiveSession('pm')}>
              🌆 PM
              {pmDone && <span className="text-green-500 text-xs">✓</span>}
              {pmSkipped && <span className="text-gray-400 text-xs">⏭</span>}
              {pmTitle && (
                <span className="basis-full text-gray-400 font-normal text-[11px] leading-4 whitespace-normal break-words sm:basis-auto sm:ml-1 sm:text-sm sm:leading-5">
                  — {pmTitle}
                </span>
              )}
            </button>
          </div>

          {/* Exercise groups for active session */}
          {groups.map((group, idx) => (
            <ExerciseGroup
              key={idx}
              groupIndex={idx}
              group={group}
              onChange={(updated) => handleGroupChange(idx, updated)}
            />
          ))}

          {!sessionDone && !sessionSkipped && (
            <button
              onClick={handleAddGroup}
              className="self-start border border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <span className="text-lg leading-none">+</span> Add Group
            </button>
          )}

          {/* Actions */}
          {sessionDone ? (
            <div className="bg-green-50 border border-green-200 rounded-lg px-5 py-3 flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span className="text-green-800 font-semibold text-sm">
                {day} {activeSession.toUpperCase()} session marked as complete!
              </span>
            </div>
          ) : sessionSkipped ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-5 py-3 flex items-center gap-2">
              <span className="text-gray-400">⏭</span>
              <span className="text-gray-600 font-semibold text-sm">
                {day} {activeSession.toUpperCase()} session skipped
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded transition-colors shadow-sm text-sm">
                Save Workout
              </button>
              <button onClick={handleComplete} className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded transition-colors shadow-sm text-sm">
                Mark {activeSession.toUpperCase()} Complete
              </button>
              <button onClick={handleSkip} className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold px-5 py-2 rounded transition-colors shadow-sm text-sm border border-gray-300">
                Skip Session
              </button>
              {saveFlash && <span className="text-green-600 font-medium text-sm">✓ Saved!</span>}
            </div>
          )}
        </>
      )}
    </section>
  );
}
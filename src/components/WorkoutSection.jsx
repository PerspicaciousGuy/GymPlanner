import { useEffect, useState } from 'react';
import ExerciseGroup from './ExerciseGroup';
import { saveDayWorkoutWithSync, markDayCompleteWithSync, markDaySkippedWithSync, isDayComplete, isDaySkipped, ensureAmPm, defaultSession, defaultGroup, loadSessionTitles, saveSessionTitlesWithSync } from '../utils/storage';

export default function WorkoutSection({ date, dayName, muscleGroup, isMissed, isTomorrow, initialData, hideBadge, syncToken, onWorkoutChanged }) {
  // For backward compatibility: if date is not provided but day is, use day as dayName
  const day = dayName || date;
  
  const [dayData, setDayData] = useState(() => ensureAmPm(initialData));
  const [activeSession, setActiveSession] = useState('am');
  const [saveFlash, setSaveFlash] = useState(false);
  const [titleSaveFlash, setTitleSaveFlash] = useState(false);
  const [amDone, setAmDone] = useState(() => isDayComplete(date || day, 'am') && !isDaySkipped(date || day, 'am'));
  const [pmDone, setPmDone] = useState(() => isDayComplete(date || day, 'pm') && !isDaySkipped(date || day, 'pm'));
  const [amSkipped, setAmSkipped] = useState(() => isDaySkipped(date || day, 'am'));
  const [pmSkipped, setPmSkipped] = useState(() => isDaySkipped(date || day, 'pm'));
  const [sessionTitlesState, setSessionTitlesState] = useState(() => loadSessionTitles());

  useEffect(() => {
    setDayData(ensureAmPm(initialData));
  }, [initialData]);

  useEffect(() => {
    setSessionTitlesState(loadSessionTitles());
  }, [syncToken]);

  useEffect(() => {
    const dateOrDay = date || day;
    const amIsSkipped = isDaySkipped(dateOrDay, 'am');
    const pmIsSkipped = isDaySkipped(dateOrDay, 'pm');
    setAmSkipped(amIsSkipped);
    setPmSkipped(pmIsSkipped);
    setAmDone(isDayComplete(dateOrDay, 'am') && !amIsSkipped);
    setPmDone(isDayComplete(dateOrDay, 'pm') && !pmIsSkipped);
  }, [date, day, syncToken]);

  useEffect(() => {
    const amLocked = amDone || amSkipped;
    const pmLocked = pmDone || pmSkipped;

    if (activeSession === 'am' && amLocked && !pmLocked) {
      setActiveSession('pm');
    }
    if (activeSession === 'pm' && pmLocked && !amLocked) {
      setActiveSession('am');
    }
  }, [activeSession, amDone, amSkipped, pmDone, pmSkipped]);

  const handleGroupChange = (groupIdx, updatedGroup) => {
    setDayData((prev) => {
      const s = { ...prev[activeSession] };
      s.groups = s.groups.map((g, i) => (i === groupIdx ? updatedGroup : g));
      return { ...prev, [activeSession]: s };
    });
  };

  const handleSave = () => {
    saveDayWorkoutWithSync(date || day, dayData);
    onWorkoutChanged?.();
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 2000);
  };

  const handleComplete = () => {
    saveDayWorkoutWithSync(date || day, dayData);
    markDayCompleteWithSync(date || day, activeSession);
    onWorkoutChanged?.();
    setDayData((prev) => ({ ...prev, [activeSession]: defaultSession() }));
    if (activeSession === 'am') {
      setAmDone(true);
      setAmSkipped(false);
      setActiveSession('pm');
    } else {
      setPmDone(true);
      setPmSkipped(false);
    }
  };

  const handleSkip = () => {
    markDaySkippedWithSync(date || day, activeSession);
    onWorkoutChanged?.();
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

  const handleSessionTitleChange = (session, value) => {
    setSessionTitlesState((prev) => ({
      ...prev,
      [session]: {
        ...prev[session],
        [day]: value,
      },
    }));
  };

  const handleSessionTitleSave = () => {
    saveSessionTitlesWithSync(sessionTitlesState);
    onWorkoutChanged?.();
    setTitleSaveFlash(true);
    setTimeout(() => setTitleSaveFlash(false), 1800);
  };

  const handleDeleteGroup = (groupIdx) => {
    setDayData((prev) => {
      const sessionData = { ...prev[activeSession] };
      const nextGroups = sessionData.groups.filter((_, idx) => idx !== groupIdx);
      sessionData.groups = nextGroups.length > 0 ? nextGroups : [defaultGroup()];
      return { ...prev, [activeSession]: sessionData };
    });
  };

  const badge = isMissed ? (
    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Missed Workout</span>
  ) : isTomorrow ? (
    <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Tomorrow</span>
  ) : (
    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Today</span>
  );

  const amTitle = sessionTitlesState.am?.[day] || '';
  const pmTitle = sessionTitlesState.pm?.[day] || '';
  const sessionDone = activeSession === 'am' ? amDone : pmDone;
  const sessionSkipped = activeSession === 'am' ? amSkipped : pmSkipped;
  const bothDone = (amDone || amSkipped) && (pmDone || pmSkipped);
  const groups = dayData[activeSession]?.groups ?? [];

  const tabCls = (session, done, skipped) => [
    'flex shrink-0 items-center gap-1.5 px-4 py-2 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap',
    activeSession === session
      ? 'border-blue-500 text-blue-700'
      : 'border-transparent text-gray-500',
    (done || skipped)
      ? 'opacity-65 cursor-not-allowed'
      : 'cursor-pointer hover:text-gray-700 hover:border-gray-300',
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
          <div className="overflow-x-auto scrollbar-thin">
            <div className="flex min-w-max border-b border-gray-200">
              <button
                className={tabCls('am', amDone, amSkipped)}
                onClick={() => setActiveSession('am')}
                disabled={amDone || amSkipped}
              >
                🌅 AM
                {amDone && <span className="text-green-500 text-xs">✓</span>}
                {amSkipped && <span className="text-gray-400 text-xs">⏭</span>}
                {(amDone || amSkipped) && (
                  <span className="text-gray-400 text-[10px]" title="Locked session">
                    🔒
                  </span>
                )}
                {amTitle && (
                  <span className="text-gray-400 font-normal ml-1 text-xs sm:text-sm">
                    — {amTitle}
                  </span>
                )}
              </button>
              <button
                className={tabCls('pm', pmDone, pmSkipped)}
                onClick={() => setActiveSession('pm')}
                disabled={pmDone || pmSkipped}
              >
                🌆 PM
                {pmDone && <span className="text-green-500 text-xs">✓</span>}
                {pmSkipped && <span className="text-gray-400 text-xs">⏭</span>}
                {(pmDone || pmSkipped) && (
                  <span className="text-gray-400 text-[10px]" title="Locked session">
                    🔒
                  </span>
                )}
                {pmTitle && (
                  <span className="text-gray-400 font-normal ml-1 text-xs sm:text-sm">
                    — {pmTitle}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {activeSession.toUpperCase()} Title
            </span>
            <input
              value={activeSession === 'am' ? amTitle : pmTitle}
              onChange={(e) => handleSessionTitleChange(activeSession, e.target.value)}
              onBlur={handleSessionTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              placeholder={`Enter ${activeSession.toUpperCase()} session title`}
              className="border border-gray-300 rounded px-2.5 py-1.5 bg-white text-gray-700 text-sm min-w-[260px]"
            />
            {titleSaveFlash && <span className="text-green-600 font-medium text-xs">Saved title</span>}
          </div>

          {/* Exercise groups for active session */}
          {groups.map((group, idx) => (
            <ExerciseGroup
              key={idx}
              groupIndex={idx}
              group={group}
              groupCount={groups.length}
              workoutDate={date || day}
              sessionKey={activeSession}
              onChange={(updated) => handleGroupChange(idx, updated)}
              onDeleteGroup={() => handleDeleteGroup(idx)}
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
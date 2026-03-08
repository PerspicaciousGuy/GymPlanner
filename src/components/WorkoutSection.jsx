import { useEffect, useState } from 'react';
import ExerciseGroup from './ExerciseGroup';
import { saveDayWorkoutWithSync, markDayCompleteWithSync, markDaySkippedWithSync, isDayComplete, isDaySkipped, ensureAmPm, defaultSession, defaultGroup, loadSessionTitles } from '../utils/storage';

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
      setActiveSession('pm');
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

  const sessionTitles = loadSessionTitles();
  const amTitle = sessionTitles.am[day] || '';
  const pmTitle = sessionTitles.pm[day] || '';
  const currentTitle = activeSession === 'am' ? amTitle : pmTitle;

  const groups = dayData[activeSession]?.groups ?? [];

  return (
    <section className="flex flex-col gap-10 animate-apple">
      {/* Session Toggle & Controls */}
      <div className="flex items-center justify-between bg-white border border-gray-100 rounded-[24px] p-2 pr-6 shadow-sm">
        <div className="segmented-control">
          <button
            className={`segmented-item ${activeSession === 'am' ? 'segmented-item-active' : 'segmented-item-inactive'}`}
            onClick={() => setActiveSession('am')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1m-16 0H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-11.314l.707.707m11.314 11.314l.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" />
            </svg>
            AM SESSION
          </button>
          <button
            className={`segmented-item ${activeSession === 'pm' ? 'segmented-item-active' : 'segmented-item-inactive'}`}
            onClick={() => setActiveSession('pm')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            PM SESSION
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button className="pill-button pill-button-ghost">
            Skip Session
          </button>
          <button className={`pill-button ${activeSession === 'am' ? (amDone ? 'pill-button-ghost' : 'pill-button-success') : (pmDone ? 'pill-button-ghost' : 'pill-button-success')}`} onClick={handleComplete}>
            {activeSession === 'am' ? (amDone ? 'AM Completed' : 'Mark AM Complete') : (pmDone ? 'PM Completed' : 'Mark PM Complete')}
          </button>
        </div>
      </div>

      {/* Objective Box */}
      <div className="objective-box relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 mb-2 block">Objective</span>
        <h3 className="text-3xl font-black text-[#1C1C1E] tracking-tight uppercase">{currentTitle || (activeSession === 'am' ? 'Daily Activation' : 'Evening Strength')}</h3>
      </div>

      {/* Exercise groups */}
      <div className="flex flex-col gap-10">
        {groups.map((group, idx) => (
          <ExerciseGroup
            key={`${activeSession}-${idx}`}
            groupIndex={idx}
            group={group}
            onChange={(updated) => handleGroupChange(idx, updated)}
          />
        ))}
      </div>

      {/* Add Block Button */}
      {!amDone && !pmDone && (
        <button
          onClick={handleAddGroup}
          className="group flex flex-col items-center justify-center gap-4 py-8 rounded-[32px] border-2 border-dashed border-gray-100 bg-gray-50/10 hover:bg-white hover:border-[#007AFF] hover:shadow-xl hover:shadow-blue-50/50 transition-all duration-500"
        >
          <div className="w-12 h-12 rounded-full bg-gray-50 group-hover:bg-[#007AFF] flex items-center justify-center transition-all duration-500 shadow-inner">
            <span className="text-[#8E8E93] group-hover:text-white text-3xl font-light leading-none">+</span>
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8E8E93] group-hover:text-[#007AFF]">Append Training Block</span>
        </button>
      )}
    </section>
  );
}
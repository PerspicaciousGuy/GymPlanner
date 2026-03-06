import { useMemo, useState, useEffect } from 'react';
import WorkoutSection from '../components/WorkoutSection';
import { loadSessionTitles, loadWorkouts, isDayComplete, ensureAmPm, syncPlannerData } from '../utils/storage';

function getDayName(date) {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getDayName(d);
}

function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return getDayName(d);
}

function AccordionSection({ section, defaultOpen, syncToken }) {
  const [open, setOpen] = useState(defaultOpen);

  const badgeEl = section.isMissed ? (
    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
      Missed
    </span>
  ) : section.isTomorrow ? (
    <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
      Tomorrow
    </span>
  ) : (
    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
      Today
    </span>
  );

  return (
    <div className="border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition-colors gap-3"
      >
        <div className="flex items-center gap-3 flex-wrap">
          {badgeEl}
          <span className="text-base font-bold text-gray-800">
            {section.day}
            {section.muscleGroup ? (
              <span className="text-gray-400 font-normal ml-2 text-sm">— {section.muscleGroup}</span>
            ) : null}
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 py-6 bg-white">
          <WorkoutSection
            day={section.day}
            muscleGroup={section.muscleGroup}
            isMissed={section.isMissed}
            isTomorrow={section.isTomorrow}
            initialData={section.data}
            syncToken={syncToken}
            hideBadge
          />
        </div>
      )}
    </div>
  );
}

export default function WorkoutSchedulerPage({ syncKey = 'local' }) {
  const today     = getDayName(new Date());
  const yesterday = getYesterday();
  const tomorrow  = getTomorrow();

  // 'loading' while sync is in-flight, 'ok' on success, 'offline' on failure
  const [syncState, setSyncState] = useState('loading');

  useEffect(() => {
    syncPlannerData().then((ok) => setSyncState(ok ? 'ok' : 'offline'));
  }, [syncKey]);

  // Re-derive sections each time syncState changes so fresh planner data is shown.
  const sections = useMemo(() => {
    const titles = loadSessionTitles();
    const workouts = loadWorkouts();

    const hasPlannedTraining = (day) => {
      const am = (titles.am?.[day] || '').trim().toLowerCase();
      const pm = (titles.pm?.[day] || '').trim().toLowerCase();
      const isOff = (txt) => txt === '' || txt === 'off' || txt === 'rest' || txt.startsWith('off ');
      return !(isOff(am) && isOff(pm));
    };

    const yesterdayMuscle = '';
    const yesterdayMissed =
      hasPlannedTraining(yesterday) &&
      !isDayComplete(yesterday, 'am') &&
      !isDayComplete(yesterday, 'pm');
    const todayMuscle = '';
    const tomorrowMuscle = '';
    const list = [];
    if (yesterdayMissed) {
      list.push({ day: yesterday, muscleGroup: yesterdayMuscle, isMissed: true,  isTomorrow: false, data: ensureAmPm(workouts[yesterday]) });
    }
    list.push(  { day: today,    muscleGroup: todayMuscle,     isMissed: false, isTomorrow: false, data: ensureAmPm(workouts[today])    });
    list.push(  { day: tomorrow, muscleGroup: tomorrowMuscle,  isMissed: false, isTomorrow: true,  data: ensureAmPm(workouts[tomorrow]) });
    return list;
  }, [syncState, today, yesterday, tomorrow]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-4">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Workout Scheduler</h1>
        <p className="text-gray-500 text-sm">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        {syncState === 'loading' && (
          <p className="text-xs text-blue-500 mt-1 animate-pulse">⟳ Syncing planner data…</p>
        )}
        {syncState === 'offline' && (
          <p className="text-xs text-amber-500 mt-1">⚠ Offline — showing local data</p>
        )}
      </div>

      {sections.map((s) => (
        <AccordionSection
          key={s.day}
          section={s}
          defaultOpen={!s.isTomorrow}
          syncToken={syncState}
        />
      ))}
    </div>
  );
}

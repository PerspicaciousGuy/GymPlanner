import { useMemo, useState, useEffect } from 'react';
import WorkoutSection from '../components/WorkoutSection';
import { loadSessionTitles, loadWorkoutByDate, isDayComplete, ensureAmPm, syncPlannerData } from '../utils/storage';
import { 
  getYesterday, 
  getToday, 
  getTomorrow, 
  getDayOfWeek, 
  formatDateDisplay, 
  getWeekStart,
  getWeekDates,
  isSameDay 
} from '../utils/dateUtils';
import WeekPicker from '../components/WeekPicker';

function AccordionSection({ section, defaultOpen, syncToken, onWorkoutChanged }) {
  const [open, setOpen] = useState(defaultOpen);

  // Only show context badges (TODAY/TOMORROW/MISSED) when viewing current week
  const badgeEl = section.showContextBadge ? (
    section.isMissed ? (
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
    )
  ) : null;

  return (
    <div className="border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 bg-white hover:bg-gray-50 transition-colors gap-2 sm:gap-3"
      >
        <div className="flex items-center gap-3 flex-wrap">
          {badgeEl && badgeEl}
          <div className="flex flex-col items-start">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-sm sm:text-base font-bold text-gray-800">{section.dayName}</span>
              <span className="text-xs text-gray-500">{formatDateDisplay(section.date)}</span>
            </div>
            {section.muscleGroup && (
              <span className="text-gray-400 font-normal text-sm">— {section.muscleGroup}</span>
            )}
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-3 sm:px-5 py-4 sm:py-6 bg-white">
          <WorkoutSection
            date={section.date}
            dayName={section.dayName}
            muscleGroup={section.muscleGroup}
            isMissed={section.isMissed}
            isTomorrow={section.isTomorrow}
            initialData={section.data}
            syncToken={syncToken}
            onWorkoutChanged={onWorkoutChanged}
            hideBadge
          />
        </div>
      )}
    </div>
  );
}

export default function WorkoutSchedulerPage({ syncKey = 'local' }) {
  const [selectedWeek, setSelectedWeek] = useState(() => getWeekStart(new Date()));
  const [plannerRefreshNonce, setPlannerRefreshNonce] = useState(0);
  
  const today = getToday();
  const yesterday = getYesterday();
  const tomorrow = getTomorrow();

  // 'loading' while sync is in-flight, 'ok' on success, 'offline' on failure
  const [syncState, setSyncState] = useState('loading');

  useEffect(() => {
    syncPlannerData().then((ok) => setSyncState(ok ? 'ok' : 'offline'));
  }, [syncKey]);

  // Re-derive sections each time syncState or selectedWeek changes
  const sections = useMemo(() => {
    const titles = loadSessionTitles();

    const hasPlannedTraining = (dayName) => {
      const am = (titles.am?.[dayName] || '').trim().toLowerCase();
      const pm = (titles.pm?.[dayName] || '').trim().toLowerCase();
      const isOff = (txt) => txt === '' || txt === 'off' || txt === 'rest' || txt.startsWith('off ');
      return !(isOff(am) && isOff(pm));
    };

    const currentWeekStart = getWeekStart(new Date());
    const isCurrentWeek = currentWeekStart.getTime() === selectedWeek.getTime();

    // If current week, show today/yesterday/tomorrow context
    // If different week, show all 7 days of that week
    if (isCurrentWeek) {
      const yesterdayName = getDayOfWeek(yesterday);
      const todayName = getDayOfWeek(today);
      const tomorrowName = getDayOfWeek(tomorrow);

      const yesterdayMuscle = '';
      const yesterdayMissed =
        hasPlannedTraining(yesterdayName) &&
        !isDayComplete(yesterday, 'am') &&
        !isDayComplete(yesterday, 'pm');
      const todayMuscle = '';
      const tomorrowMuscle = '';
      
      const list = [];
      if (yesterdayMissed) {
        list.push({ 
          date: yesterday, 
          dayName: yesterdayName, 
          muscleGroup: yesterdayMuscle, 
          isMissed: true,  
          isTomorrow: false,
          showContextBadge: true,
          defaultOpen: true,
          data: loadWorkoutByDate(yesterday)
        });
      }
      list.push({ 
        date: today, 
        dayName: todayName, 
        muscleGroup: todayMuscle, 
        isMissed: false, 
        isTomorrow: false,
        showContextBadge: true,
        defaultOpen: true,
        data: loadWorkoutByDate(today)
      });
      list.push({ 
        date: tomorrow, 
        dayName: tomorrowName, 
        muscleGroup: tomorrowMuscle, 
        isMissed: false, 
        isTomorrow: true,
        showContextBadge: true,
        defaultOpen: false,
        data: loadWorkoutByDate(tomorrow)
      });
      return list;
    } else {
      // Show all 7 days of the selected week
      const weekDates = getWeekDates(selectedWeek);
      return weekDates.map((date) => {
        const dayName = getDayOfWeek(date);
        return {
          date,
          dayName,
          muscleGroup: '',
          isMissed: false,
          isTomorrow: false,
          showContextBadge: false,
          defaultOpen: false,
          data: loadWorkoutByDate(date)
        };
      });
    }
  }, [syncState, selectedWeek, today, yesterday, tomorrow, plannerRefreshNonce]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-4">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Workout Scheduler</h1>
        <p className="text-gray-500 text-sm">
          {formatDateDisplay(new Date())}
        </p>
        {syncState === 'loading' && (
          <p className="text-xs text-blue-500 mt-1 animate-pulse">⟳ Syncing planner data…</p>
        )}
        {syncState === 'offline' && (
          <p className="text-xs text-amber-500 mt-1">⚠ Offline — showing local data</p>
        )}
      </div>

      <WeekPicker 
        currentWeekStart={selectedWeek} 
        onWeekChange={setSelectedWeek} 
      />

      {sections.map((s) => (
        <AccordionSection
          key={s.date.getTime()}
          section={s}
          defaultOpen={s.defaultOpen}
          syncToken={syncState}
          onWorkoutChanged={() => setPlannerRefreshNonce((value) => value + 1)}
        />
      ))}
    </div>
  );
}

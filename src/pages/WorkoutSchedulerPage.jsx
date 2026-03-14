import { useMemo, useState, useEffect } from 'react';
import { ChevronDown, Calendar, AlertCircle, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
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

  const badgeEl = section.showContextBadge ? (
    section.isMissed ? (
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100 animate-pulse">
        <AlertCircle size={10} strokeWidth={3} />
        <span className="text-[10px] font-bold uppercase tracking-wider">Missed</span>
      </div>
    ) : section.isTomorrow ? (
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
        <Clock size={10} strokeWidth={3} />
        <span className="text-[10px] font-bold uppercase tracking-wider">Upcoming</span>
      </div>
    ) : (
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm shadow-indigo-100">
        <CheckCircle2 size={10} strokeWidth={3} />
        <span className="text-[10px] font-bold uppercase tracking-wider">Today</span>
      </div>
    )
  ) : null;

  return (
    <div className={`overflow-hidden transition-all duration-300 ${open ? 'mb-3 md:mb-4 shadow-xl shadow-slate-200/50' : 'mb-2'}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-3 md:px-4 py-2.5 md:py-3 bg-white border border-slate-200 hover:border-indigo-200 transition-all group ${open ? 'rounded-t-2xl border-b-transparent' : 'rounded-2xl shadow-sm hover:shadow-md'}`}
      >
        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex flex-col items-start min-w-[80px] md:min-w-[100px]">
            <span className={`text-[10px] md:text-xs font-bold uppercase tracking-widest ${open ? 'text-indigo-600' : 'text-slate-400'}`}>
              {section.dayName}
            </span>
            <span className="text-[9px] md:text-[10px] font-bold text-slate-400">{formatDateDisplay(section.date)}</span>
          </div>
          
          <div className="w-px h-6 md:h-8 bg-slate-100 mx-0.5 md:mx-1 hidden xs:block" />
          
          <div className="scale-90 md:scale-100 origin-left">
            {badgeEl}
          </div>

          {section.muscleGroup && (
            <span className="text-slate-400 font-bold text-[10px] md:text-[11px] hidden sm:block truncate max-w-[150px]">
              — {section.muscleGroup}
            </span>
          )}
        </div>
        
        <div className={`p-1.5 rounded-lg bg-slate-50 text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all ${open ? 'rotate-180' : ''}`}>
          <ChevronDown size={14} strokeWidth={3} />
        </div>
      </button>

      {open && (
        <div className="bg-white border-x border-b border-slate-200 rounded-b-2xl px-3 md:px-4 py-4 md:py-5 animate-in slide-in-from-top-2 duration-300">

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

  const [syncState, setSyncState] = useState('loading');

  useEffect(() => {
    syncPlannerData().then((ok) => setSyncState(ok ? 'ok' : 'offline'));
  }, [syncKey]);

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

    if (isCurrentWeek) {
      const yesterdayName = getDayOfWeek(yesterday);
      const todayName = getDayOfWeek(today);
      const tomorrowName = getDayOfWeek(tomorrow);

      const yesterdayMissed =
        hasPlannedTraining(yesterdayName) &&
        !isDayComplete(yesterday, 'am') &&
        !isDayComplete(yesterday, 'pm');
      
      const list = [];
      if (yesterdayMissed) {
        list.push({ 
          date: yesterday, 
          dayName: yesterdayName, 
          muscleGroup: '', 
          isMissed: true,  
          showContextBadge: true,
          defaultOpen: true,
          data: loadWorkoutByDate(yesterday)
        });
      }
      list.push({ 
        date: today, 
        dayName: todayName, 
        muscleGroup: '', 
        isMissed: false, 
        showContextBadge: true,
        defaultOpen: true,
        data: loadWorkoutByDate(today)
      });
      list.push({ 
        date: tomorrow, 
        dayName: tomorrowName, 
        muscleGroup: '', 
        isMissed: false, 
        isTomorrow: true,
        showContextBadge: true,
        defaultOpen: false,
        data: loadWorkoutByDate(tomorrow)
      });
      return list;
    } else {
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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-none mb-1">Training Hub</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Today is {formatDateDisplay(new Date())}
            </span>
            {syncState === 'loading' && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 animate-pulse">
                <RefreshCw size={10} className="animate-spin" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Syncing</span>
              </div>
            )}
            {syncState === 'offline' && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                <AlertCircle size={10} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Offline Mode</span>
              </div>
            )}
          </div>
        </div>

        <WeekPicker 
          currentWeekStart={selectedWeek} 
          onWeekChange={setSelectedWeek} 
          compact
        />
      </div>

      <div className="flex flex-col">
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
    </div>
  );
}


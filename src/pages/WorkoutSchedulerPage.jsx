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
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from "@/components/ui/badge";

function AccordionSection({ section, defaultOpen, syncToken, onWorkoutChanged }) {
  const [open, setOpen] = useState(defaultOpen && !section.isFullyComplete);

  // Sync open state with defaultOpen prop (e.g. when navigating from history)
  useEffect(() => {
    // Only force open if defaultOpen is true AND the day isn't already complete
    if (defaultOpen && !section.isFullyComplete) {
      setOpen(true);
    }
  }, [defaultOpen, section.isFullyComplete]);

  // Auto-collapse when day becomes fully complete
  useEffect(() => {
    if (section.isFullyComplete && open) {
      setOpen(false);
    }
  }, [section.isFullyComplete]);

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
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(212,255,0,0.1)] transition-all">
        <CheckCircle2 size={12} strokeWidth={3} />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Active Today</span>
      </div>
    )
  ) : null;

  return (
    <div className={`overflow-hidden transition-all duration-300 ${open ? 'mb-3 md:mb-4 shadow-xl shadow-slate-200/50' : 'mb-2'}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-5 md:px-6 py-4 md:py-5 bg-card border border-white/5 hover:border-primary/30 transition-all group ${open ? 'rounded-t-[2.5rem] border-b-transparent shadow-2xl relative z-10' : 'rounded-[2rem] shadow-sm hover:shadow-xl hover:bg-white/5 active:scale-[0.995]'}`}
      >
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex flex-col items-start min-w-[90px] md:min-w-[110px]">
            <span className={`text-[11px] md:text-xs font-black uppercase tracking-[0.25em] transition-colors ${open ? 'text-primary' : 'text-slate-500'}`}>
              {section.dayName}
            </span>
            <span className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-widest">{formatDateDisplay(section.date)}</span>
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
        
        <motion.div 
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="p-2 rounded-xl bg-white/5 text-slate-500 group-hover:text-primary group-hover:bg-primary/10 transition-all border border-transparent group-hover:border-primary/20"
        >
          <ChevronDown size={14} strokeWidth={3} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="bg-card/50 border-x border-b border-white/5 rounded-b-[2.5rem] overflow-hidden"
          >
            <div className="px-5 md:px-8 py-6 md:py-8">
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function WorkoutSchedulerPage({ syncKey = 'local', targetDate = null }) {
  const [selectedWeek, setSelectedWeek] = useState(() => getWeekStart(targetDate || new Date()));
  const [plannerRefreshNonce, setPlannerRefreshNonce] = useState(0);

  // Update selected week and expand when targetDate changes (e.g. from History)
  useEffect(() => {
    if (targetDate) {
      setSelectedWeek(getWeekStart(targetDate));
    } else {
      setSelectedWeek(getWeekStart(new Date()));
    }
  }, [targetDate]);
  
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

    // Only show focused view (Yesterday/Today/Tomorrow) if it's the current week AND no specific date was targeted
    if (isCurrentWeek && !targetDate) {
      const yesterdayName = getDayOfWeek(yesterday);
      const todayName = getDayOfWeek(today);
      const tomorrowName = getDayOfWeek(tomorrow);

      const yesterdayMissed =
        hasPlannedTraining(yesterdayName) &&
        !isDayComplete(yesterday, 'am') &&
        !isDayComplete(yesterday, 'pm');
      
      const list = [];
      if (yesterdayMissed) {
        const yesterdayComplete = isDayComplete(yesterday, 'am') && isDayComplete(yesterday, 'pm');
        list.push({ 
          date: yesterday, 
          dayName: yesterdayName, 
          muscleGroup: '', 
          isMissed: true,  
          showContextBadge: true,
          defaultOpen: targetDate ? isSameDay(yesterday, targetDate) : true,
          isFullyComplete: yesterdayComplete,
          data: loadWorkoutByDate(yesterday)
        });
      }
      
      const todayComplete = isDayComplete(today, 'am') && isDayComplete(today, 'pm');
      list.push({ 
        date: today, 
        dayName: todayName, 
        muscleGroup: '', 
        isMissed: false, 
        showContextBadge: true,
        defaultOpen: targetDate ? isSameDay(today, targetDate) : true,
        isFullyComplete: todayComplete,
        data: loadWorkoutByDate(today)
      });

      const tomorrowComplete = isDayComplete(tomorrow, 'am') && isDayComplete(tomorrow, 'pm');
      list.push({ 
        date: tomorrow, 
        dayName: tomorrowName, 
        muscleGroup: '', 
        isMissed: false, 
        isTomorrow: true,
        showContextBadge: true,
        defaultOpen: targetDate ? isSameDay(tomorrow, targetDate) : false,
        isFullyComplete: tomorrowComplete,
        data: loadWorkoutByDate(tomorrow)
      });
      return list;
    } else {
      const weekDates = getWeekDates(selectedWeek);
      const list = weekDates.map((date) => {
        const dayName = getDayOfWeek(date);
        const isFullyComplete = isDayComplete(date, 'am') && isDayComplete(date, 'pm');
        return {
          date,
          dayName,
          muscleGroup: '',
          isMissed: false,
          isTomorrow: false,
          showContextBadge: false,
          defaultOpen: targetDate ? isSameDay(date, targetDate) : false,
          isFullyComplete,
          data: loadWorkoutByDate(date)
        };
      });

      // If a specific date was targeted, only show THAT date
      if (targetDate) {
        return list.filter(s => isSameDay(s.date, targetDate));
      }

      return list;
    }
  }, [syncState, selectedWeek, today, yesterday, tomorrow, plannerRefreshNonce]);

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 md:px-0">
        <div className="space-y-2">
           <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-black tracking-[0.3em] uppercase text-[9px] px-3 py-1 animate-pulse">
            Protocol Active
           </Badge>
           <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight leading-none italic uppercase">Training Hub</h1>
           <div className="flex items-center gap-3">
             <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
               System Date: <span className="text-slate-300">{formatDateDisplay(new Date())}</span>
             </span>
             {syncState === 'loading' && (
               <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-primary/10 text-primary">
                 <RefreshCw size={10} className="animate-spin" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Syncing</span>
               </div>
             )}
             {syncState === 'offline' && (
               <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-accent/10 text-accent border border-accent/20">
                 <AlertCircle size={10} />
                 <span className="text-[10px] font-black uppercase tracking-widest">Local Node</span>
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


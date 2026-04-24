import { useMemo, useState, useEffect } from 'react';
import { ChevronDown, Calendar, AlertCircle, CheckCircle2, Clock, RefreshCw, Repeat, BedDouble } from 'lucide-react';
import WorkoutSection from '../components/WorkoutSection';
import { 
  loadWorkoutByDate, 
  isSessionFinished, 
  syncPlannerData,
  getEffectiveSessionTitle,
  getDailyMetadata
} from '../utils/storage';
import { 
  getYesterday, 
  getToday, 
  getTomorrow, 
  getDayOfWeek, 
  formatDateDisplay,
  formatDateCompact,
  getWeekStart,
  getWeekDates,
  isSameDay 
} from '../utils/dateUtils';
import WeekPicker from '../components/WeekPicker';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { loadTrainingPlan, getCycleSlotForDate } from '../utils/trainingPlan';
import QuickHealthWidgets from '../components/health/QuickHealthWidgets';

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
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm shadow-indigo-100">
        <CheckCircle2 size={10} strokeWidth={3} />
        <span className="text-[10px] font-bold uppercase tracking-wider">Today</span>
      </div>
    )
  ) : null;

  const shiftedBadge = (section.isShifted || section.isShiftedFrom) ? (
    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
      <RefreshCw size={10} strokeWidth={3} className="animate-spin-slow" />
      <span className="text-[10px] font-bold uppercase tracking-wider">
        {section.isShiftedFrom 
          ? (section.shiftedToLabel ? `To ${section.shiftedToLabel}` : 'Shifted Out') 
          : (section.shiftedFromLabel ? `From ${section.shiftedFromLabel}` : 'Shifted In')
        }
      </span>
    </div>
  ) : null;

  return (
    <div className={cn(
      "overflow-hidden transition-all duration-500 rounded-[2rem] group/card",
      open 
        ? "mb-6 md:mb-8 shadow-[0_15px_45px_-12px_rgba(0,0,0,0.08)] bg-white border border-slate-100" 
        : "mb-3 md:mb-4 border border-slate-100/50 bg-white/50 hover:bg-white hover:border-slate-200 shadow-sm"
    )}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center justify-between px-4 md:px-6 py-4 md:py-5 bg-transparent transition-all",
          open && "border-b border-slate-50/80"
        )}
      >
        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex flex-col items-start min-w-[80px] md:min-w-[100px]">
            <span className={`text-[10px] md:text-xs font-bold uppercase tracking-widest ${open ? 'text-indigo-600' : 'text-slate-400'}`}>
              {section.dayName}
            </span>
            <span className="text-[9px] md:text-[10px] font-bold text-slate-400">{formatDateDisplay(section.date)}</span>
          </div>
          
          <div className="w-px h-6 md:h-8 bg-slate-100 mx-0.5 md:mx-1 hidden xs:block" />
          
          <div className="scale-90 md:scale-100 origin-left flex items-center gap-2">
            {badgeEl}
            {shiftedBadge}
            {section.cycleInfo && (
              <div className={cn(
                "flex items-center gap-1.5 px-2 py-0.5 rounded-full border",
                section.cycleInfo.slot?.type === 'rest'
                  ? "bg-slate-50 text-slate-400 border-slate-200"
                  : "bg-violet-50 text-violet-600 border-violet-100"
              )}>
                <Repeat size={10} strokeWidth={3} />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Day {section.cycleInfo.position + 1}/{section.cycleInfo.cycleLength}
                </span>
              </div>
            )}
          </div>

          {section.muscleGroup && (
            <span className="text-slate-400 font-bold text-[10px] md:text-[11px] hidden sm:block truncate max-w-[150px]">
              — {section.muscleGroup}
            </span>
          )}
        </div>
        
        <motion.div 
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="p-1.5 rounded-lg bg-slate-50 text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all"
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
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-transparent overflow-hidden"
          >
            <div className="px-3 md:px-4 py-4 md:py-5">
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
    const plan = loadTrainingPlan();
    const isDynamic = plan.mode === 'dynamic' && plan.cycle?.length > 0;
    const hasPlannedTraining = (date) => {
      const am = getEffectiveSessionTitle(date, 'am').trim().toLowerCase();
      const pm = getEffectiveSessionTitle(date, 'pm').trim().toLowerCase();
      const isOff = (txt) => txt === '' || txt === 'off' || txt === 'rest' || txt.startsWith('off ') || txt.startsWith('rest ');
      return !(isOff(am) && isOff(pm));
    };

    const hasPlannedPm = (date) => {
      const pm = getEffectiveSessionTitle(date, 'pm').trim().toLowerCase();
      const isOff = (txt) => txt === '' || txt === 'off' || txt === 'rest' || txt.startsWith('off ') || txt.startsWith('rest ');
      return !isOff(pm);
    };

    const currentWeekStart = getWeekStart(new Date());
    const isCurrentWeek = currentWeekStart.getTime() === selectedWeek.getTime();

      if (isCurrentWeek && !targetDate) {
        const yesterdayName = getDayOfWeek(yesterday);
        const todayName = getDayOfWeek(today);
        const tomorrowName = getDayOfWeek(tomorrow);

        const yesterdayMissed =
          hasPlannedTraining(yesterday) &&
          !isSessionFinished(yesterday, 'am') &&
          (!hasPlannedPm(yesterday) || !isSessionFinished(yesterday, 'pm'));
        
        const focusedList = [];
        if (yesterdayMissed) {
        const yesterdayComplete = isSessionFinished(yesterday, 'am') && (!hasPlannedPm(yesterday) || isSessionFinished(yesterday, 'pm'));
        focusedList.push({ 
          date: yesterday, 
          dayName: yesterdayName, 
          muscleGroup: '', 
          isMissed: true,  
          showContextBadge: true,
          defaultOpen: targetDate ? isSameDay(yesterday, targetDate) : true,
          isFullyComplete: yesterdayComplete,
          data: loadWorkoutByDate(yesterday),
          cycleInfo: isDynamic ? getCycleSlotForDate(yesterday, plan) : null,
          isShifted: !!getDailyMetadata(yesterday, 'am').isShifted || !!getDailyMetadata(yesterday, 'pm').isShifted,
          isShiftedFrom: !!getDailyMetadata(yesterday, 'am').isShiftedFrom || !!getDailyMetadata(yesterday, 'pm').isShiftedFrom,
          shiftedFromLabel: (getDailyMetadata(yesterday, 'am').originalDate || getDailyMetadata(yesterday, 'pm').originalDate) 
            ? `${getDayOfWeek(getDailyMetadata(yesterday, 'am').originalDate || getDailyMetadata(yesterday, 'pm').originalDate).slice(0,3)}, ${formatDateCompact(getDailyMetadata(yesterday, 'am').originalDate || getDailyMetadata(yesterday, 'pm').originalDate)}` : null,
          shiftedToLabel: (getDailyMetadata(yesterday, 'am').shiftedToDate || getDailyMetadata(yesterday, 'pm').shiftedToDate) 
            ? `${getDayOfWeek(getDailyMetadata(yesterday, 'am').shiftedToDate || getDailyMetadata(yesterday, 'pm').shiftedToDate).slice(0,3)}, ${formatDateCompact(getDailyMetadata(yesterday, 'am').shiftedToDate || getDailyMetadata(yesterday, 'pm').shiftedToDate)}` : null,
        });
      }
      
      const todayComplete = isSessionFinished(today, 'am') && (!hasPlannedPm(today) || isSessionFinished(today, 'pm'));
      const todayAmMeta = getDailyMetadata(today, 'am');
      const todayPmMeta = getDailyMetadata(today, 'pm');
      focusedList.push({ 
        date: today, 
        dayName: todayName, 
        muscleGroup: '', 
        isMissed: false, 
        showContextBadge: true,
        defaultOpen: targetDate ? isSameDay(today, targetDate) : true,
        isFullyComplete: todayComplete,
        data: loadWorkoutByDate(today),
        cycleInfo: isDynamic ? getCycleSlotForDate(today, plan) : null,
        isShifted: !!todayAmMeta.isShifted || !!todayPmMeta.isShifted,
        isShiftedFrom: !!todayAmMeta.isShiftedFrom || !!todayPmMeta.isShiftedFrom,
        shiftedFromLabel: (todayAmMeta.originalDate || todayPmMeta.originalDate) 
          ? `${getDayOfWeek(todayAmMeta.originalDate || todayPmMeta.originalDate).slice(0,3)}, ${formatDateCompact(todayAmMeta.originalDate || todayPmMeta.originalDate)}` : null,
        shiftedToLabel: (todayAmMeta.shiftedToDate || todayPmMeta.shiftedToDate) 
          ? `${getDayOfWeek(todayAmMeta.shiftedToDate || todayPmMeta.shiftedToDate).slice(0,3)}, ${formatDateCompact(todayAmMeta.shiftedToDate || todayPmMeta.shiftedToDate)}` : null,
      });

      const tomorrowComplete = isSessionFinished(tomorrow, 'am') && (!hasPlannedPm(tomorrow) || isSessionFinished(tomorrow, 'pm'));
      const tomorrowAmMeta = getDailyMetadata(tomorrow, 'am');
      const tomorrowPmMeta = getDailyMetadata(tomorrow, 'pm');
      focusedList.push({ 
        date: tomorrow, 
        dayName: tomorrowName, 
        muscleGroup: '', 
        isMissed: false, 
        isTomorrow: true,
        showContextBadge: true,
        defaultOpen: targetDate ? isSameDay(tomorrow, targetDate) : false,
        isFullyComplete: tomorrowComplete,
        data: loadWorkoutByDate(tomorrow),
        cycleInfo: isDynamic ? getCycleSlotForDate(tomorrow, plan) : null,
        isShifted: !!tomorrowAmMeta.isShifted || !!tomorrowPmMeta.isShifted,
        isShiftedFrom: !!tomorrowAmMeta.isShiftedFrom || !!tomorrowPmMeta.isShiftedFrom,
        shiftedFromLabel: (tomorrowAmMeta.originalDate || tomorrowPmMeta.originalDate) 
          ? `${getDayOfWeek(tomorrowAmMeta.originalDate || tomorrowPmMeta.originalDate).slice(0,3)}, ${formatDateCompact(tomorrowAmMeta.originalDate || tomorrowPmMeta.originalDate)}` : null,
        shiftedToLabel: (tomorrowAmMeta.shiftedToDate || tomorrowPmMeta.shiftedToDate) 
          ? `${getDayOfWeek(tomorrowAmMeta.shiftedToDate || tomorrowPmMeta.shiftedToDate).slice(0,3)}, ${formatDateCompact(tomorrowAmMeta.shiftedToDate || tomorrowPmMeta.shiftedToDate)}` : null,
      });
      
      return focusedList.filter(s => !s.isFullyComplete);
    } else {
      const weekDates = getWeekDates(selectedWeek);
      const list = weekDates.map((date) => {
        const dayName = getDayOfWeek(date);
        const isFullyComplete = isSessionFinished(date, 'am') && (!hasPlannedPm(date) || isSessionFinished(date, 'pm'));
        const amMeta = getDailyMetadata(date, 'am');
        const pmMeta = getDailyMetadata(date, 'pm');
        return {
          date,
          dayName,
          muscleGroup: '',
          isMissed: false,
          isTomorrow: false,
          showContextBadge: false,
          defaultOpen: targetDate ? isSameDay(date, targetDate) : false,
          isFullyComplete,
          isShifted: !!amMeta.isShifted || !!pmMeta.isShifted,
          isShiftedFrom: !!amMeta.isShiftedFrom || !!pmMeta.isShiftedFrom,
          shiftedFromLabel: (amMeta.originalDate || pmMeta.originalDate) 
            ? `${getDayOfWeek(amMeta.originalDate || pmMeta.originalDate).slice(0,3)}, ${formatDateCompact(amMeta.originalDate || pmMeta.originalDate)}` : null,
          shiftedToLabel: (amMeta.shiftedToDate || pmMeta.shiftedToDate) 
            ? `${getDayOfWeek(amMeta.shiftedToDate || pmMeta.shiftedToDate).slice(0,3)}, ${formatDateCompact(amMeta.shiftedToDate || pmMeta.shiftedToDate)}` : null,
          data: loadWorkoutByDate(date),
          cycleInfo: isDynamic ? getCycleSlotForDate(date, plan) : null,        };
      });

      // If a specific date was targeted, only show THAT date
      // Filter out completed workouts to keep the hub focused on remaining tasks
      // BUT: preserve completed workouts if explicitly looking for a specific targetDate (e.g. from History)
      if (targetDate) {
        return list.filter(s => isSameDay(s.date, targetDate));
      }

      return list.filter(s => !s.isFullyComplete);
    }
  }, [syncState, selectedWeek, today, yesterday, tomorrow, plannerRefreshNonce, targetDate]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Training Hub</h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em] whitespace-nowrap">
              Today is {formatDateDisplay(new Date())}
            </span>
            {syncState === 'loading' && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 animate-pulse border border-indigo-100/50">
                <RefreshCw size={10} className="animate-spin" />
                <span className="text-[9px] font-black uppercase tracking-widest">Syncing</span>
              </div>
            )}
            {syncState === 'offline' && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                <AlertCircle size={10} />
                <span className="text-[9px] font-black uppercase tracking-widest">Offline</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center self-start sm:self-auto">
          <WeekPicker 
            currentWeekStart={selectedWeek} 
            onWeekChange={setSelectedWeek} 
            compact
          />
        </div>
      </div>

      <QuickHealthWidgets />

      <div className="flex flex-col">
        <AnimatePresence initial={false} mode="popLayout">
          {sections.length > 0 ? (
            sections.map((s) => (
              <motion.div
                key={s.date.getTime()}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -100, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              >
                <AccordionSection
                  section={s}
                  defaultOpen={s.defaultOpen}
                  syncToken={syncState}
                  onWorkoutChanged={() => setPlannerRefreshNonce((value) => value + 1)}
                />
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-20 flex flex-col items-center justify-center text-center gap-6 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200 mt-4"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100 ring-4 ring-emerald-50/50">
                <CheckCircle2 size={40} strokeWidth={1.5} />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Focus Achieved!</h2>
                <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.2em] max-w-[240px] leading-relaxed mx-auto">
                  All items for this period have been cleared. History updated with your progress.
                </p>
              </div>
              <button 
                onClick={() => setPlannerRefreshNonce(n => n + 1)}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-widest h-10 px-6 hover:bg-slate-50 group transition-all"
              >
                Refresh Hub <RefreshCw size={14} className="ml-2 group-hover:rotate-180 transition-transform duration-500" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


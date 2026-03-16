import { useEffect, useState } from 'react';
import { 
  Plus, 
  Save, 
  CheckCircle, 
  FastForward, 
  Lock, 
  Sun, 
  Moon, 
  Tag, 
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import ExerciseGroup from './ExerciseGroup';
import { saveDayWorkoutWithSync, markDayCompleteWithSync, markDaySkippedWithSync, isDayComplete, isDaySkipped, ensureAmPm, defaultSession, defaultGroup, loadSessionTitles, saveSessionTitlesWithSync } from '../utils/storage';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';

export default function WorkoutSection({ date, dayName, muscleGroup, isMissed, isTomorrow, initialData, hideBadge, syncToken, onWorkoutChanged, initialSession = 'am' }) {
  const day = dayName || date;
  
  const [dayData, setDayData] = useState(() => ensureAmPm(initialData));
  const [activeSession, setActiveSession] = useState(initialSession);
  const [saveFlash, setSaveFlash] = useState(false);
  const [titleSaveFlash, setTitleSaveFlash] = useState(false);
  const [amDone, setAmDone] = useState(() => isDayComplete(date || day, 'am') && !isDaySkipped(date || day, 'am'));
  const [pmDone, setPmDone] = useState(() => isDayComplete(date || day, 'pm') && !isDaySkipped(date || day, 'pm'));
  const [amSkipped, setAmSkipped] = useState(() => isDaySkipped(date || day, 'am'));
  const [pmSkipped, setPmSkipped] = useState(() => isDaySkipped(date || day, 'pm'));
  const [sessionTitlesState, setSessionTitlesState] = useState(() => loadSessionTitles());
  const [isConfirmingFinish, setIsConfirmingFinish] = useState(false);

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

  const [isDirty, setIsDirty] = useState(false);

  const handleSave = () => {
    saveDayWorkoutWithSync(date || day, dayData);
    onWorkoutChanged?.();
    setSaveFlash(true);
    setIsDirty(false);
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

  // Debounced Auto-save
  useEffect(() => {
    // Skip auto-save on initial mount
    if (!isDirty) return;

    const timer = setTimeout(() => {
      saveDayWorkoutWithSync(date || day, dayData);
      onWorkoutChanged?.();
      setIsDirty(false);
      setSaveFlash(true);
      setTimeout(() => setSaveFlash(false), 2000);
    }, 1500); // 1.5s debounce

    return () => clearTimeout(timer);
  }, [dayData, date, day, isDirty]);

  const handleGroupChange = (groupIdx, updatedGroup) => {
    setIsDirty(true);
    setDayData((prev) => {
      const s = { ...prev[activeSession] };
      s.groups = s.groups.map((g, i) => (i === groupIdx ? updatedGroup : g));
      return { ...prev, [activeSession]: s };
    });
  };

  const handleAddGroup = () => {
    setIsDirty(true);
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
    setIsDirty(true);
    setDayData((prev) => {
      const sessionData = { ...prev[activeSession] };
      const nextGroups = sessionData.groups.filter((_, idx) => idx !== groupIdx);
      sessionData.groups = nextGroups.length > 0 ? nextGroups : [defaultGroup()];
      return { ...prev, [activeSession]: sessionData };
    });
  };

  const amTitle = sessionTitlesState.am?.[day] || '';
  const pmTitle = sessionTitlesState.pm?.[day] || '';
  const sessionDone = activeSession === 'am' ? amDone : pmDone;
  const sessionSkipped = activeSession === 'am' ? amSkipped : pmSkipped;
  const bothDone = (amDone || amSkipped) && (pmDone || pmSkipped);
  const groups = dayData[activeSession]?.groups ?? [];

  const tabCls = (session, done, skipped) => {
    const isActive = activeSession === session;
    const isLocked = done || skipped;
    
    return cn(
      "flex items-center gap-2 px-3 md:px-4 py-2 text-[10px] md:text-[11px] font-bold uppercase tracking-wider transition-all relative shrink-0 outline-none",
      isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600',
      isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
    );
  };

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {bothDone && (
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl px-3 md:px-4 py-2.5 md:py-3 flex items-center gap-3 mb-2 md:mb-4">
          <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-100">
            <CheckCircle2 size={16} />
          </div>
          <div>
            <p className="text-emerald-900 font-bold text-[11px] md:text-xs">Training session finalized!</p>
            <p className="text-emerald-600 text-[9px] md:text-[10px] font-medium uppercase tracking-tight mt-0.5">
              AM {amDone ? '✓ COMPLETED' : '⏭ SKIPPED'} &nbsp;·&nbsp; PM {pmDone ? '✓ COMPLETED' : '⏭ SKIPPED'}
            </p>
          </div>
        </div>
      )}

      {/* Sub-tabs for AM/PM */}
      <div className="flex items-center gap-1 md:gap-2 border-b border-slate-50 mb-1 overflow-x-auto scrollbar-none">
        <button className={tabCls('am', amDone, amSkipped)} onClick={() => setActiveSession('am')}>
          <Sun size={14} className={cn(activeSession === 'am' ? "text-indigo-600" : "text-slate-400")} />
          <span>AM Session</span>
          {amDone && <CheckCircle size={10} className="text-emerald-500 ml-1" />}
          {amSkipped && <FastForward size={10} className="text-slate-300 ml-1" />}
          {activeSession === 'am' && (
            <motion.div 
              layoutId="activeSessionIndicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" 
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </button>
        <button className={tabCls('pm', pmDone, pmSkipped)} onClick={() => setActiveSession('pm')}>
          <Moon size={14} className={cn(activeSession === 'pm' ? "text-indigo-600" : "text-slate-400")} />
          <span>PM Session</span>
          {pmDone && <CheckCircle size={10} className="text-emerald-500 ml-1" />}
          {pmSkipped && <FastForward size={10} className="text-slate-300 ml-1" />}
          {activeSession === 'pm' && (
            <motion.div 
              layoutId="activeSessionIndicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" 
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeSession}
          initial={{ opacity: 0, x: activeSession === 'am' ? -10 : 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: activeSession === 'am' ? 10 : -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex flex-col gap-3 md:gap-4 mt-2"
        >
          <div className="flex items-center gap-4 group">
            <div className="flex-1 relative">
              <Tag size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-400 transition-colors z-10" />
              <Input
                value={activeSession === 'am' ? amTitle : pmTitle}
                onChange={(e) => handleSessionTitleChange(activeSession, e.target.value)}
                onBlur={handleSessionTitleSave}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                placeholder="What are we training?"
                disabled={sessionDone || sessionSkipped}
                className="w-full pl-9 bg-slate-50/50 border-slate-100 rounded-xl text-xs font-bold text-slate-700 placeholder:text-slate-300 focus-visible:bg-white focus-visible:border-indigo-200 transition-all h-9"
              />
            </div>
            {titleSaveFlash && (
              <span className="text-emerald-500 font-bold text-[10px] uppercase tracking-widest animate-fade-in whitespace-nowrap">Auto-saved</span>
            )}
          </div>

          <div className="space-y-3">
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
              <Button
                variant="ghost"
                onClick={handleAddGroup}
                className="group self-start h-10 border border-dashed border-indigo-100 rounded-xl text-indigo-500 hover:bg-indigo-50 hover:border-indigo-200 transition-all text-xs font-bold p-0 pr-4 overflow-hidden"
              >
                <div className="w-10 h-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <Plus size={14} strokeWidth={3} />
                </div>
                <span className="ml-3">New Exercise Group</span>
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
        {sessionDone ? (
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Session Completed</span>
          </div>
        ) : sessionSkipped ? (
          <div className="flex items-center gap-2 text-slate-400">
            <FastForward size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Session Skipped</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap w-full">
            <div className="flex items-center gap-3">
              {isConfirmingFinish ? (
                <Button 
                  onClick={() => {
                    handleComplete();
                    setIsConfirmingFinish(false);
                  }} 
                  className="h-9 gap-2 px-4 bg-emerald-600 text-white font-bold text-[10px] uppercase rounded-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 animate-in fade-in zoom-in-95 duration-200"
                >
                  <CheckCircle2 size={14} /> Confirm Finish
                </Button>
              ) : (
                <Button 
                  onClick={() => {
                    setIsConfirmingFinish(true);
                    setTimeout(() => setIsConfirmingFinish(false), 3000);
                  }} 
                  className="h-9 gap-2 px-4 bg-indigo-600 text-white font-bold text-[10px] uppercase rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  <CheckCircle size={14} /> Finish Session
                </Button>
              )}
              
              <div className="w-px h-6 bg-slate-100 mx-1" />
              
              <Button 
                variant="ghost"
                onClick={handleSkip} 
                className="h-9 px-4 text-slate-400 font-bold text-[10px] uppercase rounded-lg hover:text-slate-900 transition-all"
              >
                Skip
              </Button>
            </div>

            <div className="ml-auto flex items-center gap-2 h-7">
              <AnimatePresence mode="wait">
                {isDirty ? (
                  <motion.div 
                    key="saving"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-center gap-2 text-slate-400"
                  >
                    <RefreshCw size={10} className="animate-spin" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">Saving...</span>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="saved"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className={cn(
                      "flex items-center gap-1.5 transition-all duration-500",
                      saveFlash ? "text-emerald-500 opacity-100" : "text-slate-300 opacity-40"
                    )}
                  >
                    <CheckCircle2 size={10} />
                    <span className="text-[9px] font-bold uppercase tracking-widest">
                      {saveFlash ? "Changes Saved" : "Auto-saved"}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <Button 
                variant="ghost"
                onClick={handleSave} 
                className="h-7 px-2 text-slate-300 hover:text-indigo-600 font-bold text-[8px] uppercase tracking-tighter"
              >
                Force Save
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
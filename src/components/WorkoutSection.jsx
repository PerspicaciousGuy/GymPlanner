import { useEffect, useState, useCallback, useMemo } from 'react';
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
  RefreshCw,
  FolderOpen,
  ArrowRight
} from 'lucide-react';
import ExerciseGroup from './ExerciseGroup';
import AdvancedExerciseCard from './AdvancedExerciseCard';
import TemplateDialog from './TemplateDialog';
import ShiftPicker from './ShiftPicker';
import { 
  saveDayWorkoutWithSync, 
  markDayCompleteWithSync, 
  markDaySkippedWithSync, 
  isDayComplete, 
  isDaySkipped, 
  ensureAmPm, 
  defaultSession, 
  defaultGroup, 
  defaultRow,
  loadSessionTitles, 
  saveSessionTitlesWithSync,
  getEffectiveSessionTitle,
  saveDailyMetadata,
  shiftWorkout
} from '../utils/storage';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDateKey } from '../utils/dateUtils';
import { loadTrainingPlan } from '../utils/trainingPlan';
import { motion, AnimatePresence } from 'framer-motion';

export default function WorkoutSection({ date, dayName, muscleGroup, isMissed, isTomorrow, initialData, hideBadge, syncToken, onWorkoutChanged, initialSession = 'am' }) {
  const workoutDateKey = (date instanceof Date) ? formatDateKey(date) : (dayName || date);
  const titleDayName = dayName || (date instanceof Date ? getDayOfWeek(date) : getDayOfWeek(new Date(date)));
  
  const [templateDialogMode, setTemplateDialogMode] = useState('load'); // 'load' or 'save'

  const ensureAdvanced = (data) => {
    const d = ensureAmPm(data);
    ['am', 'pm'].forEach(session => {
      if (!d[session].standaloneExercises) d[session].standaloneExercises = [];
    });
    return d;
  };

  const [dayData, setDayData] = useState(() => ensureAdvanced(initialData));
  const plan = useMemo(() => loadTrainingPlan(), [syncToken]);
  const sessionLayout = plan?.sessionLayout || 'split';
  const [activeSession, setActiveSession] = useState(initialSession);
  const [saveFlash, setSaveFlash] = useState(false);
  const [titleSaveFlash, setTitleSaveFlash] = useState(false);
  const [amDone, setAmDone] = useState(() => isDayComplete(date || workoutDateKey, 'am') && !isDaySkipped(date || workoutDateKey, 'am'));
  const [pmDone, setPmDone] = useState(() => isDayComplete(date || workoutDateKey, 'pm') && !isDaySkipped(date || workoutDateKey, 'pm'));
  const [amSkipped, setAmSkipped] = useState(() => isDaySkipped(date || workoutDateKey, 'am'));
  const [pmSkipped, setPmSkipped] = useState(() => isDaySkipped(date || workoutDateKey, 'pm'));
  const [amTitleState, setAmTitleState] = useState(() => getEffectiveSessionTitle(date || workoutDateKey, 'am'));
  const [pmTitleState, setPmTitleState] = useState(() => getEffectiveSessionTitle(date || workoutDateKey, 'pm'));
  const [isConfirmingFinish, setIsConfirmingFinish] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showShiftPicker, setShowShiftPicker] = useState(false);

  useEffect(() => {
    setDayData(ensureAdvanced(initialData));
  }, [initialData]);

  useEffect(() => {
    setAmTitleState(getEffectiveSessionTitle(date || workoutDateKey, 'am'));
    setPmTitleState(getEffectiveSessionTitle(date || workoutDateKey, 'pm'));
  }, [date, workoutDateKey, syncToken]);

  useEffect(() => {
    const dateOrDay = date || workoutDateKey;
    const amIsSkipped = isDaySkipped(dateOrDay, 'am');
    const pmIsSkipped = isDaySkipped(dateOrDay, 'pm');
    setAmSkipped(amIsSkipped);
    setPmSkipped(pmIsSkipped);
    setAmDone(isDayComplete(dateOrDay, 'am') && !amIsSkipped);
    setPmDone(isDayComplete(dateOrDay, 'pm') && !pmIsSkipped);
  }, [date, workoutDateKey, syncToken]);

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
    saveDayWorkoutWithSync(date || workoutDateKey, dayData);
    onWorkoutChanged?.();
    setSaveFlash(true);
    setIsDirty(false);
    setTimeout(() => setSaveFlash(false), 2000);
  };

  const handleComplete = () => {
    saveDayWorkoutWithSync(date || workoutDateKey, dayData);
    markDayCompleteWithSync(date || workoutDateKey, activeSession);
    onWorkoutChanged?.();

    if (activeSession === 'am' && sessionLayout !== 'single') {
      setAmDone(true);
      setAmSkipped(false);
      setActiveSession('pm');
    } else if (activeSession === 'am') {
      setAmDone(true);
      setAmSkipped(false);
    } else {
      setPmDone(true);
      setPmSkipped(false);
    }
  };

  const handleSkip = () => {
    markDaySkippedWithSync(date || workoutDateKey, activeSession);
    onWorkoutChanged?.();
    if (activeSession === 'am' && sessionLayout !== 'single') {
      setAmDone(false);
      setAmSkipped(true);
      setActiveSession('pm');
    } else if (activeSession === 'am') {
      setAmDone(false);
      setAmSkipped(true);
    } else {
      setPmDone(false);
      setPmSkipped(true);
    }
  };

  const handleShift = (targetDate, targetSession) => {
    shiftWorkout(date || workoutDateKey, targetDate, activeSession, targetSession);
    setShowShiftPicker(false);
    onWorkoutChanged?.();
    // Reset local state for source day
    setDayData(ensureAmPm(null));
    if (activeSession === 'am') setAmTitleState(`Rest (Shifted)`);
    else setPmTitleState(`Rest (Shifted)`);
  };

  // Debounced Auto-save
  useEffect(() => {
    // Skip auto-save on initial mount
    if (!isDirty) return;

    const timer = setTimeout(() => {
      saveDayWorkoutWithSync(date || workoutDateKey, dayData);
      onWorkoutChanged?.();
      setIsDirty(false);
      setSaveFlash(true);
      setTimeout(() => setSaveFlash(false), 2000);
    }, 1500); // 1.5s debounce

    return () => clearTimeout(timer);
  }, [dayData, date, workoutDateKey, isDirty]);

  const handleGroupChange = useCallback((groupIdx, updatedGroup) => {
    setIsDirty(true);
    setDayData((prev) => {
      const s = { ...prev[activeSession] };
      s.groups = s.groups.map((g, i) => (i === groupIdx ? updatedGroup : g));
      return { ...prev, [activeSession]: s };
    });
  }, [activeSession]);

  const handleAddGroup = useCallback(() => {
    setIsDirty(true);
    setDayData((prev) => ({
      ...prev,
      [activeSession]: {
        ...prev[activeSession],
        groups: [...prev[activeSession].groups, defaultGroup()],
      },
    }));
  }, [activeSession]);

  const handleAddExercise = useCallback(() => {
    setIsDirty(true);
    setDayData((prev) => {
      const s = { ...prev[activeSession] };
      const newEx = {
        id: crypto.randomUUID(),
        muscle: '',
        subMuscle: '',
        exercise: '',
        totalSets: 1,
        sets: [{ reps: '', weight: '' }],
        isCollapsed: false
      };
      s.standaloneExercises = [...(s.standaloneExercises || []), newEx];
      return { ...prev, [activeSession]: s };
    });
  }, [activeSession]);

  const handleAdvancedExerciseChange = useCallback((exIdx, updatedEx) => {
    setIsDirty(true);
    setDayData((prev) => {
      const s = { ...prev[activeSession] };
      s.standaloneExercises = s.standaloneExercises.map((ex, i) => (i === exIdx ? updatedEx : ex));
      return { ...prev, [activeSession]: s };
    });
  }, [activeSession]);

  const handleDeleteAdvancedExercise = useCallback((exIdx) => {
    setIsDirty(true);
    setDayData((prev) => {
      const s = { ...prev[activeSession] };
      s.standaloneExercises = s.standaloneExercises.filter((_, i) => i !== exIdx);
      return { ...prev, [activeSession]: s };
    });
  }, [activeSession]);

  const handleSessionTitleChange = (session, value) => {
    if (session === 'am') setAmTitleState(value);
    else setPmTitleState(value);
  };

  const handleSessionTitleSave = () => {
    const value = activeSession === 'am' ? amTitleState : pmTitleState;
    saveDailyMetadata(date || workoutDateKey, activeSession, { title: value });
    onWorkoutChanged?.();
    setTitleSaveFlash(true);
    setTimeout(() => setTitleSaveFlash(false), 1800);
  };

  const handleDeleteGroup = useCallback((groupIdx) => {
    setIsDirty(true);
    setDayData((prev) => {
      const sessionData = { ...prev[activeSession] };
      const nextGroups = sessionData.groups.filter((_, idx) => idx !== groupIdx);
      sessionData.groups = nextGroups;
      return { ...prev, [activeSession]: sessionData };
    });
  }, [activeSession]);

  const handleApplyTemplate = (template) => {
    setDayData((prev) => {
      const s = { ...prev[activeSession] };
      s.groups = JSON.parse(JSON.stringify(template.groups));
      return { ...prev, [activeSession]: s };
    });
    setAmTitleState(template.name); // If loading into AM
    setPmTitleState(template.name); // Just in case, but usually we load into active
    
    // Save as daily override immediately
    saveDailyMetadata(date || workoutDateKey, activeSession, { title: template.name });
    
    setIsDirty(true);
    setShowTemplateDialog(false);
  };

  const sessionData = dayData[activeSession] || { groups: [], standaloneExercises: [] };
  const groups = sessionData.groups || [];
  const standaloneExercises = sessionData.standaloneExercises || [];
  const sessionDone = activeSession === 'am' ? amDone : pmDone;
  const sessionSkipped = activeSession === 'am' ? amSkipped : pmSkipped;
  const amTitle = amTitleState;
  const pmTitle = pmTitleState;
  const bothDone = sessionLayout === 'single' ? (amDone || amSkipped) : (amDone || amSkipped) && (pmDone || pmSkipped);

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
              {sessionLayout === 'single' ? 
                `SESSION ${amDone ? '✓ COMPLETED' : '⏭ SKIPPED'}` :
                `AM ${amDone ? '✓ COMPLETED' : '⏭ SKIPPED'}  ·  PM ${pmDone ? '✓ COMPLETED' : '⏭ SKIPPED'}`
              }
            </p>
          </div>
        </div>
      )}

      {/* Sub-tabs for AM/PM */}
      {sessionLayout !== 'single' && (
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
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeSession}
          initial={{ opacity: 0, x: activeSession === 'am' ? -10 : 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: activeSession === 'am' ? 10 : -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex flex-col gap-3 md:gap-4 mt-2"
        >
          <div className="flex items-center gap-4 group/session">
            <div className="flex-1 relative flex items-center">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/session:text-indigo-400 transition-colors z-20 pointer-events-none">
                <Tag size={14} strokeWidth={2.5} />
              </div>
              <Input
                value={activeSession === 'am' ? amTitle : pmTitle}
                onChange={(e) => handleSessionTitleChange(activeSession, e.target.value)}
                onBlur={handleSessionTitleSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }
                }}
                placeholder="Designate Training Protocol..."
                disabled={sessionDone || sessionSkipped}
                className="w-full pl-11 pr-24 bg-slate-50 shadow-sm border-slate-100 rounded-[1.25rem] text-[13px] font-black text-slate-800 placeholder:text-slate-200 focus-visible:bg-white focus-visible:border-indigo-200 focus-visible:ring-indigo-500/5 transition-all h-12 italic"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-20">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-white hover:border-indigo-200 hover:shadow-sm transition-all border border-slate-100 bg-white/80",
                    (sessionDone || sessionSkipped) && "hidden"
                  )}
                  onClick={() => setShowShiftPicker(true)}
                  title="Shift Workout"
                >
                  <ArrowRight size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-white hover:border-indigo-200 hover:shadow-sm transition-all border border-slate-100 bg-white/80",
                    (sessionDone || sessionSkipped) && "hidden"
                  )}
                  onClick={() => {
                    setTemplateDialogMode('load');
                    setShowTemplateDialog(true);
                  }}
                  title="Load Routine"
                >
                  <FolderOpen size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-white hover:border-indigo-200 hover:shadow-sm transition-all border border-slate-100 bg-white/80",
                    (sessionDone || sessionSkipped) && "hidden"
                  )}
                  onClick={() => {
                    setTemplateDialogMode('save');
                    setShowTemplateDialog(true);
                  }}
                  title="Save Protocol"
                >
                  <Sparkles size={16} />
                </Button>
              </div>
            </div>
            {titleSaveFlash && (
              <Badge variant="outline" className="text-emerald-500 font-black text-[9px] uppercase tracking-widest border-emerald-100 bg-emerald-50/50 animate-in fade-in zoom-in-95 duration-300 h-6 shrink-0">
                Synchronized
              </Badge>
            )}
          </div>

          <TemplateDialog 
            open={showTemplateDialog}
            onOpenChange={setShowTemplateDialog}
            mode={templateDialogMode}
            currentGroups={groups}
            onSelect={handleApplyTemplate}
          />

          <ShiftPicker
            open={showShiftPicker}
            onOpenChange={setShowShiftPicker}
            sourceDate={date || workoutDateKey}
            sourceSession={activeSession}
            onShift={handleShift}
          />

          <div className="space-y-4">
            {/* Standalone Advanced Exercises */}
            {standaloneExercises.map((ex, idx) => (
              <AdvancedExerciseCard
                key={ex.id || idx}
                index={idx}
                exerciseData={ex}
                workoutDate={date || workoutDateKey}
                onChange={(updated) => handleAdvancedExerciseChange(idx, updated)}
                onDelete={() => handleDeleteAdvancedExercise(idx)}
              />
            ))}

            {/* Traditional Groups */}
            {groups.map((group, idx) => (
              <ExerciseGroup
                key={idx}
                groupIndex={idx}
                group={group}
                groupCount={groups.length}
                workoutDate={date || workoutDateKey}
                sessionKey={activeSession}
                onChange={(updated) => handleGroupChange(idx, updated)}
                onDeleteGroup={() => handleDeleteGroup(idx)}
              />
            ))}
            {!sessionDone && !sessionSkipped && (
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <Button
                  variant="ghost"
                  onClick={handleAddGroup}
                  className="group h-10 border border-dashed border-indigo-100 rounded-xl text-indigo-500 hover:bg-indigo-50 hover:border-indigo-200 transition-all text-xs font-bold p-0 pr-4 overflow-hidden"
                >
                  <div className="w-10 h-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <Plus size={14} strokeWidth={3} />
                  </div>
                  <span className="ml-3">New Exercise Group</span>
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleAddExercise}
                  className="group h-10 border border-dashed border-indigo-100 rounded-xl text-indigo-500 hover:bg-indigo-50 hover:border-indigo-200 transition-all text-xs font-bold p-0 pr-4 overflow-hidden"
                >
                  <div className="w-10 h-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <div className="bg-indigo-100/50 p-1 rounded-lg group-hover:bg-white/20 transition-all">
                      <Plus size={12} strokeWidth={3} />
                    </div>
                  </div>
                  <span className="ml-3">Add Exercise</span>
                </Button>
              </div>
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
            
            <Button 
              onClick={() => {
                setTemplateDialogMode('save');
                setShowTemplateDialog(true);
              }} 
              variant="outline"
              className="h-9 gap-2 px-4 border-indigo-100 text-indigo-600 font-bold text-[10px] uppercase rounded-lg hover:bg-indigo-50 transition-all shadow-sm"
            >
              <Sparkles size={14} /> Save as Routine
            </Button>
            
            <Button 
              variant="ghost"
              onClick={handleSkip} 
              className="h-9 px-4 text-slate-400 font-bold text-[10px] uppercase rounded-lg hover:text-slate-900 transition-all"
            >
              Skip
            </Button>

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
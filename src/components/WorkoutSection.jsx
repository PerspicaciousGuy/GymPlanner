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
  FolderOpen
} from 'lucide-react';
import ExerciseGroup from './ExerciseGroup';
import TemplateDialog from './TemplateDialog';
import { saveDayWorkoutWithSync, markDayCompleteWithSync, markDaySkippedWithSync, isDayComplete, isDaySkipped, ensureAmPm, defaultSession, defaultGroup, loadSessionTitles, saveSessionTitlesWithSync } from '../utils/storage';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDateKey } from '../utils/dateUtils';
import { motion, AnimatePresence } from 'framer-motion';

export default function WorkoutSection({ date, dayName, muscleGroup, isMissed, isTomorrow, initialData, hideBadge, syncToken, onWorkoutChanged, initialSession = 'am' }) {
  const workoutDateKey = (date instanceof Date) ? formatDateKey(date) : (dayName || date);
  const titleDayName = dayName || (date instanceof Date ? getDayOfWeek(date) : getDayOfWeek(new Date(date)));
  
  const [dayData, setDayData] = useState(() => ensureAmPm(initialData));
  const [activeSession, setActiveSession] = useState(initialSession);
  const [saveFlash, setSaveFlash] = useState(false);
  const [titleSaveFlash, setTitleSaveFlash] = useState(false);
  const [amDone, setAmDone] = useState(() => isDayComplete(date || workoutDateKey, 'am') && !isDaySkipped(date || workoutDateKey, 'am'));
  const [pmDone, setPmDone] = useState(() => isDayComplete(date || workoutDateKey, 'pm') && !isDaySkipped(date || workoutDateKey, 'pm'));
  const [amSkipped, setAmSkipped] = useState(() => isDaySkipped(date || workoutDateKey, 'am'));
  const [pmSkipped, setPmSkipped] = useState(() => isDaySkipped(date || workoutDateKey, 'pm'));
  const [sessionTitlesState, setSessionTitlesState] = useState(() => loadSessionTitles() || { am: {}, pm: {} });
  const [isConfirmingFinish, setIsConfirmingFinish] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateDialogMode, setTemplateDialogMode] = useState('load'); // 'load' or 'save'

  useEffect(() => {
    setDayData(ensureAmPm(initialData));
  }, [initialData]);

  useEffect(() => {
    setSessionTitlesState(loadSessionTitles());
  }, [syncToken]);

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
    markDaySkippedWithSync(date || workoutDateKey, activeSession);
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

  const handleSessionTitleChange = (session, value) => {
    setSessionTitlesState((prev) => {
      const currentSession = prev?.[session] || {};
      return {
        ...prev,
        [session]: {
          ...currentSession,
          [titleDayName]: value,
        },
      };
    });
  };

  const handleSessionTitleSave = () => {
    if (!sessionTitlesState) return;
    saveSessionTitlesWithSync(sessionTitlesState);
    onWorkoutChanged?.();
    setTitleSaveFlash(true);
    setTimeout(() => setTitleSaveFlash(false), 2000);
  };

  const handleDeleteGroup = useCallback((groupIdx) => {
    setIsDirty(true);
    setDayData((prev) => {
      const sessionData = { ...prev[activeSession] };
      const nextGroups = sessionData.groups.filter((_, idx) => idx !== groupIdx);
      sessionData.groups = nextGroups.length > 0 ? nextGroups : [defaultGroup()];
      return { ...prev, [activeSession]: sessionData };
    });
  }, [activeSession]);

  const handleApplyTemplate = (template) => {
    setDayData((prev) => {
      const s = { ...prev[activeSession] };
      s.groups = JSON.parse(JSON.stringify(template.groups));
      return { ...prev, [activeSession]: s };
    });
    setSessionTitlesState((prev) => ({
      ...prev,
      [activeSession]: {
        ...prev[activeSession],
        [titleDayName]: template.name
      }
    }));
    setIsDirty(true);
    setShowTemplateDialog(false);
  };

  const amTitle = sessionTitlesState?.am?.[titleDayName] || '';
  const pmTitle = sessionTitlesState?.pm?.[titleDayName] || '';
  const sessionDone = activeSession === 'am' ? amDone : pmDone;
  const sessionSkipped = activeSession === 'am' ? amSkipped : pmSkipped;
  const bothDone = (amDone || amSkipped) && (pmDone || pmSkipped);
  const groups = dayData[activeSession]?.groups ?? [];

  const tabCls = (session, done, skipped) => {
    const isActive = activeSession === session;
    const isLocked = done || skipped;
    
    return cn(
      "flex items-center gap-2 px-3 md:px-5 py-3 text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] transition-all relative shrink-0 outline-none",
      isActive ? 'text-primary drop-shadow-[0_0_8px_rgba(212,255,0,0.3)]' : 'text-slate-500 hover:text-slate-300',
      isLocked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
    );
  };

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {bothDone && (
        <div className="bg-primary/5 border border-primary/20 rounded-[2.5rem] px-8 py-6 flex items-center gap-6 mb-8 shadow-[0_0_40px_rgba(212,255,0,0.08)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-30 -mr-24 -mt-24" />
          <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-[0_0_30px_rgba(212,255,0,0.4)] scale-110 shrink-0">
            <CheckCircle2 size={24} strokeWidth={4} />
          </div>
          <div>
            <p className="text-primary font-black text-sm uppercase tracking-[0.4em] italic mb-1">Architecture Calibrated</p>
            <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.25em] flex items-center gap-3">
              <span className={amDone ? "text-primary/70" : "text-slate-800"}>ALPHA: {amDone ? 'FINALIZED' : 'BYPASSED'}</span>
              <div className="w-1.5 h-1.5 rounded-full bg-white/5" />
              <span className={pmDone ? "text-primary/70" : "text-slate-800"}>OMEGA: {pmDone ? 'FINALIZED' : 'BYPASSED'}</span>
            </p>
          </div>
        </div>
      )}

      {/* Sub-tabs for AM/PM */}
      <div className="flex items-center gap-2 border-b border-white/5 mb-4 overflow-x-auto scrollbar-none">
        <button className={tabCls('am', amDone, amSkipped)} onClick={() => setActiveSession('am')}>
          <Sun size={14} className={cn(activeSession === 'am' ? "text-primary shadow-[0_0_15px_#d4ff00]" : "text-slate-700")} strokeWidth={4} />
          <span>Alpha Session</span>
          {amDone && <CheckCircle size={10} className="text-primary ml-2 shadow-[0_0_10px_#d4ff00]" strokeWidth={4} />}
          {amSkipped && <FastForward size={10} className="text-slate-800 ml-2" />}
          {activeSession === 'am' && (
            <motion.div 
              layoutId="activeSessionIndicator"
              className="absolute bottom-0 left-0 right-0 h-1.5 bg-primary rounded-full shadow-[0_0_15px_#d4ff00]" 
              transition={{ type: "spring", stiffness: 600, damping: 30 }}
            />
          )}
        </button>
        <button className={tabCls('pm', pmDone, pmSkipped)} onClick={() => setActiveSession('pm')}>
          <Moon size={14} className={cn(activeSession === 'pm' ? "text-primary shadow-[0_0_15px_#d4ff00]" : "text-slate-700")} strokeWidth={4} />
          <span>Omega Session</span>
          {pmDone && <CheckCircle size={10} className="text-primary ml-2 shadow-[0_0_10px_#d4ff00]" strokeWidth={4} />}
          {pmSkipped && <FastForward size={10} className="text-slate-800 ml-2" />}
          {activeSession === 'pm' && (
            <motion.div 
              layoutId="activeSessionIndicator"
              className="absolute bottom-0 left-0 right-0 h-1.5 bg-primary rounded-full shadow-[0_0_15px_#d4ff00]" 
              transition={{ type: "spring", stiffness: 600, damping: 30 }}
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
          <div className="flex items-center gap-4 group/session">
            <div className="flex-1 relative flex items-center">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/session:text-primary transition-colors z-20 pointer-events-none">
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
                className="w-full pl-11 pr-24 bg-white/5 shadow-inner border-white/5 rounded-2xl text-[13px] font-black text-foreground placeholder:text-slate-600 focus-visible:bg-white/10 focus-visible:border-primary/20 focus-visible:ring-primary/5 transition-all h-14 italic tracking-tight"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-20">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-9 w-9 rounded-xl text-slate-500 hover:text-primary hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20",
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
                    "h-9 w-9 rounded-xl text-slate-500 hover:text-primary hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20",
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
              <Badge variant="outline" className="text-primary font-black text-[9px] uppercase tracking-[0.3em] border-primary/20 bg-primary/10 animate-pulse h-8 px-4 rounded-xl shrink-0 italic">
                Resonating
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

          <div className="space-y-3">
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
              <Button
                variant="ghost"
                onClick={handleAddGroup}
                className="group self-start h-12 border border-dashed border-white/10 rounded-2xl text-slate-400 hover:bg-white/5 hover:border-primary/30 transition-all text-xs font-black uppercase tracking-widest p-0 pr-6 overflow-hidden"
              >
                <div className="w-12 h-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  <Plus size={16} strokeWidth={4} />
                </div>
                <span className="ml-4 tracking-[0.2em]">Add Performance Block</span>
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
        {sessionDone ? (
          <div className="flex items-center gap-3 text-primary animate-pulse italic">
            <CheckCircle size={16} strokeWidth={3} />
            <span className="text-[11px] font-black uppercase tracking-[0.3em]">Protocol Finalized</span>
          </div>
        ) : sessionSkipped ? (
          <div className="flex items-center gap-3 text-slate-700 italic">
            <FastForward size={16} strokeWidth={3} />
            <span className="text-[11px] font-black uppercase tracking-[0.3em]">Temporal Bypass</span>
          </div>
        ) : (
          <div className="flex items-center gap-5 flex-wrap w-full">
            {isConfirmingFinish ? (
                <Button 
                  onClick={() => {
                    handleComplete();
                    setIsConfirmingFinish(false);
                  }} 
                  className="h-14 gap-3 px-8 bg-primary text-primary-foreground font-black text-[11px] uppercase rounded-[1.25rem] hover:bg-primary/90 transition-all shadow-[0_15px_30px_rgba(212,255,0,0.3)] animate-in fade-in zoom-in-95 duration-200 tracking-[0.3em] italic"
                >
                  <CheckCircle2 size={18} strokeWidth={4} /> CONFIRM FINAL
                </Button>
            ) : (
              <Button 
                onClick={() => {
                  setIsConfirmingFinish(true);
                  setTimeout(() => setIsConfirmingFinish(false), 3000);
                }} 
                className="h-14 gap-3 px-8 bg-primary text-primary-foreground font-black text-[11px] uppercase rounded-[1.25rem] hover:bg-primary/90 transition-all shadow-[0_15px_30px_rgba(212,255,0,0.2)] tracking-[0.3em] active:scale-95 italic"
              >
                <CheckCircle size={18} strokeWidth={4} /> FINALIZE LOAD
              </Button>
            )}
            
            <Button 
              onClick={() => {
                setTemplateDialogMode('save');
                setShowTemplateDialog(true);
              }} 
              variant="outline"
              className="h-14 gap-3 px-8 border-white/5 bg-white/5 text-primary-foreground font-black text-[11px] uppercase rounded-[1.25rem] hover:bg-white/10 hover:border-primary/20 transition-all shadow-2xl tracking-[0.3em] active:scale-95 italic"
            >
              <Sparkles size={18} strokeWidth={4} /> ARCHIVE DATA
            </Button>
            
            <Button 
              variant="ghost"
              onClick={handleSkip} 
              className="h-12 px-6 text-slate-700 font-black text-[10px] uppercase rounded-2xl hover:text-white hover:bg-white/5 transition-all tracking-[0.3em]"
            >
              BYPASS
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
                    <CheckCircle2 size={12} strokeWidth={3} />
                    <span className="text-[10px] font-black uppercase tracking-widest italic">
                      {saveFlash ? "COMMITTED" : "AUTO-SYNC"}
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
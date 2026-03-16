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
  AlertCircle
} from 'lucide-react';
import ExerciseGroup from './ExerciseGroup';
import { saveDayWorkoutWithSync, markDayCompleteWithSync, markDaySkippedWithSync, isDayComplete, isDaySkipped, ensureAmPm, defaultSession, defaultGroup, loadSessionTitles, saveSessionTitlesWithSync } from '../utils/storage';

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

  const amTitle = sessionTitlesState.am?.[day] || '';
  const pmTitle = sessionTitlesState.pm?.[day] || '';
  const sessionDone = activeSession === 'am' ? amDone : pmDone;
  const sessionSkipped = activeSession === 'am' ? amSkipped : pmSkipped;
  const bothDone = (amDone || amSkipped) && (pmDone || pmSkipped);
  const groups = dayData[activeSession]?.groups ?? [];

  const tabCls = (session, done, skipped) => {
    const isActive = activeSession === session;
    const isLocked = done || skipped;
    
    return `
      flex items-center gap-2 px-3 md:px-4 py-2 text-[10px] md:text-[11px] font-bold uppercase tracking-wider transition-all relative shrink-0
      ${isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}
      ${isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
    `;
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
          {activeSession === 'am' ? <Sun size={14} className="text-indigo-600" /> : <Sun size={14} />}
          <span>AM Session</span>
          {amDone && <CheckCircle size={10} className="text-emerald-500 ml-1" />}
          {amSkipped && <FastForward size={10} className="text-slate-300 ml-1" />}
          {activeSession === 'am' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />}
        </button>
        <button className={tabCls('pm', pmDone, pmSkipped)} onClick={() => setActiveSession('pm')}>
          {activeSession === 'pm' ? <Moon size={14} className="text-indigo-600" /> : <Moon size={14} />}
          <span>PM Session</span>
          {pmDone && <CheckCircle size={10} className="text-emerald-500 ml-1" />}
          {pmSkipped && <FastForward size={10} className="text-slate-300 ml-1" />}
          {activeSession === 'pm' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />}
        </button>
      </div>

      <div className="flex items-center gap-4 group">
        <div className="flex-1 relative">
          <Tag size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-400 transition-colors" />
          <input
            value={activeSession === 'am' ? amTitle : pmTitle}
            onChange={(e) => handleSessionTitleChange(activeSession, e.target.value)}
            onBlur={handleSessionTitleSave}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            placeholder="What are we training?"
            readOnly={sessionDone || sessionSkipped}
            className={`w-full pl-9 pr-4 py-2 bg-slate-50/50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 placeholder:text-slate-300 focus:bg-white focus:border-indigo-200 outline-none transition-all ${sessionDone || sessionSkipped ? 'cursor-default' : ''}`}
          />
        </div>
        {titleSaveFlash && (
          <span className="text-emerald-500 font-bold text-[10px] uppercase tracking-widest animate-fade-in whitespace-nowrap">Auto-saved</span>
        )}
      </div>

      {/* Groups */}
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
            <button
              onClick={handleAddGroup}
              className="group self-start flex items-center gap-2 px-4 py-2 border border-dashed border-indigo-100 rounded-xl text-indigo-500 hover:bg-indigo-50 hover:border-indigo-200 transition-all text-xs font-bold"
            >
              <div className="w-5 h-5 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <Plus size={12} strokeWidth={3} />
              </div>
              New Exercise Group
            </button>
          )}

          {/* Action Footer */}
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
              <div className="flex items-center gap-2 flex-wrap">
                <button 
                  onClick={handleSave} 
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-[10px] uppercase rounded-lg hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm"
                >
                  <Save size={14} /> Save Progress
                </button>
                {isConfirmingFinish ? (
                  <button 
                    onClick={() => {
                      handleComplete();
                      setIsConfirmingFinish(false);
                    }} 
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold text-[10px] uppercase rounded-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 animate-in fade-in zoom-in-95 duration-200"
                  >
                    <CheckCircle2 size={14} /> Confirm Finish
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      setIsConfirmingFinish(true);
                      setTimeout(() => setIsConfirmingFinish(false), 3000);
                    }} 
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-bold text-[10px] uppercase rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    <CheckCircle size={14} /> Finish Session
                  </button>
                )}
                <div className="w-px h-6 bg-slate-100 mx-1" />
                <button 
                  onClick={handleSkip} 
                  className="flex items-center gap-2 px-4 py-2 text-slate-400 font-bold text-[10px] uppercase rounded-lg hover:text-slate-900 transition-all"
                >
                  Skip
                </button>
                {saveFlash && <span className="text-emerald-500 font-bold text-[10px] animate-pulse">✓ Saved</span>}
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
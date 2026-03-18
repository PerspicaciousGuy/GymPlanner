import { useEffect, useMemo, useState, useCallback, memo } from 'react';
import { Trash2, Check, X, AlertCircle, History, Plus } from 'lucide-react';
import { formatDateCompact } from '../utils/dateUtils';
import {
  getMuscleGroupKeys,
  getSubMusclesForMuscle,
  getExercisesForSubMuscle,
  addExerciseWithSync,
  removeExerciseWithSync,
  findPreviousExerciseEntry,
  getExerciseOccurrenceCount,
} from '../utils/storage';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { Copy, Eraser, MoveRight } from 'lucide-react';
import { Button } from "@/components/ui/button";

const selectCls =
  'w-full border border-white/5 rounded-xl px-3 py-2 bg-white/5 text-foreground text-[11px] font-black uppercase tracking-tight focus:bg-white/10 focus:border-primary/30 outline-none transition-all disabled:opacity-30 appearance-none';

const inputCls =
  'w-full border border-white/5 rounded-xl px-3 py-2 bg-white/5 text-foreground text-[11px] font-black focus:bg-white/10 focus:border-primary/30 outline-none transition-all placeholder:text-slate-600';

const MUSCLE_GROUP_KEYS = getMuscleGroupKeys();

import { Stepper } from './ui/stepper';

/**
 * ExerciseRow — one full row or card of the exercise logger.
 * Handles both Desktop (tr) and Mobile (card) layouts.
 */
const ExerciseRow = memo(function ExerciseRow({ row, workoutDate, sessionKey, onChange, onDelete, layout = 'row' }) {
  const { muscle, subMuscle, exercise, sets, reps, weight, dropSets, dropWeight } = row;

  const [isAdding, setIsAdding] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [appliedHistoryDate, setAppliedHistoryDate] = useState('');
  const [dbVersion, setDbVersion] = useState(0);

  useEffect(() => {
    const handleDbChange = () => setDbVersion((v) => v + 1);
    window.addEventListener('gymplanner_db_changed', handleDbChange);
    return () => window.removeEventListener('gymplanner_db_changed', handleDbChange);
  }, []);

  const muscleGroupKeys = useMemo(() => getMuscleGroupKeys(), [dbVersion]);
  const subMuscles = useMemo(() => {
    return muscle ? getSubMusclesForMuscle(muscle) : [];
  }, [muscle, dbVersion]);
  const allExercises = useMemo(() => {
    return muscle && subMuscle ? getExercisesForSubMuscle(muscle, subMuscle) : [];
  }, [muscle, subMuscle, dbVersion]);

  const set = useCallback((patch) => onChange({ ...row, ...patch }), [row, onChange]);

  const previousEntry = useMemo(
    () => findPreviousExerciseEntry({ exercise, beforeDate: workoutDate, session: sessionKey }),
    [exercise, workoutDate, sessionKey]
  );

  const hasCurrentTrackedValues = [sets, reps, weight, dropSets, dropWeight].some(
    (value) => String(value || '').trim() !== ''
  );

  const occurrenceCount = useMemo(() => {
    if (!exercise || !reps || !weight) return 0;
    return getExerciseOccurrenceCount({ exercise, reps, weight, beforeDate: workoutDate });
  }, [exercise, reps, weight, workoutDate]);

  const applyPreviousValues = (entry) => {
    if (!entry) return;
    set({
      sets: entry.row.sets,
      reps: entry.row.reps,
      weight: entry.row.weight,
      dropSets: entry.row.dropSets,
      dropWeight: entry.row.dropWeight,
    });
    setAppliedHistoryDate(entry.date);
  };

  useEffect(() => {
    if (!exercise) {
      setAppliedHistoryDate('');
    }
  }, [exercise]);

  const handleMuscleChange = (value) =>
    set({ muscle: value, subMuscle: '', exercise: '' });

  const handleSubMuscleChange = (value) =>
    set({ subMuscle: value, exercise: '' });

  const handleExerciseChange = (value) => {
    if (value === '__ADD_NEW__') {
      setIsAdding(true);
      setNewExName('');
    } else {
      const entry = findPreviousExerciseEntry({ exercise: value, beforeDate: workoutDate, session: sessionKey });
      const nextPatch = { exercise: value };
      const canAutoFill = entry && !hasCurrentTrackedValues;
      if (canAutoFill) {
        nextPatch.sets = entry.row.sets;
        nextPatch.reps = entry.row.reps;
        nextPatch.weight = entry.row.weight;
        nextPatch.dropSets = entry.row.dropSets;
        nextPatch.dropWeight = entry.row.dropWeight;
        setAppliedHistoryDate(entry.date);
      } else {
        setAppliedHistoryDate('');
      }
      set(nextPatch);
    }
  };

  const handleConfirmNew = () => {
    const name = newExName.trim();
    if (!name) return;
    addExerciseWithSync(muscle, subMuscle, name);
    set({ exercise: name });
    setIsAdding(false);
    setNewExName('');
  };

  const handleCancelNew = () => {
    setIsAdding(false);
    setNewExName('');
  };

  const handleDeleteExercise = () => {
    if (!exercise) return;
    setConfirmingDelete(true);
  };

  const handleConfirmDelete = () => {
    removeExerciseWithSync(muscle, subMuscle, exercise);
    set({ exercise: '' });
    setConfirmingDelete(false);
  };

  const handleCancelDelete = () => setConfirmingDelete(false);

  const previousSummary = previousEntry
    ? [
        previousEntry.row.reps && `${previousEntry.row.reps} reps`,
        previousEntry.row.weight && `${previousEntry.row.weight} kg`,
        previousEntry.row.dropSets && `${previousEntry.row.dropSets} drop`,
        previousEntry.row.dropWeight && `${previousEntry.row.dropWeight} drop kg`,
      ].filter(Boolean).join(' • ')
    : '';

  const showHistoryRow = previousEntry && previousSummary;

  if (layout === 'card') {
    return (
      <TooltipProvider>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div className="p-5 bg-card border-b border-white/5 last:border-b-0 space-y-5 group/card relative">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-3">
                  {/* Muscle & Sub Selection */}
                  <div className="flex gap-2">
                    <select
                      value={muscle}
                      onChange={(e) => handleMuscleChange(e.target.value)}
                      className={selectCls + " !text-[10px] h-8"}
                    >
                      <option value="">— Muscle —</option>
                      {muscleGroupKeys.map((mg) => (
                        <option key={mg} value={mg}>{mg}</option>
                      ))}
                    </select>
                    <select
                      value={subMuscle}
                      onChange={(e) => handleSubMuscleChange(e.target.value)}
                      className={selectCls + " !text-[10px] h-8"}
                      disabled={!muscle}
                    >
                      <option value="">— Sub —</option>
                      {subMuscles.map((sm) => (
                        <option key={sm} value={sm}>{sm}</option>
                      ))}
                    </select>
                  </div>

                  {/* Exercise Selection */}
                  {isAdding ? (
                    <div className="flex gap-2 items-center bg-primary/5 p-2 rounded-2xl border border-primary/20 shadow-[0_0_20px_rgba(212,255,0,0.08)]">
                      <input
                        type="text"
                        autoFocus
                        value={newExName}
                        onChange={(e) => setNewExName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleConfirmNew();
                          if (e.key === 'Escape') handleCancelNew();
                        }}
                        placeholder="IDENTIFY DATA..."
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 h-10 text-[11px] font-black uppercase tracking-widest text-foreground focus:bg-white/10 focus:border-primary/40 outline-none transition-all placeholder:text-slate-700 italic"
                      />
                      <button onClick={handleConfirmNew} className="p-2.5 text-primary hover:bg-primary/20 rounded-xl transition-all"><Check size={20} strokeWidth={4} /></button>
                      <button onClick={handleCancelNew} className="p-2.5 text-slate-700 hover:bg-white/5 rounded-xl transition-all"><X size={20} strokeWidth={4} /></button>
                    </div>
                  ) : confirmingDelete ? (
                    <div className="flex items-center justify-between rounded-2xl border border-red-500/20 bg-red-500/5 p-3 animate-in slide-in-from-top-2 duration-300">
                      <span className="text-red-500 font-black text-[10px] uppercase tracking-widest px-2 italic">PURGE "{exercise}"?</span>
                      <div className="flex gap-2">
                        <button onClick={handleConfirmDelete} className="bg-red-500 text-white p-2 rounded-xl shadow-lg shadow-red-500/20 hover:scale-110 transition-transform"><Check size={14} strokeWidth={4} /></button>
                        <button onClick={handleCancelDelete} className="bg-white/5 text-slate-500 border border-white/5 p-2 rounded-xl hover:bg-white/10 transition-all"><X size={14} strokeWidth={4} /></button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 items-center">
                      <select
                        value={exercise}
                        onChange={(e) => handleExerciseChange(e.target.value)}
                        className={selectCls + ' flex-1 !text-primary !text-sm h-12 shadow-inner border-white/5'}
                        disabled={!subMuscle}
                      >
                        <option value="">— Select Exercise —</option>
                        {allExercises.map((ex) => (
                          <option key={ex} value={ex} className="bg-card text-foreground">{ex}</option>
                        ))}
                        {subMuscle && <option value="__ADD_NEW__" className="bg-card text-primary font-black italic">＋ NEW TRAINING DATA</option>}
                      </select>
                      {exercise && (
                        <button onClick={handleDeleteExercise} className="p-2 text-slate-300 hover:text-red-500 transition-all">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={onDelete}
                  className="p-3 rounded-2xl text-slate-700 hover:text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20 active:scale-90"
                >
                  <Trash2 size={20} strokeWidth={3} />
                </button>
              </div>

              {/* Logging Controls - Stacked for better readability */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Sets x Reps</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      inputMode="text"
                      value={sets}
                      onChange={(e) => set({ sets: e.target.value })}
                      placeholder="0"
                      className={inputCls + ' text-center h-14 !text-lg !font-black !w-24 shadow-inner border-white/5'}
                    />
                    <span className="text-slate-300 font-bold text-lg">×</span>
                    <Stepper 
                      value={reps} 
                      onChange={(v) => set({ reps: v })} 
                      className="flex-1 h-14" 
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Weight (kg)</label>
                  <Stepper 
                    value={weight} 
                    onChange={(v) => set({ weight: v })} 
                    className="h-14" 
                    step={2.5}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">Drop Load (Reps x Weight)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      inputMode="text"
                      value={dropSets}
                      onChange={(e) => set({ dropSets: e.target.value })}
                      placeholder="0"
                      className={inputCls + ' text-center h-14 !text-lg !font-black !w-24 !text-slate-500 !border-white/5'}
                    />
                    <span className="text-slate-800 font-bold text-xl">×</span>
                    <Stepper 
                      value={dropWeight} 
                      onChange={(v) => set({ dropWeight: v })} 
                      className="flex-1 h-14 !border-white/5" 
                      placeholder="0"
                      step={2.5}
                    />
                  </div>
                </div>
              </div>

              {/* Enhanced Visual Separator between cards */}
              <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-slate-100" />

              {/* History Badge for Card */}
              {showHistoryRow && (
                <div className="mt-2 p-5 bg-white/2 rounded-[2rem] border border-white/5 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-2xl relative overflow-hidden group/history">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover/history:opacity-100 transition-opacity" />
                  
                  <div className="flex items-center justify-between gap-4 relative z-10">
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">
                      <History size={16} className="text-primary/40 shrink-0" strokeWidth={3} />
                      <span className="truncate leading-none">
                        {formatDateCompact(previousEntry.date)} <div className="inline-block w-1.5 h-1.5 rounded-full bg-slate-800 mx-1" /> <span className="text-slate-400">{previousSummary}</span>
                      </span>
                    </div>
                    {occurrenceCount > 0 && (
                      <div className="bg-primary/10 text-primary font-black px-3 py-1 rounded-xl text-[9px] uppercase tracking-[0.3em] border border-primary/20 shrink-0 shadow-[0_0_15px_rgba(212,255,0,0.1)]">
                        {occurrenceCount}X PRIOR
                      </div>
                    )}
                  </div>
                  {appliedHistoryDate !== previousEntry.date && (
                    <Button
                      onClick={() => applyPreviousValues(previousEntry)}
                      variant="outline"
                      className="w-full h-14 border-white/5 bg-white/5 text-primary-foreground rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shadow-xl italic"
                    >
                      SYNCHRONIZE VECTOR
                    </Button>
                  )}
                </div>
              )}
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-64 rounded-2xl shadow-2xl border-white/5 bg-card/95 backdrop-blur-2xl p-2 animate-in fade-in zoom-in-95 duration-200">
            <ContextMenuItem 
              onClick={() => onChange({ ...row, sets: '', reps: '', weight: '', dropSets: '', dropWeight: '' })}
              className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-slate-500 focus:text-primary focus:bg-white/10 rounded-xl cursor-pointer p-4 transition-all"
            >
              <Eraser size={16} strokeWidth={3} /> Purge Load Values
            </ContextMenuItem>
            <ContextMenuSeparator className="bg-white/5 my-1" />
            <ContextMenuItem 
              onClick={() => onChange({ ...row, id: crypto.randomUUID() })} 
              className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-slate-500 focus:text-primary focus:bg-white/10 rounded-xl cursor-pointer p-4 transition-all"
            >
              <Copy size={16} strokeWidth={3} /> Replicate Vector
            </ContextMenuItem>
            <ContextMenuItem className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-slate-500 focus:text-primary focus:bg-white/10 rounded-xl cursor-pointer p-4 transition-all">
              <MoveRight size={16} strokeWidth={3} /> Migrate to {sessionKey === 'am' ? 'OMEGA' : 'ALPHA'}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <tr className="hover:bg-white/5 transition-all group/row border-b border-white/5 last:border-b-0">
        {/* Muscle Group */}
        <td className="px-3 py-1.5 min-w-[130px]">
          <select
            value={muscle}
            onChange={(e) => handleMuscleChange(e.target.value)}
            className={selectCls}
          >
            <option value="">— Muscle —</option>
            {muscleGroupKeys.map((mg) => (
              <option key={mg} value={mg}>
                {mg}
              </option>
            ))}
          </select>
        </td>

        {/* Sub Muscle */}
        <td className="px-3 py-1.5 min-w-[130px]">
          <select
            value={subMuscle}
            onChange={(e) => handleSubMuscleChange(e.target.value)}
            className={selectCls}
            disabled={!muscle}
          >
            <option value="">— Sub —</option>
            {subMuscles.map((sm) => (
              <option key={sm} value={sm}>
                {sm}
              </option>
            ))}
          </select>
        </td>

        {/* Exercise */}
        <td className="px-3 py-1.5 min-w-[200px]">
          {isAdding ? (
            <div className="flex gap-2 items-center px-1">
              <input
                type="text"
                autoFocus
                value={newExName}
                onChange={(e) => setNewExName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmNew();
                  if (e.key === 'Escape') handleCancelNew();
                }}
                placeholder="ENTRY..."
                className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-foreground focus:bg-white/10 focus:border-primary/40 outline-none transition-all placeholder:text-slate-700 italic"
              />
              <button onClick={handleConfirmNew} className="p-1.5 text-primary hover:bg-primary/20 rounded-lg transition-all" title="Confirm Integration"><Check size={14} strokeWidth={4} /></button>
              <button onClick={handleCancelNew} className="p-1.5 text-slate-700 hover:bg-white/5 rounded-lg transition-all" title="Bypass"><X size={14} strokeWidth={4} /></button>
            </div>
          ) : confirmingDelete ? (
            <div className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-1 animate-in fade-in duration-300">
              <span className="text-red-500 font-black text-[9px] uppercase tracking-tighter truncate max-w-[100px] italic">PURGE?</span>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={handleConfirmDelete} className="text-red-500 hover:bg-red-500/10 p-1 rounded-lg transition-all"><Check size={12} strokeWidth={4} /></button>
                <button onClick={handleCancelDelete} className="text-slate-700 hover:bg-white/5 p-1 rounded-lg transition-all"><X size={12} strokeWidth={4} /></button>
              </div>
            </div>
          ) : (
            <div className="flex gap-1 items-center">
              <select
                value={exercise}
                onChange={(e) => handleExerciseChange(e.target.value)}
                className={selectCls + ' flex-1 !text-primary focus:bg-white/5'}
                disabled={!subMuscle}
              >
                <option value="">— Exercise —</option>
                {allExercises.map((ex) => (
                  <option key={ex} value={ex} className="bg-card text-foreground">{ex}</option>
                ))}
                {subMuscle && <option value="__ADD_NEW__" className="bg-card text-primary font-black italic">＋ NEW TRAINING DATA</option>}
              </select>
              {exercise && (
                <Tooltip delayDuration={500}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleDeleteExercise}
                      className="opacity-0 group-hover/row:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all rounded shadow-sm hover:shadow-md"
                    >
                      <Trash2 size={12} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-[9px] font-bold bg-slate-900 border-none px-2 py-1 text-white">
                    Remove from Database
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
        </td>

        {/* Sets */}
        <td className="px-3 py-1.5 min-w-[70px]">
          <input
            type="text"
            value={sets}
            onChange={(e) => set({ sets: e.target.value })}
            placeholder="0"
            className={inputCls + ' text-center'}
          />
        </td>

        {/* Reps */}
        <td className="px-3 py-1.5 min-w-[70px]">
          <input
            type="text"
            value={reps}
            onChange={(e) => set({ reps: e.target.value })}
            placeholder="0"
            className={inputCls + ' text-center'}
          />
        </td>

        {/* Weight */}
        <td className="px-3 py-1.5 min-w-[90px]">
          <input
            type="text"
            value={weight}
            onChange={(e) => set({ weight: e.target.value })}
            placeholder="0"
            className={inputCls + ' text-center !text-primary !font-black'}
          />
        </td>

        {/* Drop Set */}
        <td className="px-3 py-1.5 min-w-[80px]">
          <input
            type="text"
            value={dropSets}
            onChange={(e) => set({ dropSets: e.target.value })}
            placeholder="0"
            className={inputCls + ' text-center !text-slate-400 font-medium'}
          />
        </td>

        {/* Drop Weight */}
        <td className="px-3 py-1.5 min-w-[100px]">
          <input
            type="text"
            value={dropWeight}
            onChange={(e) => set({ dropWeight: e.target.value })}
            placeholder="0"
            className={inputCls + ' text-center !text-slate-400 font-medium'}
          />
        </td>

        {/* Delete Row */}
        <td className="px-2 py-1.5 text-center">
          <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>
              <button
                onClick={onDelete}
                className="p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <Trash2 size={13} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[9px] font-bold bg-slate-900 border-none px-2 py-1 text-white">
              Delete Row
            </TooltipContent>
          </Tooltip>
        </td>
      </tr>

        </ContextMenuTrigger>

        {showHistoryRow && (
          <tr className="bg-white/2 border-b border-white/5">
            <td colSpan={9} className="px-6 py-2.5 text-[9px] text-slate-600 font-black uppercase tracking-[0.3em] italic">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <div className="flex items-center gap-3">
                  <History size={12} className="text-primary/40" strokeWidth={3} />
                  <span className="leading-none">
                    {appliedHistoryDate === previousEntry.date ? 'COUPLED TO' : 'ARCHIVED LOAD:'} <span className="text-slate-500 ml-1">{formatDateCompact(previousEntry.date)}</span>
                    {previousEntry.session ? ` [${previousEntry.session === 'am' ? 'ALPHA' : 'OMEGA'}]` : ''}
                    <span className="text-primary/60 ml-3">{previousSummary}</span>
                  </span>
                </div>
                {occurrenceCount > 0 && (
                  <div className="flex items-center gap-1.5 bg-primary/10 text-primary font-black px-3 py-1 rounded-xl text-[8px] uppercase tracking-[0.3em] shadow-inner border border-primary/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_#d4ff00]" />
                    {occurrenceCount}X PRIOR SUCCESS
                  </div>
                )}
                {appliedHistoryDate !== previousEntry.date && (
                  <button
                    onClick={() => applyPreviousValues(previousEntry)}
                    className="font-black text-primary hover:text-white transition-all uppercase tracking-[0.4em] text-[8px] flex items-center gap-2 group/apply"
                    type="button"
                  >
                    <Plus size={10} className="group-hover/apply:rotate-90 transition-transform" strokeWidth={4} />
                    MAP TO ACTIVE VECTOR
                  </button>
                )}
              </div>
            </td>
          </tr>
        )}
        <ContextMenuContent className="w-64 rounded-2xl shadow-2xl border-white/5 bg-card/95 backdrop-blur-2xl p-2 animate-in fade-in zoom-in-95 duration-200">
          <ContextMenuItem 
            onClick={() => onChange({ ...row, sets: '', reps: '', weight: '', dropSets: '', dropWeight: '' })}
            className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-slate-500 focus:text-primary focus:bg-white/10 rounded-xl cursor-pointer p-4 transition-all"
          >
            <Eraser size={16} strokeWidth={3} /> Purge Load Values
          </ContextMenuItem>
          <ContextMenuSeparator className="bg-white/5 my-1" />
          <ContextMenuItem 
            onClick={() => {
              // Replicate vector logic can be handled by parent or here if ID is managed
              onChange({ ...row, id: crypto.randomUUID() });
            }} 
            className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-slate-500 focus:text-primary focus:bg-white/10 rounded-xl cursor-pointer p-4 transition-all"
          >
            <Copy size={16} strokeWidth={3} /> Replicate Vector
          </ContextMenuItem>
          <ContextMenuItem className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-slate-500 focus:text-primary focus:bg-white/10 rounded-xl cursor-pointer p-4 transition-all">
            <MoveRight size={16} strokeWidth={3} /> Migrate to {sessionKey === 'am' ? 'OMEGA' : 'ALPHA'}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </TooltipProvider>
  );
});

export default ExerciseRow;

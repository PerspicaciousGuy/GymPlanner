import { useEffect, useMemo, useState } from 'react';
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

const selectCls =
  'w-full border border-slate-200 rounded-lg px-2 py-1 bg-transparent text-slate-700 text-[11px] font-bold focus:bg-white focus:border-indigo-200 outline-none transition-all disabled:opacity-30';

const inputCls =
  'w-full border border-slate-200 rounded-lg px-2 py-1 bg-transparent text-slate-700 text-[11px] font-bold focus:bg-white focus:border-indigo-200 outline-none transition-all placeholder:text-slate-300';

import { Stepper } from './ui/stepper';

/**
 * ExerciseRow — one full row or card of the exercise logger.
 * Handles both Desktop (tr) and Mobile (card) layouts.
 */
export default function ExerciseRow({ row, workoutDate, sessionKey, onChange, onDelete, layout = 'row' }) {
  const { muscle, subMuscle, exercise, sets, reps, weight, dropSets, dropWeight } = row;

  const [isAdding, setIsAdding] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [appliedHistoryDate, setAppliedHistoryDate] = useState('');

  const muscleGroupKeys = getMuscleGroupKeys();
  const subMuscles = muscle ? getSubMusclesForMuscle(muscle) : [];
  const allExercises = muscle && subMuscle ? getExercisesForSubMuscle(muscle, subMuscle) : [];

  const set = (patch) => onChange({ ...row, ...patch });

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
        previousEntry.row.sets && `${previousEntry.row.sets} sets`,
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
            <div className="p-4 bg-white border-b border-slate-50 last:border-b-0 space-y-4 group/card relative">
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
                    <div className="flex gap-1 items-center bg-indigo-50/30 p-1 rounded-xl border border-indigo-100">
                      <input
                        type="text"
                        autoFocus
                        value={newExName}
                        onChange={(e) => setNewExName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleConfirmNew();
                          if (e.key === 'Escape') handleCancelNew();
                        }}
                        placeholder="New exercise name..."
                        className={inputCls + ' !bg-white !border-indigo-200 !text-sm h-9'}
                      />
                      <button onClick={handleConfirmNew} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg"><Check size={18} strokeWidth={3} /></button>
                      <button onClick={handleCancelNew} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"><X size={18} strokeWidth={3} /></button>
                    </div>
                  ) : confirmingDelete ? (
                    <div className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50 p-2 animate-in slide-in-from-top-1 duration-200">
                      <span className="text-red-700 font-bold text-xs uppercase">Delete "{exercise}"?</span>
                      <div className="flex gap-2">
                        <button onClick={handleConfirmDelete} className="bg-red-500 text-white p-1.5 rounded-lg shadow-sm"><Check size={14} strokeWidth={3} /></button>
                        <button onClick={handleCancelDelete} className="bg-white text-slate-500 border border-red-100 p-1.5 rounded-lg shadow-sm"><X size={14} strokeWidth={3} /></button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 items-center">
                      <select
                        value={exercise}
                        onChange={(e) => handleExerciseChange(e.target.value)}
                        className={selectCls + ' flex-1 !text-indigo-600 !text-sm h-10 shadow-sm border-slate-100'}
                        disabled={!subMuscle}
                      >
                        <option value="">— Select Exercise —</option>
                        {allExercises.map((ex) => (
                          <option key={ex} value={ex}>{ex}</option>
                        ))}
                        {subMuscle && <option value="__ADD_NEW__" className="text-indigo-600 font-bold italic">＋ ADD NEW EXERCISE</option>}
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
                  className="p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Logging Controls - Stacked for better readability */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Sets x Reps</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={sets}
                      onChange={(e) => set({ sets: e.target.value })}
                      placeholder="0"
                      className={inputCls + ' text-center h-12 !text-base !font-black !w-20 shadow-sm border-slate-100'}
                    />
                    <span className="text-slate-300 font-bold text-lg">×</span>
                    <Stepper 
                      value={reps} 
                      onChange={(v) => set({ reps: v })} 
                      className="flex-1 h-12" 
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Weight (kg)</label>
                  <Stepper 
                    value={weight} 
                    onChange={(v) => set({ weight: v })} 
                    className="h-12" 
                    step={2.5}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1 text-slate-300">Drop Set (Sets x Weight)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={dropSets}
                      onChange={(e) => set({ dropSets: e.target.value })}
                      placeholder="0"
                      className={inputCls + ' text-center h-12 !text-base !font-black !w-20 !text-slate-400 !border-slate-100'}
                    />
                    <span className="text-slate-200 font-bold text-lg">×</span>
                    <Stepper 
                      value={dropWeight} 
                      onChange={(v) => set({ dropWeight: v })} 
                      className="flex-1 h-12 !border-slate-100" 
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
                <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100/50 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                      <History size={12} className="text-slate-300" />
                      <span>{formatDateCompact(previousEntry.date)}: {previousSummary}</span>
                    </div>
                    {occurrenceCount > 0 && (
                      <div className="bg-indigo-50 text-indigo-600 font-black px-1.5 py-0.5 rounded text-[8px] uppercase tracking-tighter">
                        Done {occurrenceCount}x before
                      </div>
                    )}
                  </div>
                  {appliedHistoryDate !== previousEntry.date && (
                    <button
                      onClick={() => applyPreviousValues(previousEntry)}
                      className="w-full py-1.5 bg-white border border-indigo-100 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-colors"
                    >
                      Apply Last Values
                    </button>
                  )}
                </div>
              )}
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-56 rounded-xl shadow-xl border-slate-200">
            <ContextMenuItem 
              onClick={() => onChange({ ...row, sets: '', reps: '', weight: '', dropSets: '', dropWeight: '' })}
              className="flex items-center gap-2 text-xs font-bold text-slate-600 focus:text-indigo-600 focus:bg-indigo-50 rounded-lg cursor-pointer"
            >
              <Eraser size={14} /> Clear All Values
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem 
              onClick={() => onChange({ ...row, id: crypto.randomUUID() })} 
              className="flex items-center gap-2 text-xs font-bold text-slate-600 focus:text-indigo-600 focus:bg-indigo-50 rounded-lg cursor-pointer"
            >
              <Copy size={14} /> Duplicate Row
            </ContextMenuItem>
            <ContextMenuItem className="flex items-center gap-2 text-xs font-bold text-slate-600 focus:text-indigo-600 focus:bg-indigo-50 rounded-lg cursor-pointer">
              <MoveRight size={14} /> Move to {sessionKey === 'am' ? 'PM' : 'AM'} Session
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
          <tr className="hover:bg-slate-50/50 transition-colors group/row">
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
            <div className="flex gap-1 items-center px-1">
              <input
                type="text"
                autoFocus
                value={newExName}
                onChange={(e) => setNewExName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmNew();
                  if (e.key === 'Escape') handleCancelNew();
                }}
                placeholder="Name..."
                className={inputCls + ' !bg-white !border-indigo-200'}
              />
              <button onClick={handleConfirmNew} className="p-1 text-emerald-500 hover:bg-emerald-50 rounded" title="Confirm"><Check size={12} strokeWidth={3} /></button>
              <button onClick={handleCancelNew} className="p-1 text-slate-400 hover:bg-slate-100 rounded" title="Cancel"><X size={12} strokeWidth={3} /></button>
            </div>
          ) : confirmingDelete ? (
            <div className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 px-2 py-0.5 animate-in fade-in duration-200">
              <span className="text-red-700 font-bold text-[10px] uppercase truncate max-w-[100px]">Delete "{exercise}"?</span>
              <div className="flex gap-1 shrink-0">
                <button onClick={handleConfirmDelete} className="text-red-600 hover:bg-red-100 p-0.5 rounded"><Check size={10} strokeWidth={3} /></button>
                <button onClick={handleCancelDelete} className="text-slate-500 hover:bg-white p-0.5 rounded"><X size={10} strokeWidth={3} /></button>
              </div>
            </div>
          ) : (
            <div className="flex gap-1 items-center">
              <select
                value={exercise}
                onChange={(e) => handleExerciseChange(e.target.value)}
                className={selectCls + ' flex-1 !text-indigo-600'}
                disabled={!subMuscle}
              >
                <option value="">— Exercise —</option>
                {allExercises.map((ex) => (
                  <option key={ex} value={ex}>
                    {ex}
                  </option>
                ))}
                {subMuscle && <option value="__ADD_NEW__" className="text-indigo-600 font-bold italic">＋ NEW EXERCISE</option>}
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
            className={inputCls + ' text-center !text-indigo-600'}
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
          <tr className="bg-slate-50/30">
            <td colSpan={9} className="px-3 py-1 text-[10px] text-slate-400 italic">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <div className="flex items-center gap-1">
                  <History size={10} className="text-slate-300" />
                  <span>
                    {appliedHistoryDate === previousEntry.date ? 'Pre-filled from' : 'Last activity:'} {formatDateCompact(previousEntry.date)}
                    {previousEntry.session ? ` (${previousEntry.session.toUpperCase()})` : ''}
                    {' '}• {previousSummary}
                  </span>
                </div>
                {occurrenceCount > 0 && (
                  <div className="flex items-center gap-1 bg-indigo-50/50 text-indigo-500 font-black px-1.5 py-0.5 rounded text-[8px] uppercase tracking-tighter shadow-sm border border-indigo-100/30">
                    Done {occurrenceCount}x before
                  </div>
                )}
                {appliedHistoryDate !== previousEntry.date && (
                  <button
                    onClick={() => applyPreviousValues(previousEntry)}
                    className="font-bold text-indigo-500 hover:text-indigo-700 uppercase tracking-tighter hover:underline"
                    type="button"
                  >
                    APPLY LAST VALUES
                  </button>
                )}
              </div>
            </td>
          </tr>
        )}
        <ContextMenuContent className="w-56 rounded-xl shadow-xl border-slate-200">
          <ContextMenuItem 
            onClick={() => onChange({ ...row, sets: '', reps: '', weight: '', dropSets: '', dropWeight: '' })}
            className="flex items-center gap-2 text-xs font-bold text-slate-600 focus:text-indigo-600 focus:bg-indigo-50 rounded-lg cursor-pointer"
          >
            <Eraser size={14} /> Clear All Values
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem 
            onClick={() => {
              // Duplication logic would go here
            }} 
            className="flex items-center gap-2 text-xs font-bold text-slate-600 focus:text-indigo-600 focus:bg-indigo-50 rounded-lg cursor-pointer"
          >
            <Copy size={14} /> Duplicate Row
          </ContextMenuItem>
          <ContextMenuItem className="flex items-center gap-2 text-xs font-bold text-slate-600 focus:text-indigo-600 focus:bg-indigo-50 rounded-lg cursor-pointer">
            <MoveRight size={14} /> Move to {sessionKey === 'am' ? 'PM' : 'AM'} Session
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </TooltipProvider>
  );
}

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

/**
 * ExerciseRow — one full row of the exercise table.
 * Columns: Muscle Group | Sub Muscle | Exercise | Sets | Reps | Weight
 *
 * Props:
 *   row      – { muscle, subMuscle, exercise, sets, reps, weight }
 *   onChange – (updatedRow) => void
 */
export default function ExerciseRow({ row, workoutDate, sessionKey, onChange, onDelete }) {
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

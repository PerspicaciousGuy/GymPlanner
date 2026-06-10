import { Check, Copy, Eraser, History, MoveRight, Trash2, X } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDateCompact } from '../../utils/dateUtils';
import { inputCls, selectCls } from './exerciseRowStyles';

export default function ExerciseRowTableLayout({
  row,
  muscle,
  subMuscle,
  exercise,
  sets,
  reps,
  weight,
  dropSets,
  dropWeight,
  muscleGroupKeys,
  subMuscles,
  allExercises,
  isAdding,
  newExName,
  setNewExName,
  confirmingDelete,
  appliedHistoryDate,
  previousEntry,
  previousSummary,
  showHistoryRow,
  occurrenceCount,
  sessionKey,
  setRow,
  onChange,
  onDelete,
  handleMuscleChange,
  handleSubMuscleChange,
  handleExerciseChange,
  handleConfirmNew,
  handleCancelNew,
  handleDeleteExercise,
  handleConfirmDelete,
  handleCancelDelete,
  applyPreviousValues,
}) {
  return (
    <TooltipProvider>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <tr className="group/row transition-colors hover:bg-[var(--app-surface-muted)]">
            <td className="px-3 py-1.5 min-w-[130px]">
              <select
                value={muscle}
                onChange={(event) => handleMuscleChange(event.target.value)}
                className={selectCls}
              >
                <option value="">- Muscle -</option>
                {muscleGroupKeys.map((muscleGroup) => (
                  <option key={muscleGroup} value={muscleGroup}>
                    {muscleGroup}
                  </option>
                ))}
              </select>
            </td>

            <td className="px-3 py-1.5 min-w-[130px]">
              <select
                value={subMuscle}
                onChange={(event) => handleSubMuscleChange(event.target.value)}
                className={selectCls}
                disabled={!muscle}
              >
                <option value="">- Sub -</option>
                {subMuscles.map((subMuscleName) => (
                  <option key={subMuscleName} value={subMuscleName}>
                    {subMuscleName}
                  </option>
                ))}
              </select>
            </td>

            <td className="px-3 py-1.5 min-w-[200px]">
              {isAdding ? (
                <div className="flex gap-1 items-center px-1">
                  <input
                    type="text"
                    autoFocus
                    value={newExName}
                    onChange={(event) => setNewExName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') handleConfirmNew();
                      if (event.key === 'Escape') handleCancelNew();
                    }}
                    placeholder="Name..."
                    className={inputCls + ' !bg-[var(--app-surface)]'}
                  />
                  <button onClick={handleConfirmNew} className="rounded-[var(--app-radius-sm)] p-1 text-foreground transition-colors hover:bg-[var(--app-surface-muted)]" title="Confirm"><Check size={12} strokeWidth={3} /></button>
                  <button onClick={handleCancelNew} className="rounded-[var(--app-radius-sm)] p-1 text-muted-foreground transition-colors hover:bg-[var(--app-surface-muted)] hover:text-foreground" title="Cancel"><X size={12} strokeWidth={3} /></button>
                </div>
              ) : confirmingDelete ? (
                <div className="flex items-center justify-between rounded-[var(--app-radius-sm)] border border-destructive/20 bg-destructive/10 px-2 py-0.5 animate-in fade-in duration-200">
                  <span className="max-w-[100px] truncate text-[10px] font-semibold uppercase text-destructive">Delete "{exercise}"?</span>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={handleConfirmDelete} className="rounded p-0.5 text-destructive hover:bg-destructive/10"><Check size={10} strokeWidth={3} /></button>
                    <button onClick={handleCancelDelete} className="rounded p-0.5 text-muted-foreground hover:bg-[var(--app-surface)]"><X size={10} strokeWidth={3} /></button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-1 items-center">
                  <select
                    value={exercise}
                    onChange={(event) => handleExerciseChange(event.target.value)}
                    className={selectCls + ' flex-1'}
                    disabled={!subMuscle}
                  >
                    <option value="">- Exercise -</option>
                    {allExercises.map((exerciseName) => (
                      <option key={exerciseName} value={exerciseName}>
                        {exerciseName}
                      </option>
                    ))}
                    {subMuscle && <option value="__ADD_NEW__" className="font-semibold italic text-foreground">+ NEW EXERCISE</option>}
                  </select>
                  {exercise && (
                    <Tooltip delayDuration={500}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={handleDeleteExercise}
                          className="rounded p-1 text-muted-foreground opacity-0 transition-colors hover:text-destructive group-hover/row:opacity-100"
                        >
                          <Trash2 size={12} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="border-none bg-foreground px-2 py-1 text-[9px] font-semibold text-background">
                        Remove from Database
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              )}
            </td>

            <td className="px-3 py-1.5 min-w-[70px]">
              <input
                type="text"
                value={sets}
                onChange={(event) => setRow({ sets: event.target.value })}
                placeholder="0"
                className={inputCls + ' text-center'}
              />
            </td>

            <td className="px-3 py-1.5 min-w-[70px]">
              <input
                type="text"
                value={reps}
                onChange={(event) => setRow({ reps: event.target.value })}
                placeholder="0"
                className={inputCls + ' text-center'}
              />
            </td>

            <td className="px-3 py-1.5 min-w-[90px]">
              <input
                type="text"
                value={weight}
                onChange={(event) => setRow({ weight: event.target.value })}
                placeholder="0"
                className={inputCls + ' text-center'}
              />
            </td>

            <td className="px-3 py-1.5 min-w-[80px]">
              <input
                type="text"
                value={dropSets}
                onChange={(event) => setRow({ dropSets: event.target.value })}
                placeholder="0"
                className={inputCls + ' text-center font-medium'}
              />
            </td>

            <td className="px-3 py-1.5 min-w-[100px]">
              <input
                type="text"
                value={dropWeight}
                onChange={(event) => setRow({ dropWeight: event.target.value })}
                placeholder="0"
                className={inputCls + ' text-center font-medium'}
              />
            </td>

            <td className="px-2 py-1.5 text-center">
              <Tooltip delayDuration={500}>
                <TooltipTrigger asChild>
                  <button
                    onClick={onDelete}
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 size={13} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="border-none bg-foreground px-2 py-1 text-[9px] font-semibold text-background">
                  Delete Row
                </TooltipContent>
              </Tooltip>
            </td>
          </tr>
        </ContextMenuTrigger>

        {showHistoryRow && (
          <tr className="bg-[var(--app-surface-muted)]">
            <td colSpan={9} className="px-3 py-1 text-[10px] italic text-muted-foreground">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <div className="flex items-center gap-1">
                  <History size={10} />
                  <span>
                    {appliedHistoryDate === previousEntry.date ? 'Pre-filled from' : 'Last activity:'} {formatDateCompact(previousEntry.date)}
                    {previousEntry.session ? ` (${previousEntry.session.toUpperCase()})` : ''}
                    {' '} - {previousSummary}
                  </span>
                </div>
                {occurrenceCount > 0 && (
                  <div className="flex items-center gap-1 rounded-[var(--app-radius-sm)] border border-[var(--app-border)] bg-[var(--app-surface)] px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-normal text-muted-foreground shadow-[var(--app-shadow-sm)]">
                    Done {occurrenceCount}x before
                  </div>
                )}
                {appliedHistoryDate !== previousEntry.date && (
                  <button
                    onClick={() => applyPreviousValues(previousEntry)}
                    className="font-semibold uppercase tracking-normal text-foreground underline-offset-2 hover:underline"
                    type="button"
                  >
                    APPLY LAST VALUES
                  </button>
                )}
              </div>
            </td>
          </tr>
        )}
        <ContextMenuContent className="w-56 rounded-[var(--app-radius-md)] border-[var(--app-border)] shadow-[var(--app-shadow-md)]">
          <ContextMenuItem
            onClick={() => onChange({ ...row, sets: '', reps: '', weight: '', dropSets: '', dropWeight: '' })}
            className="flex cursor-pointer items-center gap-2 rounded-[var(--app-radius-sm)] text-xs font-semibold text-muted-foreground focus:bg-[var(--app-surface-muted)] focus:text-foreground"
          >
            <Eraser size={14} /> Clear All Values
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => {}}
            className="flex cursor-pointer items-center gap-2 rounded-[var(--app-radius-sm)] text-xs font-semibold text-muted-foreground focus:bg-[var(--app-surface-muted)] focus:text-foreground"
          >
            <Copy size={14} /> Duplicate Row
          </ContextMenuItem>
          <ContextMenuItem className="flex cursor-pointer items-center gap-2 rounded-[var(--app-radius-sm)] text-xs font-semibold text-muted-foreground focus:bg-[var(--app-surface-muted)] focus:text-foreground">
            <MoveRight size={14} /> Move to {sessionKey === 'am' ? 'PM' : 'AM'} Session
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </TooltipProvider>
  );
}

import { Check, Copy, Eraser, History, MoveRight, Trash2, X } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Stepper } from '../ui/stepper';
import { formatDateCompact } from '../../utils/dateUtils';
import { inputCls, selectCls } from './exerciseRowStyles';

export default function ExerciseRowCardLayout({
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
          <div className="group/card relative space-y-4 border-b border-[var(--app-border)] bg-[var(--app-surface)] p-4 last:border-b-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-3">
                <div className="flex gap-2">
                  <select
                    value={muscle}
                    onChange={(event) => handleMuscleChange(event.target.value)}
                    className={selectCls + " !h-8 !text-[10px]"}
                  >
                    <option value="">- Muscle -</option>
                    {muscleGroupKeys.map((muscleGroup) => (
                      <option key={muscleGroup} value={muscleGroup}>{muscleGroup}</option>
                    ))}
                  </select>
                  <select
                    value={subMuscle}
                    onChange={(event) => handleSubMuscleChange(event.target.value)}
                    className={selectCls + " !h-8 !text-[10px]"}
                    disabled={!muscle}
                  >
                    <option value="">- Sub -</option>
                    {subMuscles.map((subMuscleName) => (
                      <option key={subMuscleName} value={subMuscleName}>{subMuscleName}</option>
                    ))}
                  </select>
                </div>

                {isAdding ? (
                  <div className="flex items-center gap-1 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-1">
                    <input
                      type="text"
                      autoFocus
                      value={newExName}
                      onChange={(event) => setNewExName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') handleConfirmNew();
                        if (event.key === 'Escape') handleCancelNew();
                      }}
                      placeholder="New exercise name..."
                      className={inputCls + ' !h-9 !bg-[var(--app-surface)] !text-sm'}
                    />
                    <button onClick={handleConfirmNew} className="rounded-[var(--app-radius-sm)] p-2 text-foreground transition-colors hover:bg-[var(--app-surface)]"><Check size={18} strokeWidth={3} /></button>
                    <button onClick={handleCancelNew} className="rounded-[var(--app-radius-sm)] p-2 text-muted-foreground transition-colors hover:bg-[var(--app-surface)] hover:text-foreground"><X size={18} strokeWidth={3} /></button>
                  </div>
                ) : confirmingDelete ? (
                  <div className="flex items-center justify-between rounded-[var(--app-radius-md)] border border-destructive/20 bg-destructive/10 p-2 animate-in slide-in-from-top-1 duration-200">
                    <span className="text-xs font-semibold uppercase text-destructive">Delete "{exercise}"?</span>
                    <div className="flex gap-2">
                      <button onClick={handleConfirmDelete} className="rounded-[var(--app-radius-sm)] bg-destructive p-1.5 text-destructive-foreground shadow-[var(--app-shadow-sm)]"><Check size={14} strokeWidth={3} /></button>
                      <button onClick={handleCancelDelete} className="rounded-[var(--app-radius-sm)] border border-[var(--app-border)] bg-[var(--app-surface)] p-1.5 text-muted-foreground shadow-[var(--app-shadow-sm)]"><X size={14} strokeWidth={3} /></button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 items-center">
                    <select
                      value={exercise}
                      onChange={(event) => handleExerciseChange(event.target.value)}
                      className={selectCls + ' h-10 flex-1 !text-sm shadow-[var(--app-shadow-sm)]'}
                      disabled={!subMuscle}
                    >
                      <option value="">- Select Exercise -</option>
                      {allExercises.map((exerciseName) => (
                        <option key={exerciseName} value={exerciseName}>{exerciseName}</option>
                      ))}
                      {subMuscle && <option value="__ADD_NEW__" className="font-semibold italic text-foreground">+ ADD NEW EXERCISE</option>}
                    </select>
                    {exercise && (
                      <button onClick={handleDeleteExercise} className="p-2 text-muted-foreground transition-colors hover:text-destructive">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={onDelete}
                className="rounded-[var(--app-radius-md)] border border-transparent p-2 text-muted-foreground transition-colors hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="px-1 text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">Sets x Reps</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    inputMode="text"
                    value={sets}
                    onChange={(event) => setRow({ sets: event.target.value })}
                    placeholder="0"
                    className={inputCls + ' h-12 !w-20 text-center !text-base shadow-[var(--app-shadow-sm)]'}
                  />
                  <span className="text-lg font-semibold text-muted-foreground">x</span>
                  <Stepper
                    value={reps}
                    onChange={(value) => setRow({ reps: value })}
                    className="flex-1 h-12"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="px-1 text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">Weight (kg)</label>
                <Stepper
                  value={weight}
                  onChange={(value) => setRow({ weight: value })}
                  className="h-12"
                  step={2.5}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <label className="px-1 text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">Drop Set (Reps x Weight)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    inputMode="text"
                    value={dropSets}
                    onChange={(event) => setRow({ dropSets: event.target.value })}
                    placeholder="0"
                    className={inputCls + ' h-12 !w-20 text-center !text-base'}
                  />
                  <span className="text-lg font-semibold text-muted-foreground">x</span>
                  <Stepper
                    value={dropWeight}
                    onChange={(value) => setRow({ dropWeight: value })}
                    className="h-12 flex-1"
                    placeholder="0"
                    step={2.5}
                  />
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-4 right-4 h-px bg-[var(--app-border)]" />

            {showHistoryRow && (
              <div className="mt-2 space-y-3 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3.5 animate-in fade-in slide-in-from-bottom-2 duration-400">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
                    <History size={12} className="shrink-0" />
                    <span className="truncate">
                      {formatDateCompact(previousEntry.date)}: {previousSummary}
                    </span>
                  </div>
                  {occurrenceCount > 0 && (
                    <div className="shrink-0 rounded-[var(--app-radius-sm)] border border-[var(--app-border)] bg-[var(--app-surface)] px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-normal text-muted-foreground">
                      Done {occurrenceCount}x before
                    </div>
                  )}
                </div>
                {appliedHistoryDate !== previousEntry.date && (
                  <Button
                    onClick={() => applyPreviousValues(previousEntry)}
                    variant="outline"
                    className="h-10 w-full rounded-[var(--app-radius-md)] border-[var(--app-border)] bg-[var(--app-surface)] text-[9px] font-semibold uppercase tracking-normal text-foreground shadow-[var(--app-shadow-sm)] transition-colors hover:bg-[var(--app-surface-muted)]"
                  >
                    Apply Last Values
                  </Button>
                )}
              </div>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56 rounded-[var(--app-radius-md)] border-[var(--app-border)] shadow-[var(--app-shadow-md)]">
          <ContextMenuItem
            onClick={() => onChange({ ...row, sets: '', reps: '', weight: '', dropSets: '', dropWeight: '' })}
            className="flex cursor-pointer items-center gap-2 rounded-[var(--app-radius-sm)] text-xs font-semibold text-muted-foreground focus:bg-[var(--app-surface-muted)] focus:text-foreground"
          >
            <Eraser size={14} /> Clear All Values
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => onChange({ ...row, id: crypto.randomUUID() })}
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

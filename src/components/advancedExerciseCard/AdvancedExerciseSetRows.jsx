import { Copy, Plus, X, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import { Stepper } from '../ui/stepper';

export default function AdvancedExerciseSetRows({
  sets,
  hasDropsets,
  updateExercise,
  onUpdateSet,
  onRemoveSet,
  onAddSet,
}) {
  const copySetToNext = (idx, set, drops) => {
    if (idx >= sets.length - 1) return;

    onUpdateSet(idx + 1, {
      reps: set.reps,
      weight: set.weight,
      dropReps: set.dropReps || '',
      dropWeight: set.dropWeight || '',
      drops: drops.map((drop) => ({ ...drop })),
      isDrop: set.isDrop,
    });
  };

  return (
    <>
      {sets.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-[1.75rem_1fr_1fr_4.5rem] gap-2 px-2">
            <span className="text-[9px] font-semibold uppercase tracking-normal text-muted-foreground">Set</span>
            <span className="text-[9px] font-semibold uppercase tracking-normal text-muted-foreground">Rep</span>
            <span className="text-[9px] font-semibold uppercase tracking-normal text-muted-foreground">Weight</span>
            <span />
          </div>

          <div className="space-y-2">
            {sets.map((set, idx) => {
              const drops = set.drops || (set.dropReps || set.dropWeight ? [{ reps: set.dropReps, weight: set.dropWeight }] : []);

              return (
                <div key={idx} className="space-y-2">
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "grid gap-2 items-center",
                      "grid-cols-[1.75rem_1fr_1fr_4.5rem]"
                    )}
                  >
                    <button
                      onClick={() => {
                        const nextIsDrop = !set.isDrop;
                        if (nextIsDrop && !hasDropsets) {
                          updateExercise({
                            hasDropsets: true,
                            sets: sets.map((setItem, setIndex) =>
                              setIndex === idx
                                ? { ...setItem, isDrop: true, drops: drops.length ? drops : [{ reps: '', weight: '' }] }
                                : setItem
                            ),
                          });
                        } else {
                          const newDrops = nextIsDrop && !drops.length ? [{ reps: '', weight: '' }] : drops;
                          onUpdateSet(idx, { isDrop: nextIsDrop, drops: newDrops });
                        }
                      }}
                      className={cn(
                        "flex h-10 flex-col items-center justify-center rounded-[var(--app-radius-md)] border transition-colors",
                        set.isDrop
                          ? "border-[var(--app-border-strong)] bg-[var(--app-accent-soft)] text-foreground shadow-[var(--app-shadow-sm)]"
                          : "border-[var(--app-border)] bg-[var(--app-surface-muted)] text-foreground hover:bg-[var(--app-surface-raised)]"
                      )}
                    >
                      <span className="text-[10px] font-semibold leading-none">{idx + 1}</span>
                      {set.isDrop && <Zap size={8} className="fill-current mt-0.5" />}
                    </button>
                    <Stepper
                      value={set.reps}
                      onChange={(value) => onUpdateSet(idx, { reps: value })}
                      className="h-10"
                      placeholder="0"
                    />
                    <Stepper
                      value={set.weight}
                      onChange={(value) => onUpdateSet(idx, { weight: value })}
                      className="h-10"
                      step={2.5}
                      placeholder="0"
                    />
                    <div className="flex items-center justify-end gap-1">
                      {idx < sets.length - 1 && (
                        <button
                          type="button"
                          onClick={() => copySetToNext(idx, set, drops)}
                          title="Copy to next set"
                          aria-label={`Copy set ${idx + 1} values to set ${idx + 2}`}
                          className="flex h-8 w-8 items-center justify-center rounded-[var(--app-radius-sm)] p-1 text-muted-foreground transition-colors hover:bg-[var(--app-surface-muted)] hover:text-foreground"
                        >
                          <Copy size={12} strokeWidth={2.5} />
                        </button>
                      )}
                      <button
                        onClick={() => onRemoveSet(idx)}
                        className="flex h-8 w-8 items-center justify-center rounded-[var(--app-radius-sm)] p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X size={12} strokeWidth={3} />
                      </button>
                    </div>
                  </motion.div>

                  <AnimatePresence>
                    {set.isDrop && drops.map((drop, dropIdx) => (
                      <motion.div
                        key={dropIdx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="grid grid-cols-[1.75rem_1fr_1fr_4.5rem] gap-2 items-center pl-4"
                      >
                        <div className="h-6 flex items-center justify-center relative">
                          <div className="absolute bottom-1/2 left-[-10px] top-0 w-[2px] rounded-full bg-[var(--app-border)]" />
                          <div className="absolute left-[-10px] right-0 top-1/2 h-[2px] rounded-full bg-[var(--app-border)]" />
                          <Zap size={10} className="fill-current text-muted-foreground" />
                        </div>
                        <input
                          type="text"
                          value={drop.reps}
                          onChange={(event) => {
                            const newDrops = [...drops];
                            newDrops[dropIdx] = { ...newDrops[dropIdx], reps: event.target.value };
                            onUpdateSet(idx, { drops: newDrops, dropReps: newDrops[0].reps });
                          }}
                          placeholder="Drop Reps"
                          className="h-10 w-full rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] text-center text-xs font-semibold text-muted-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-[var(--app-border-strong)]"
                        />
                        <input
                          type="text"
                          value={drop.weight}
                          onChange={(event) => {
                            const newDrops = [...drops];
                            newDrops[dropIdx] = { ...newDrops[dropIdx], weight: event.target.value };
                            onUpdateSet(idx, { drops: newDrops, dropReps: newDrops[0]?.reps || '', dropWeight: newDrops[0]?.weight || '' });
                          }}
                          placeholder="Drop Weight"
                          className="h-10 w-full rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] text-center text-xs font-semibold text-muted-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-[var(--app-border-strong)]"
                        />
                        <div className="flex flex-col gap-1 items-center">
                          {dropIdx === drops.length - 1 ? (
                            <button
                              onClick={() => onUpdateSet(idx, { drops: [...drops, { reps: '', weight: '' }] })}
                              className="rounded-[var(--app-radius-sm)] p-1 text-muted-foreground transition-colors hover:bg-[var(--app-surface-muted)] hover:text-foreground"
                            >
                              <Plus size={12} strokeWidth={3} />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                const newDrops = drops.filter((_, dropIndex) => dropIndex !== dropIdx);
                                onUpdateSet(idx, { drops: newDrops, dropReps: newDrops[0]?.reps || '', dropWeight: newDrops[0]?.weight || '' });
                              }}
                              className="rounded-[var(--app-radius-sm)] p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            >
                              <X size={12} strokeWidth={3} />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={onAddSet}
        className="flex w-full items-center justify-center gap-2 rounded-[var(--app-radius-md)] border border-dashed border-[var(--app-border)] py-3 text-xs font-semibold uppercase tracking-normal text-foreground transition-colors hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface-muted)]"
      >
        <Plus size={14} strokeWidth={3} />
        Add Set
      </button>
    </>
  );
}

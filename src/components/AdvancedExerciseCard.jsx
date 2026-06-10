import { useState, useCallback, useMemo, useEffect } from 'react';
import { ChevronDown, Trash2, X, Hash, Dumbbell, History } from 'lucide-react';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getMuscleGroupKeys, 
  getSubMusclesForMuscle, 
  getExercisesForSubMuscle,
  addExerciseWithSync,
  removeExerciseWithSync,
  findPreviousExerciseEntry,
  getExerciseOccurrenceCount
} from '../utils/storage';
import { formatDateCompact } from '../utils/dateUtils';
import { Stepper } from './ui/stepper';
import { Button } from "@/components/ui/button";
import { Check, Zap } from 'lucide-react';
import AdvancedExerciseSetRows from './advancedExerciseCard/AdvancedExerciseSetRows';

export default function AdvancedExerciseCard({ 
  exerciseData, 
  onChange, 
  onDelete, 
  workoutDate,
  index = 0
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { muscle, subMuscle, exercise, sets = [], totalSets = 0, hasDropsets = false } = exerciseData;

  const muscleGroupKeys = useMemo(() => getMuscleGroupKeys(), []);
  const subMuscles = useMemo(() => muscle ? getSubMusclesForMuscle(muscle) : [], [muscle]);
  
  const [localExercises, setLocalExercises] = useState([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const allExercises = useMemo(() => {
    const fromStorage = muscle && subMuscle ? getExercisesForSubMuscle(muscle, subMuscle) : [];
    return Array.from(new Set([...fromStorage, ...localExercises]));
  }, [muscle, subMuscle, localExercises]);

  useEffect(() => {
    setLocalExercises([]);
    setIsAddingNew(false);
    setNewExName('');
    setConfirmingDelete(false);
  }, [muscle, subMuscle]);

  const previousEntry = useMemo(
    () => findPreviousExerciseEntry({ exercise, beforeDate: workoutDate }),
    [exercise, workoutDate]
  );

  const occurrenceCount = useMemo(() => {
    const firstSet = sets[0] || {};
    if (!exercise || !firstSet.reps || !firstSet.weight) return 0;
    return getExerciseOccurrenceCount({ 
      exercise, 
      reps: firstSet.reps, 
      weight: firstSet.weight, 
      beforeDate: workoutDate 
    });
  }, [exercise, sets, workoutDate]);

  const applyPreviousValues = useCallback(() => {
    if (!previousEntry) return;
    
    if (previousEntry.row.allSets) {
      onChange({
        ...exerciseData,
        sets: JSON.parse(JSON.stringify(previousEntry.row.allSets)),
        totalSets: previousEntry.row.allSets.length
      });
    } else {
      const numSets = parseInt(previousEntry.row.sets) || 1;
      const newSets = Array(numSets).fill(null).map(() => ({
        reps: previousEntry.row.reps,
        weight: previousEntry.row.weight
      }));
      onChange({
        ...exerciseData,
        sets: newSets,
        totalSets: numSets
      });
    }
  }, [previousEntry, exerciseData, onChange]);

  const update = useCallback((patch) => {
    onChange({ ...exerciseData, ...patch });
  }, [exerciseData, onChange]);

  const handleAddSet = () => {
    const newSets = [...sets, { reps: '', weight: '', dropReps: '', dropWeight: '', isDrop: hasDropsets }];
    update({ sets: newSets, totalSets: newSets.length });
  };

  const handleUpdateSet = (idx, patch) => {
    const newSets = sets.map((s, i) => i === idx ? { ...s, ...patch } : s);
    update({ sets: newSets });
  };

  const handleRemoveSet = (idx) => {
    const newSets = sets.filter((_, i) => i !== idx);
    update({ sets: newSets, totalSets: newSets.length });
  };

  const handleTotalSetsChange = (val) => {
    const num = parseInt(val) || 0;
    let newSets = [...sets];
    if (num > sets.length) {
      for (let i = sets.length; i < num; i++) {
        const lastSet = sets[sets.length - 1] || { reps: '', weight: '', isDrop: false };
        newSets.push({ ...lastSet, isDrop: hasDropsets });
      }
    } else if (num < sets.length) {
      newSets = newSets.slice(0, num);
    }
    update({ totalSets: num, sets: newSets });
  };

  const handleSaveNewExercise = () => {
    const trimmed = newExName.trim();
    if (!trimmed) return;
    
    addExerciseWithSync(muscle, subMuscle, trimmed);
    setLocalExercises(prev => [...prev, trimmed]);
    update({ exercise: trimmed });
    setIsAddingNew(false);
    setNewExName('');
  };

  return (
    <div className={cn(
      "overflow-hidden rounded-[var(--app-radius-lg)] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--app-shadow-sm)] transition-[box-shadow,border-color] duration-200 hover:border-[var(--app-border-strong)]",
      isOpen ? "mb-6 shadow-[var(--app-shadow-md)]" : "mb-3"
    )}>
      <div 
        className={cn(
          "flex cursor-pointer items-center justify-between border-b border-[var(--app-border)] px-4 py-3 transition-colors",
          isOpen ? "bg-[var(--app-surface-muted)]" : "bg-[var(--app-surface)]"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "rounded-[var(--app-radius-md)] p-1.5 transition-colors",
            isOpen ? "bg-foreground text-background" : "bg-[var(--app-surface-muted)] text-muted-foreground"
          )}>
            <Dumbbell size={16} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className={cn(
              "mb-1 text-[10px] font-semibold uppercase leading-none tracking-normal text-foreground"
            )}>
              Exercise {index + 1}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="rounded-[var(--app-radius-sm)] p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 size={14} />
          </button>
          <motion.div animate={{ rotate: isOpen ? 0 : -90 }} className="text-muted-foreground">
            <ChevronDown size={14} strokeWidth={3} />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="space-y-5 bg-[var(--app-surface)] p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="px-1 text-[10px] font-semibold uppercase tracking-normal text-foreground">Muscle Group</label>
                  <div className="relative">
                    <select
                      value={muscle}
                      onChange={(e) => update({ muscle: e.target.value, subMuscle: '', exercise: '' })}
                      className="w-full appearance-none rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2 text-xs font-semibold text-foreground outline-none transition-colors focus:border-[var(--app-border-strong)]"
                    >
                      <option value="" className="bg-[var(--app-surface)]">- Select -</option>
                      {muscleGroupKeys.map(m => <option key={m} value={m} className="bg-[var(--app-surface)]">{m}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="px-1 text-[10px] font-semibold uppercase tracking-normal text-foreground">Submuscle</label>
                  <div className="relative">
                    <select
                      value={subMuscle}
                      onChange={(e) => update({ subMuscle: e.target.value, exercise: '' })}
                      disabled={!muscle}
                      className="w-full appearance-none rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2 text-xs font-semibold text-foreground outline-none transition-colors disabled:opacity-50 focus:border-[var(--app-border-strong)]"
                    >
                      <option value="" className="bg-[var(--app-surface)]">- Select -</option>
                      {subMuscles.map(sm => <option key={sm} value={sm} className="bg-[var(--app-surface)]">{sm}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="px-1 text-[10px] font-semibold uppercase tracking-normal text-foreground">Exercise Name</label>
                
                {isAddingNew ? (
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      placeholder="Enter exercise name..."
                      value={newExName}
                      onChange={(e) => setNewExName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveNewExercise();
                        if (e.key === 'Escape') setIsAddingNew(false);
                      }}
                      className="flex-1 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2 text-xs font-semibold text-foreground shadow-[var(--app-shadow-sm)] outline-none transition-colors focus:border-[var(--app-border-strong)]"
                    />
                    <button
                      onClick={handleSaveNewExercise}
                      className="rounded-[var(--app-radius-md)] bg-foreground px-3 text-[10px] font-semibold uppercase tracking-normal text-background transition-colors hover:bg-foreground/90"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsAddingNew(false)}
                      className="rounded-[var(--app-radius-md)] bg-[var(--app-surface-muted)] px-3 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground transition-colors hover:bg-[var(--app-surface-raised)] hover:text-foreground"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : confirmingDelete ? (
                  <div className="flex items-center justify-between rounded-[var(--app-radius-md)] border border-destructive/20 bg-destructive/10 p-2 animate-in slide-in-from-top-1 duration-200">
                    <span className="truncate pr-4 text-xs font-semibold uppercase text-destructive">Delete "{exercise}"?</span>
                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={() => {
                          removeExerciseWithSync(muscle, subMuscle, exercise);
                          setLocalExercises(prev => prev.filter(prevEx => prevEx !== exercise));
                          update({ exercise: '' });
                          setConfirmingDelete(false);
                        }} 
                        className="rounded-[var(--app-radius-sm)] bg-destructive p-1.5 text-destructive-foreground shadow-[var(--app-shadow-sm)] transition-colors hover:bg-destructive/90"
                      >
                        <Check size={14} strokeWidth={3} />
                      </button>
                      <button 
                        onClick={() => setConfirmingDelete(false)} 
                        className="rounded-[var(--app-radius-sm)] border border-[var(--app-border)] bg-[var(--app-surface)] p-1.5 text-muted-foreground shadow-[var(--app-shadow-sm)] transition-colors hover:bg-[var(--app-surface-muted)]"
                      >
                        <X size={14} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <select
                        value={exercise}
                        onChange={(e) => {
                          if (e.target.value === '_add_new_') {
                            setIsAddingNew(true);
                          } else {
                            update({ exercise: e.target.value });
                          }
                        }}
                        disabled={!subMuscle}
                        className="w-full appearance-none rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2 text-xs font-semibold text-foreground shadow-[var(--app-shadow-sm)] outline-none transition-colors disabled:opacity-50 focus:border-[var(--app-border-strong)]"
                      >
                        <option value="" className="bg-[var(--app-surface)]">- Select Exercise -</option>
                        {allExercises.map(ex => <option key={ex} value={ex} className="bg-[var(--app-surface)]">{ex}</option>)}
                        {subMuscle && (
                          <option value="_add_new_" className="bg-[var(--app-surface)] font-semibold italic text-foreground">+ Add New Exercise...</option>
                        )}
                      </select>
                      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    </div>
                    {exercise && (
                      <button 
                        onClick={() => setConfirmingDelete(true)} 
                        className="shrink-0 rounded-[var(--app-radius-md)] border border-transparent p-2 text-muted-foreground shadow-[var(--app-shadow-sm)] transition-colors hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                        title="Delete Exercise from Database"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>

               <div className="flex items-center gap-3">
                <div className="flex flex-1 items-center justify-between rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
                  <div className="flex items-center gap-2">
                    <Hash size={14} className="text-muted-foreground" />
                    <span className="text-[11px] font-semibold uppercase tracking-normal text-foreground">Total Sets</span>
                  </div>
                  <div className="w-24">
                    <Stepper 
                      value={totalSets} 
                      onChange={handleTotalSetsChange}
                      min={0}
                      max={20}
                    />
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    const newState = !hasDropsets;
                    const newSets = sets.map(s => ({ ...s, isDrop: newState }));
                    update({ hasDropsets: newState, sets: newSets });
                  }}
                  className={cn(
                    "flex h-[48px] flex-col items-center justify-center gap-0.5 rounded-[var(--app-radius-md)] border px-2.5 transition-colors",
                    hasDropsets 
                      ? "border-[var(--app-border-strong)] bg-[var(--app-accent-soft)] text-foreground shadow-[var(--app-shadow-sm)]"
                      : "border-[var(--app-border)] bg-[var(--app-surface-muted)] text-muted-foreground hover:bg-[var(--app-surface-raised)]"
                  )}
                >
                  <Zap size={13} className={hasDropsets ? "fill-current" : ""} />
                  <span className="text-[7.5px] font-semibold uppercase leading-none tracking-normal">Drop</span>
                </button>
              </div>

              {exercise && previousEntry && (
                <div className="mt-2 space-y-2.5 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 animate-in fade-in slide-in-from-bottom-1 duration-300">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-normal text-foreground">
                      <History size={12} className="opacity-70" />
                      <span className="truncate">
                        Last Done: {formatDateCompact(previousEntry.date)}
                        {previousEntry.row && ` • ${previousEntry.row.reps} reps @ ${previousEntry.row.weight} kg`}
                      </span>
                    </div>
                    {occurrenceCount > 0 && (
                      <div className="rounded-[var(--app-radius-sm)] border border-[var(--app-border)] bg-[var(--app-surface)] px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-normal text-muted-foreground">
                        Done {occurrenceCount}x before
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={(e) => { e.stopPropagation(); applyPreviousValues(); }}
                    variant="outline"
                    className="h-8 w-full rounded-[var(--app-radius-md)] border-[var(--app-border)] bg-[var(--app-surface)] text-[9px] font-semibold uppercase tracking-normal text-foreground shadow-[var(--app-shadow-sm)] transition-colors hover:bg-[var(--app-surface-muted)]"
                  >
                    Apply Last Values
                  </Button>
                </div>
              )}

              <AdvancedExerciseSetRows
                sets={sets}
                hasDropsets={hasDropsets}
                updateExercise={update}
                onUpdateSet={handleUpdateSet}
                onRemoveSet={handleRemoveSet}
                onAddSet={handleAddSet}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

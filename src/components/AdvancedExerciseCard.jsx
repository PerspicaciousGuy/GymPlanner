import { useState, useCallback, useMemo, useEffect } from 'react';
import { ChevronDown, Plus, Trash2, X, Hash, Dumbbell, Target, History } from 'lucide-react';
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
  
  // Local cache for exercises to show newly added ones immediately without waiting for storage refresh
  const [localExercises, setLocalExercises] = useState([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const allExercises = useMemo(() => {
    const fromStorage = muscle && subMuscle ? getExercisesForSubMuscle(muscle, subMuscle) : [];
    // Combine storage exercises with local ones (to ensure visibility)
    return Array.from(new Set([...fromStorage, ...localExercises]));
  }, [muscle, subMuscle, localExercises]);

  // Reset local cache when muscle/submuscle changes
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
    // We check occurrence for the first set's values
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
      // If it was an advanced exercise before, restore all sets
      onChange({
        ...exerciseData,
        sets: JSON.parse(JSON.stringify(previousEntry.row.allSets)),
        totalSets: previousEntry.row.allSets.length
      });
    } else {
      // Legacy or simple row, create N sets with same values
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
    
    // Save to database
    addExerciseWithSync(muscle, subMuscle, trimmed);
    
    // Add to local list and select it
    setLocalExercises(prev => [...prev, trimmed]);
    update({ exercise: trimmed });
    
    // Reset adding state
    setIsAddingNew(false);
    setNewExName('');
  };

  return (
    <div className={cn(
      "bg-card border border-border rounded-3xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md",
      isOpen ? "mb-6 ring-1 ring-primary/20" : "mb-3"
    )}>
      {/* Header / Summary */}
      <div 
        className={cn(
          "px-4 py-3 flex items-center justify-between cursor-pointer transition-colors border-b border-border",
          isOpen ? "bg-muted/50" : "bg-card"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-1.5 rounded-xl transition-colors",
            isOpen ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          )}>
            <Dumbbell size={16} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className={cn(
              "text-[10px] font-black uppercase tracking-widest leading-none mb-1",
              isOpen ? "text-primary" : "text-foreground"
            )}>
              Exercise {index + 1}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
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
            <div className="p-4 space-y-5 bg-white/50 dark:bg-transparent">
              {/* Muscle & Submuscle Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-foreground uppercase tracking-widest px-1">Muscle Group</label>
                  <div className="relative">
                    <select
                      value={muscle}
                      onChange={(e) => update({ muscle: e.target.value, subMuscle: '', exercise: '' })}
                      className="w-full bg-secondary text-foreground border border-border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 ring-primary/50 transition-all appearance-none"
                    >
                      <option value="" className="bg-card">— Select —</option>
                      {muscleGroupKeys.map(m => <option key={m} value={m} className="bg-card">{m}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-foreground uppercase tracking-widest px-1">Submuscle</label>
                  <div className="relative">
                    <select
                      value={subMuscle}
                      onChange={(e) => update({ subMuscle: e.target.value, exercise: '' })}
                      disabled={!muscle}
                      className="w-full bg-secondary text-foreground border border-border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 ring-primary/50 transition-all appearance-none disabled:opacity-50"
                    >
                      <option value="" className="bg-card">— Select —</option>
                      {subMuscles.map(sm => <option key={sm} value={sm} className="bg-card">{sm}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Exercise Name Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-foreground uppercase tracking-widest px-1">Exercise Name</label>
                
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
                      className="flex-1 bg-secondary text-primary border border-border rounded-xl px-3 py-2 text-xs font-black outline-none focus:ring-2 ring-primary/50 transition-all shadow-sm"
                    />
                    <button
                      onClick={handleSaveNewExercise}
                      className="px-3 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase hover:bg-indigo-700 transition-all"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsAddingNew(false)}
                      className="px-3 bg-muted text-muted-foreground rounded-xl text-[10px] font-bold uppercase hover:bg-slate-200 transition-all"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : confirmingDelete ? (
                  <div className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50 p-2 animate-in slide-in-from-top-1 duration-200">
                    <span className="text-red-700 font-bold text-xs uppercase truncate pr-4">Delete "{exercise}"?</span>
                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={() => {
                          removeExerciseWithSync(muscle, subMuscle, exercise);
                          setLocalExercises(prev => prev.filter(prevEx => prevEx !== exercise));
                          update({ exercise: '' });
                          setConfirmingDelete(false);
                        }} 
                        className="bg-red-500 text-white p-1.5 rounded-lg shadow-sm hover:bg-red-600 transition-colors"
                      >
                        <Check size={14} strokeWidth={3} />
                      </button>
                      <button 
                        onClick={() => setConfirmingDelete(false)} 
                        className="bg-white text-slate-500 border border-red-100 p-1.5 rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
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
                        className="w-full bg-secondary text-primary border border-border rounded-xl px-3 py-2 text-xs font-black outline-none focus:ring-2 ring-primary/50 transition-all appearance-none disabled:opacity-50 shadow-sm"
                      >
                        <option value="" className="bg-card">— Select Exercise —</option>
                        {allExercises.map(ex => <option key={ex} value={ex} className="bg-card">{ex}</option>)}
                        {subMuscle && (
                          <option value="_add_new_" className="bg-indigo-50 text-indigo-700 font-bold italic">+ Add New Exercise...</option>
                        )}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
                    </div>
                    {exercise && (
                      <button 
                        onClick={() => setConfirmingDelete(true)} 
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm shrink-0 border border-transparent hover:border-red-100"
                        title="Delete Exercise from Database"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Total Sets Input */}
               <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center justify-between bg-muted/50 p-3 rounded-2xl border border-border">
                  <div className="flex items-center gap-2">
                    <Hash size={14} className="text-muted-foreground" />
                    <span className="text-[11px] font-black text-foreground uppercase tracking-widest">Total Sets</span>
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
                    "h-[48px] px-2.5 flex flex-col items-center justify-center gap-0.5 border rounded-xl transition-all",
                    hasDropsets 
                      ? "bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm" 
                      : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <Zap size={13} className={hasDropsets ? "fill-current" : ""} />
                  <span className="text-[7.5px] font-black uppercase tracking-tighter leading-none">Drop</span>
                </button>
              </div>

              {/* History & Occurrence Badge */}
              {exercise && previousEntry && (
                <div className="mt-2 p-3 bg-indigo-50/30 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100/50 dark:border-indigo-500/10 space-y-2.5 animate-in fade-in slide-in-from-bottom-1 duration-300">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-tight">
                      <History size={12} className="opacity-70" />
                      <span className="truncate">
                        Last Done: {formatDateCompact(previousEntry.date)}
                        {previousEntry.row && ` • ${previousEntry.row.reps} reps @ ${previousEntry.row.weight} kg`}
                      </span>
                    </div>
                    {occurrenceCount > 0 && (
                      <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black px-1.5 py-0.5 rounded-lg text-[8px] uppercase tracking-tighter border border-emerald-100 dark:border-emerald-500/20">
                        Done {occurrenceCount}x before
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={(e) => { e.stopPropagation(); applyPreviousValues(); }}
                    variant="outline"
                    className="w-full h-8 border-indigo-100 dark:border-indigo-500/20 bg-white dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-all shadow-sm"
                  >
                    Apply Last Values
                  </Button>
                </div>
              )}

              {/* Sets Table */}
              {sets.length > 0 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-[1.75rem_1fr_1fr_1.5rem] gap-2 px-2">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Set</span>
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Rep</span>
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Weight</span>
                    <span />
                  </div>
                  
                  <div className="space-y-2">
                    {sets.map((set, idx) => {
                      // Ensure drops array exists for multi-drop support
                      const drops = set.drops || (set.dropReps || set.dropWeight ? [{ reps: set.dropReps, weight: set.dropWeight }] : []);
                      
                      return (
                        <div key={idx} className="space-y-2">
                          <motion.div 
                            layout
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                              "grid gap-2 items-center",
                              "grid-cols-[1.75rem_1fr_1fr_1.5rem]"
                            )}
                          >
                            <button 
                              onClick={() => {
                                const nextIsDrop = !set.isDrop;
                                if (nextIsDrop && !hasDropsets) {
                                  update({ 
                                    hasDropsets: true, 
                                    sets: sets.map((s, i) => i === idx ? { ...s, isDrop: true, drops: drops.length ? drops : [{ reps: '', weight: '' }] } : s) 
                                  });
                                } else {
                                  const newDrops = nextIsDrop && !drops.length ? [{ reps: '', weight: '' }] : drops;
                                  handleUpdateSet(idx, { isDrop: nextIsDrop, drops: newDrops });
                                }
                              }}
                              className={cn(
                                "h-10 flex flex-col items-center justify-center border rounded-xl transition-all",
                                set.isDrop 
                                  ? "bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm ring-2 ring-indigo-500/10" 
                                  : "bg-muted text-foreground border-border hover:bg-muted/70"
                              )}
                            >
                              <span className="text-[10px] font-black leading-none">{idx + 1}</span>
                              {set.isDrop && <Zap size={8} className="fill-current mt-0.5" />}
                            </button>
                            <Stepper 
                              value={set.reps} 
                              onChange={(v) => handleUpdateSet(idx, { reps: v })}
                              className="h-10"
                              placeholder="0"
                            />
                            <Stepper 
                              value={set.weight} 
                              onChange={(v) => handleUpdateSet(idx, { weight: v })}
                              className="h-10"
                              step={2.5}
                              placeholder="0"
                            />
                            <button 
                              onClick={() => handleRemoveSet(idx)}
                              className="p-1 h-8 w-8 text-slate-300 dark:text-slate-700 hover:text-red-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 rounded-lg transition-all flex items-center justify-center"
                            >
                              <X size={12} strokeWidth={3} />
                            </button>
                          </motion.div>

                          {/* Multi-Drop Rows */}
                          <AnimatePresence>
                            {set.isDrop && drops.map((drop, dropIdx) => (
                              <motion.div
                                key={dropIdx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="grid grid-cols-[1.75rem_1fr_1fr_1.5rem] gap-2 items-center pl-4"
                              >
                                <div className="h-6 flex items-center justify-center relative">
                                   <div className="absolute left-[-10px] top-0 bottom-1/2 w-[2px] bg-indigo-100 rounded-full" />
                                   <div className="absolute left-[-10px] top-1/2 right-0 h-[2px] bg-indigo-100 rounded-full" />
                                   <Zap size={10} className="text-indigo-400 fill-current" />
                                </div>
                                <input
                                  type="text"
                                  value={drop.reps}
                                  onChange={(e) => {
                                    const newDrops = [...drops];
                                    newDrops[dropIdx] = { ...newDrops[dropIdx], reps: e.target.value };
                                    handleUpdateSet(idx, { drops: newDrops, dropReps: newDrops[0].reps });
                                  }}
                                  placeholder="Drop Reps"
                                  className="w-full text-center bg-muted/30 border border-slate-100 rounded-xl h-10 text-xs font-bold text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-300 transition-all"
                                />
                                <input
                                  type="text"
                                  value={drop.weight}
                                  onChange={(e) => {
                                    const newWeight = e.target.value;
                                    const newDrops = [...drops];
                                    newDrops[dropIdx] = { ...newDrops[dropIdx], weight: newWeight };
                                    handleUpdateSet(idx, { drops: newDrops, dropReps: newDrops[0]?.reps || '', dropWeight: newDrops[0]?.weight || '' });
                                  }}
                                  placeholder="Drop Weight"
                                  className="w-full text-center bg-muted/30 border border-slate-100 rounded-xl h-10 text-xs font-bold text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-300 transition-all"
                                />
                                <div className="flex flex-col gap-1 items-center">
                                  {dropIdx === drops.length - 1 ? (
                                    <button 
                                      onClick={() => {
                                        const newDrops = [...drops, { reps: '', weight: '' }];
                                        handleUpdateSet(idx, { drops: newDrops });
                                      }}
                                      className="p-1 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                    >
                                      <Plus size={12} strokeWidth={3} />
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={() => {
                                        const newDrops = drops.filter((_, i) => i !== dropIdx);
                                        handleUpdateSet(idx, { drops: newDrops, dropReps: newDrops[0]?.reps || '', dropWeight: newDrops[0]?.weight || '' });
                                      }}
                                      className="p-1 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
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

              {/* Add Set Button */}
              <button
                onClick={handleAddSet}
                className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-primary/30 rounded-2xl text-primary hover:bg-primary/5 transition-all text-xs font-black uppercase tracking-widest"
              >
                <Plus size={14} strokeWidth={3} />
                Add Set
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

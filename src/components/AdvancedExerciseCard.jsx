import { useState, useCallback, useMemo, useEffect } from 'react';
import { ChevronDown, Plus, Trash2, X, Hash, Dumbbell, Target } from 'lucide-react';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getMuscleGroupKeys, 
  getSubMusclesForMuscle, 
  getExercisesForSubMuscle,
  addExerciseWithSync
} from '../utils/storage';
import { Stepper } from './ui/stepper';

export default function AdvancedExerciseCard({ 
  exerciseData, 
  onChange, 
  onDelete, 
  workoutDate,
  index = 0
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { muscle, subMuscle, exercise, sets = [], totalSets = 0 } = exerciseData;

  const muscleGroupKeys = useMemo(() => getMuscleGroupKeys(), []);
  const subMuscles = useMemo(() => muscle ? getSubMusclesForMuscle(muscle) : [], [muscle]);
  
  // Local cache for exercises to show newly added ones immediately without waiting for storage refresh
  const [localExercises, setLocalExercises] = useState([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newExName, setNewExName] = useState('');

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
  }, [muscle, subMuscle]);

  const update = useCallback((patch) => {
    onChange({ ...exerciseData, ...patch });
  }, [exerciseData, onChange]);

  const handleAddSet = () => {
    const newSets = [...sets, { reps: '', weight: '' }];
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
        const lastSet = sets[sets.length - 1] || { reps: '', weight: '' };
        newSets.push({ ...lastSet });
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
                ) : (
                  <div className="relative">
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
                )}
              </div>

              {/* Total Sets Input */}
              <div className="flex items-center justify-between bg-muted/50 p-3 rounded-2xl border border-border">
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

              {/* Sets Table */}
              {sets.length > 0 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-[3rem_1fr_1fr_2rem] gap-2 px-2">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Set</span>
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Rep</span>
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Weight (kg)</span>
                    <span />
                  </div>
                  
                  <div className="space-y-2">
                    {sets.map((set, idx) => (
                      <motion.div 
                        key={idx}
                        layout
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-[3rem_1fr_1fr_2rem] gap-2 items-center"
                      >
                        <div className="h-10 bg-muted flex items-center justify-center text-xs font-black text-foreground border border-border rounded-xl">
                          {idx + 1}
                        </div>
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
                    ))}
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

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Trash2, 
  Pencil, 
  X, 
  Save, 
  Dumbbell,
  Plus
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { loadTemplates, updateTemplate, getMuscleGroupKeys, getSubMusclesForMuscle, getExercisesForSubMuscle } from '../utils/storage';
import { cn } from "@/lib/utils";
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/layout/Panel";

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function EditRoutinePage({ routineId, onBack }) {
  const [name, setName] = useState('');
  const [groups, setGroups] = useState([]);
  const [standaloneExercises, setStandaloneExercises] = useState([]);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const templates = loadTemplates();
    const routine = templates.find(t => t.id === routineId);
    if (routine) {
      setName(routine.name || '');
      const rawGroups = JSON.parse(JSON.stringify(routine.groups || []));
      const groupsWithIds = rawGroups.map(g => ({
        ...g,
        id: g.id || generateId(),
        rows: (g.rows || []).map(r => ({ ...r, id: r.id || generateId() }))
      }));
      setGroups(groupsWithIds);
      
      const rawStandalone = JSON.parse(JSON.stringify(routine.standaloneExercises || []));
      const standaloneWithIds = rawStandalone.map(r => ({ ...r, id: r.id || generateId() }));
      setStandaloneExercises(standaloneWithIds);
    }
  }, [routineId]);

  const handleGroupTextChange = (gIdx, rIdx, field, value) => {
    const next = [...groups];
    if (!next[gIdx].rows) next[gIdx].rows = [];
    
    const currentRow = { ...next[gIdx].rows[rIdx], [field]: value };
    
    if (field === 'muscle') {
      currentRow.subMuscle = '';
      currentRow.exercise = '';
    } else if (field === 'subMuscle') {
      currentRow.exercise = '';
    }
    
    next[gIdx].rows[rIdx] = currentRow;
    setGroups(next);
  };

  const removeGroup = (gIdx) => {
    setGroups(groups.filter((_, i) => i !== gIdx));
  };

  const removeRowFromGroup = (gIdx, rIdx) => {
    const next = [...groups];
    next[gIdx].rows = next[gIdx].rows.filter((_, i) => i !== rIdx);
    if (next[gIdx].rows.length === 0) {
      setGroups(groups.filter((_, i) => i !== gIdx));
    } else {
      setGroups(next);
    }
  };

  const handleStandaloneTextChange = (idx, field, value) => {
    const next = [...standaloneExercises];
    const current = { ...next[idx], [field]: value };
    if (field === 'muscle') {
      current.subMuscle = '';
      current.exercise = '';
    } else if (field === 'subMuscle') {
      current.exercise = '';
    }
    next[idx] = current;
    setStandaloneExercises(next);
  };

  const removeStandalone = (idx) => {
    setStandaloneExercises(standaloneExercises.filter((_, i) => i !== idx));
  };

  const addStandaloneExercise = () => {
    setStandaloneExercises([...standaloneExercises, { 
      id: generateId(), 
      exercise: '', 
      totalSets: 0,
      sets: [],
      muscle: '',
      subMuscle: ''
    }]);
  };

  const handleSave = () => {
    updateTemplate(routineId, name.trim(), groups, standaloneExercises);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onBack();
    }, 800);
  };

  const addRowToGroup = (gIdx) => {
    const next = [...groups];
    next[gIdx].rows.push({ id: generateId(), exercise: '', sets: '', reps: '', weight: '', muscle: '' });
    setGroups(next);
  };

  const addGroup = () => {
    setGroups([...groups, { id: generateId(), rows: [{ id: generateId(), exercise: '', sets: '', reps: '', weight: '', muscle: '' }] }]);
  };

  useGSAP(() => {
    gsap.from(".edit-header > *", {
      y: 30,
      opacity: 0,
      stagger: 0.1,
      duration: 0.8,
      ease: "power4.out"
    });

    gsap.from(".routine-section", {
      y: 50,
      opacity: 0,
      stagger: 0.15,
      duration: 1,
      ease: "power3.out",
      delay: 0.2
    });
  }, { scope: '.edit-page' });

  return (
    <PageShell size="narrow" className="edit-page">
      <PageHeader
        title="Edit Routine"
        description="Refine your session structure and naming."
        className="edit-header"
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex h-10 items-center gap-2 rounded-[var(--app-radius-md)] border-[var(--app-border)] bg-[var(--app-surface)] px-3 text-xs font-semibold text-muted-foreground shadow-none hover:bg-[var(--app-surface-muted)] hover:text-foreground"
            >
              <ArrowLeft size={16} />
              Back
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaved}
              className={cn(
                "h-10 rounded-[var(--app-radius-md)] px-5 text-[10px] font-semibold uppercase tracking-normal transition-colors shadow-[var(--app-shadow-sm)]",
                isSaved ? "bg-foreground text-background hover:bg-foreground/90" : "bg-foreground text-background hover:bg-foreground/90"
              )}
            >
              {isSaved ? "Saved" : "Save Changes"}
            </Button>
          </div>
        )}
      />

      <div className="space-y-10">
        <Panel className="space-y-4 p-5 md:p-6 edit-header">
          <Badge className="rounded-full border-none bg-[var(--app-accent-soft)] px-3 py-1 text-[9px] font-semibold uppercase tracking-normal text-foreground">
            Routing Configuration
          </Badge>
          <div className="relative group">
             <div className="absolute left-0 top-1/2 -ml-3 h-12 w-1.5 -translate-y-1/2 rounded-full bg-foreground opacity-0 transition-opacity group-focus-within:opacity-100" />
             <input 
               value={name}
               onChange={(e) => setName(e.target.value)}
               className="w-full border-none bg-transparent text-3xl font-semibold uppercase tracking-normal text-foreground outline-none md:text-4xl"
               placeholder="Untitled Routine"
             />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Routine templates are reused when building weekly and cycle plans.</p>
        </Panel>

        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
               <div className="h-2 w-2 rounded-full bg-foreground" />
               Exercise Flow
            </h2>
            <Button 
              variant="outline" 
              onClick={addGroup}
              className="h-8 rounded-[var(--app-radius-sm)] border-[var(--app-border)] bg-[var(--app-surface)] px-3 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground shadow-none hover:bg-[var(--app-surface-muted)] hover:text-foreground"
            >
              <Plus size={14} className="mr-1.5" /> Add Section
            </Button>
          </div>

          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
            {groups.map((group, gIdx) => (
              <motion.div 
                key={group.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, height: 0, marginBottom: 0, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 350, damping: 25, mass: 1 }}
                className="group/card routine-section relative overflow-hidden rounded-[var(--app-radius-lg)] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[var(--app-shadow-sm)] transition-colors hover:border-[var(--app-border-strong)] md:p-6"
              >
                <div className="pointer-events-none absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-bl-[var(--app-radius-lg)] bg-[var(--app-surface-muted)]" />
                
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-1 text-[10px] font-semibold uppercase tracking-normal text-foreground">
                    Section {gIdx + 1}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeGroup(gIdx)}
                    className="h-8 w-8 rounded-[var(--app-radius-sm)] text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>

                <div className="space-y-4 relative z-10">
                  <AnimatePresence mode="popLayout">
                  {group.rows?.map((row, rIdx) => {
                    const muscleList = getMuscleGroupKeys();
                    const subMuscleList = row.muscle ? getSubMusclesForMuscle(row.muscle) : [];
                    const exerciseList = (row.muscle && row.subMuscle) ? getExercisesForSubMuscle(row.muscle, row.subMuscle) : [];

                    return (
                    <motion.div 
                      key={row.id}
                      layout
                      initial={{ opacity: 0, x: -20, scale: 0.98 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 50, scale: 0.9, height: 0, marginBottom: 0, padding: 0 }}
                      transition={{ type: "spring", stiffness: 450, damping: 30 }}
                      className="group/row space-y-3 overflow-hidden rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 transition-colors hover:border-[var(--app-border-strong)] md:p-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                        <div className="space-y-1">
                          <label className="pl-2 text-[8px] font-semibold uppercase tracking-normal text-muted-foreground">Muscle Group</label>
                          <select 
                            value={row.muscle || ''}
                            onChange={(e) => handleGroupTextChange(gIdx, rIdx, 'muscle', e.target.value)}
                            className="h-10 w-full cursor-pointer appearance-none rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 text-[10px] font-semibold text-foreground outline-none transition-colors focus:border-[var(--app-border-strong)]"
                          >
                            <option value="">Select Muscle...</option>
                            {muscleList.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="pl-2 text-[8px] font-semibold uppercase tracking-normal text-muted-foreground">Sub-Muscle</label>
                          <select 
                            value={row.subMuscle || ''}
                            onChange={(e) => handleGroupTextChange(gIdx, rIdx, 'subMuscle', e.target.value)}
                            className="h-10 w-full cursor-pointer appearance-none rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 text-[10px] font-semibold text-foreground outline-none transition-colors disabled:opacity-50 focus:border-[var(--app-border-strong)]"
                            disabled={!row.muscle}
                          >
                            <option value="">Select Sub-Muscle...</option>
                            {subMuscleList.map(sm => <option key={sm} value={sm}>{sm.toUpperCase()}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="pl-2 text-[8px] font-semibold uppercase tracking-normal text-muted-foreground">Exercise</label>
                          <select 
                            value={row.exercise || ''}
                            onChange={(e) => handleGroupTextChange(gIdx, rIdx, 'exercise', e.target.value)}
                            className="h-10 w-full cursor-pointer appearance-none rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 text-[10px] font-semibold text-foreground outline-none transition-colors disabled:opacity-50 focus:border-[var(--app-border-strong)]"
                            disabled={!row.subMuscle}
                          >
                            <option value="">Select Exercise...</option>
                            {exerciseList.map(ex => <option key={ex} value={ex}>{ex.toUpperCase()}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-3">
                           <div className="flex items-center gap-2 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-1.5 shadow-[var(--app-shadow-sm)]">
                              <span className="text-[9px] font-semibold uppercase tracking-normal text-muted-foreground">Sets</span>
                              <input 
                                value={row.sets || ''} 
                                onChange={(e) => handleGroupTextChange(gIdx, rIdx, 'sets', e.target.value)}
                                className="w-8 bg-transparent text-center text-xs font-semibold text-foreground outline-none"
                              />
                           </div>
                           <div className="flex items-center gap-2 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-1.5 shadow-[var(--app-shadow-sm)]">
                              <span className="text-[9px] font-semibold uppercase tracking-normal text-muted-foreground">Reps</span>
                              <input 
                                value={row.reps || ''} 
                                onChange={(e) => handleGroupTextChange(gIdx, rIdx, 'reps', e.target.value)}
                                className="w-10 bg-transparent text-center text-xs font-semibold text-foreground outline-none"
                              />
                           </div>
                        </div>

                        <Button 
                           variant="ghost" 
                           size="icon"
                           onClick={() => removeRowFromGroup(gIdx, rIdx)}
                           className="h-8 w-8 text-muted-foreground transition-all hover:text-destructive md:opacity-0 md:group-hover/row:opacity-100"
                        >
                           <Trash2 size={14} />
                        </Button>
                      </div>
                    </motion.div>
                  ); })}
                  </AnimatePresence>
                  
                  <Button 
                    variant="ghost" 
                    onClick={() => addRowToGroup(gIdx)}
                    className="mt-2 h-10 w-full rounded-[var(--app-radius-md)] border border-dashed border-[var(--app-border)] text-[10px] font-semibold uppercase tracking-normal text-muted-foreground hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface)] hover:text-foreground"
                  >
                    <Plus size={14} className="mr-2" /> Add Exercise to Section
                  </Button>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
               <div className="h-2 w-2 rounded-full bg-[var(--app-border-strong)]" />
               Advanced Exercises
            </h2>
            <Button 
              variant="outline" 
              onClick={addStandaloneExercise}
              className="h-8 rounded-[var(--app-radius-sm)] border-[var(--app-border)] bg-[var(--app-surface)] px-3 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground shadow-none hover:bg-[var(--app-surface-muted)] hover:text-foreground"
            >
              <Plus size={14} className="mr-1.5" /> Add Advanced
            </Button>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
            {standaloneExercises.map((row, rIdx) => {
              const muscleList = getMuscleGroupKeys();
              const subMuscleList = row.muscle ? getSubMusclesForMuscle(row.muscle) : [];
              const exerciseList = (row.muscle && row.subMuscle) ? getExercisesForSubMuscle(row.muscle, row.subMuscle) : [];

              return (
              <motion.div 
                key={row.id}
                layout
                initial={{ opacity: 0, x: -20, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.9, height: 0, marginBottom: 0, padding: 0 }}
                transition={{ type: "spring", stiffness: 450, damping: 30 }}
                className="group/row space-y-3 overflow-hidden rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] p-3 shadow-[var(--app-shadow-sm)] transition-colors hover:border-[var(--app-border-strong)] md:p-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <label className="pl-2 text-[8px] font-semibold uppercase tracking-normal text-muted-foreground">Muscle Group</label>
                    <select 
                      value={row.muscle || ''}
                      onChange={(e) => handleStandaloneTextChange(rIdx, 'muscle', e.target.value)}
                      className="h-10 w-full cursor-pointer appearance-none rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 text-[10px] font-semibold text-foreground outline-none transition-colors focus:border-[var(--app-border-strong)]"
                    >
                      <option value="">Select Muscle...</option>
                      {muscleList.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="pl-2 text-[8px] font-semibold uppercase tracking-normal text-muted-foreground">Sub-Muscle</label>
                    <select 
                      value={row.subMuscle || ''}
                      onChange={(e) => handleStandaloneTextChange(rIdx, 'subMuscle', e.target.value)}
                      className="h-10 w-full cursor-pointer appearance-none rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 text-[10px] font-semibold text-foreground outline-none transition-colors disabled:opacity-50 focus:border-[var(--app-border-strong)]"
                      disabled={!row.muscle}
                    >
                      <option value="">Select Sub-Muscle...</option>
                      {subMuscleList.map(sm => <option key={sm} value={sm}>{sm.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="pl-2 text-[8px] font-semibold uppercase tracking-normal text-muted-foreground">Exercise</label>
                    <select 
                      value={row.exercise || ''}
                      onChange={(e) => handleStandaloneTextChange(rIdx, 'exercise', e.target.value)}
                      className="h-10 w-full cursor-pointer appearance-none rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 text-[10px] font-semibold text-foreground outline-none transition-colors disabled:opacity-50 focus:border-[var(--app-border-strong)]"
                      disabled={!row.subMuscle}
                    >
                      <option value="">Select Exercise...</option>
                      {exerciseList.map(ex => <option key={ex} value={ex}>{ex.toUpperCase()}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-1.5 shadow-[var(--app-shadow-sm)]">
                        <span className="text-[9px] font-semibold uppercase tracking-normal text-muted-foreground">Sets</span>
                        <input 
                          value={row.totalSets || ''} 
                          onChange={(e) => {
                            const val = e.target.value;
                            const num = parseInt(val) || 0;
                            const newSets = Array(num).fill(null).map((_, i) => row.sets?.[i] || { reps: row.sets?.[0]?.reps || '', weight: '' });
                            const next = [...standaloneExercises];
                            next[rIdx] = { ...next[rIdx], totalSets: val === '' ? '' : num, sets: newSets };
                            setStandaloneExercises(next);
                          }}
                          className="w-8 bg-transparent text-center text-xs font-semibold text-foreground outline-none"
                        />
                     </div>
                     <div className="flex items-center gap-2 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-1.5 shadow-[var(--app-shadow-sm)]">
                        <span className="text-[9px] font-semibold uppercase tracking-normal text-muted-foreground">Reps</span>
                        <input 
                          value={row.sets?.[0]?.reps || ''} 
                          onChange={(e) => {
                            const val = e.target.value;
                            const currentSets = Array.isArray(row.sets) ? row.sets : [];
                            const newSets = currentSets.length > 0 
                              ? currentSets.map(s => ({ ...s, reps: val }))
                              : [{ reps: val, weight: '' }];
                            const next = [...standaloneExercises];
                            next[rIdx] = { ...next[rIdx], sets: newSets, totalSets: next[rIdx].totalSets || 1 };
                            setStandaloneExercises(next);
                          }}
                          className="w-10 bg-transparent text-center text-xs font-semibold text-foreground outline-none"
                        />
                     </div>
                  </div>

                  <Button 
                     variant="ghost" 
                     size="icon"
                     onClick={() => removeStandalone(rIdx)}
                     className="h-8 w-8 text-muted-foreground transition-all hover:text-destructive md:opacity-0 md:group-hover/row:opacity-100"
                  >
                     <Trash2 size={14} />
                  </Button>
                </div>
              </motion.div>
            ); })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

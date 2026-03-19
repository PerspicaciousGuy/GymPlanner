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

export default function EditRoutinePage({ routineId, onBack }) {
  const [name, setName] = useState('');
  const [groups, setGroups] = useState([]);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const templates = loadTemplates();
    const routine = templates.find(t => t.id === routineId);
    if (routine) {
      setName(routine.name || '');
      setGroups(JSON.parse(JSON.stringify(routine.groups || [])));
    }
  }, [routineId]);

  const handleGroupTextChange = (gIdx, rIdx, field, value) => {
    const next = [...groups];
    if (!next[gIdx].rows) next[gIdx].rows = [];
    
    const currentRow = { ...next[gIdx].rows[rIdx], [field]: value };
    
    // Cascading resets
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

  const handleSave = () => {
    updateTemplate(routineId, name.trim(), groups);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onBack();
    }, 800);
  };

  const addRowToGroup = (gIdx) => {
    const next = [...groups];
    next[gIdx].rows.push({ exercise: '', sets: '', reps: '', weight: '', muscle: '' });
    setGroups(next);
  };

  const addGroup = () => {
    setGroups([...groups, { rows: [{ exercise: '', sets: '', reps: '', weight: '', muscle: '' }] }]);
  };

  return (
    <div className="max-w-3xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Header/Action Bar */}
      <div className="flex items-center justify-between mb-8">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="rounded-xl h-10 px-3 text-muted-foreground hover:text-foreground hover:bg-muted font-bold text-xs flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to Routines
        </Button>

        <Button 
          onClick={handleSave}
          disabled={isSaved}
          className={cn(
            "rounded-xl h-10 px-6 font-black uppercase text-[10px] tracking-widest transition-all shadow-lg",
            isSaved ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20"
          )}
        >
          {isSaved ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      <div className="space-y-10">
        {/* Title Section */}
        <div className="space-y-4">
          <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] px-3 py-1 rounded-full uppercase tracking-widest">
            Routing Configuration
          </Badge>
          <div className="relative group">
             <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 w-1.5 h-12 bg-primary rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
             <input 
               value={name}
               onChange={(e) => setName(e.target.value)}
               className="bg-transparent border-none text-4xl md:text-5xl font-black text-foreground tracking-tight outline-none w-full italic uppercase"
               placeholder="Untitled Routine"
             />
          </div>
          <p className="text-muted-foreground font-semibold text-sm">Refine your session structure and naming.</p>
        </div>

        {/* Exercises Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500" />
               Exercise Flow
            </h2>
            <Button 
              variant="outline" 
              onClick={addGroup}
              className="h-8 rounded-lg border-border bg-card hover:bg-muted text-[10px] font-black uppercase tracking-widest px-3"
            >
              <Plus size={14} className="mr-1.5" /> Add Section
            </Button>
          </div>

          <div className="space-y-6">
            {groups.map((group, gIdx) => (
              <div key={gIdx} className="border border-border rounded-[2.5rem] bg-card p-6 md:p-8 shadow-sm hover:border-primary/20 transition-all relative overflow-hidden group/card">
                <div className="absolute top-0 right-0 w-32 h-32 bg-muted/20 rounded-bl-[4rem] -mr-16 -mt-16 pointer-events-none" />
                
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                    Section {gIdx + 1}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeGroup(gIdx)}
                    className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>

                <div className="space-y-4 relative z-10">
                  {group.rows?.map((row, rIdx) => {
                    const muscleList = getMuscleGroupKeys();
                    const subMuscleList = row.muscle ? getSubMusclesForMuscle(row.muscle) : [];
                    const exerciseList = (row.muscle && row.subMuscle) ? getExercisesForSubMuscle(row.muscle, row.subMuscle) : [];

                    return (
                    <div key={rIdx} className="bg-muted/20 rounded-[1.8rem] border border-border/40 p-3 md:p-4 space-y-3 group/row hover:border-primary/20 transition-all">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest pl-2">Muscle Group</label>
                          <select 
                            value={row.muscle || ''}
                            onChange={(e) => handleGroupTextChange(gIdx, rIdx, 'muscle', e.target.value)}
                            className="w-full h-10 rounded-xl border border-border bg-muted/50 text-[10px] font-black text-foreground px-3 outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer"
                          >
                            <option value="">Select Muscle...</option>
                            {muscleList.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest pl-2">Sub-Muscle</label>
                          <select 
                            value={row.subMuscle || ''}
                            onChange={(e) => handleGroupTextChange(gIdx, rIdx, 'subMuscle', e.target.value)}
                            className="w-full h-10 rounded-xl border border-border bg-muted/50 text-[10px] font-black text-foreground px-3 outline-none focus:border-primary/50 transition-all disabled:opacity-50 appearance-none cursor-pointer"
                            disabled={!row.muscle}
                          >
                            <option value="">Select Sub-Muscle...</option>
                            {subMuscleList.map(sm => <option key={sm} value={sm}>{sm.toUpperCase()}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest pl-2">Exercise</label>
                          <select 
                            value={row.exercise || ''}
                            onChange={(e) => handleGroupTextChange(gIdx, rIdx, 'exercise', e.target.value)}
                            className="w-full h-10 rounded-xl border border-border bg-muted/50 text-[10px] font-black text-foreground px-3 outline-none focus:border-primary/50 transition-all disabled:opacity-50 appearance-none cursor-pointer"
                            disabled={!row.subMuscle}
                          >
                            <option value="">Select Exercise...</option>
                            {exerciseList.map(ex => <option key={ex} value={ex}>{ex.toUpperCase()}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-3">
                           <div className="flex items-center gap-2 bg-muted/80 px-4 py-1.5 rounded-xl border border-border shadow-sm">
                              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Sets</span>
                              <input 
                                value={row.sets || ''} 
                                onChange={(e) => handleGroupTextChange(gIdx, rIdx, 'sets', e.target.value)}
                                className="w-8 bg-transparent text-xs font-black text-foreground text-center outline-none"
                              />
                           </div>
                           <div className="flex items-center gap-2 bg-muted/80 px-4 py-1.5 rounded-xl border border-border shadow-sm">
                              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Reps</span>
                              <input 
                                value={row.reps || ''} 
                                onChange={(e) => handleGroupTextChange(gIdx, rIdx, 'reps', e.target.value)}
                                className="w-10 bg-transparent text-xs font-black text-foreground text-center outline-none"
                              />
                           </div>
                        </div>

                        <Button 
                           variant="ghost" 
                           size="icon"
                           onClick={() => removeRowFromGroup(gIdx, rIdx)}
                           className="h-8 w-8 text-muted-foreground hover:text-rose-500 transition-all md:opacity-0 md:group-hover/row:opacity-100"
                        >
                           <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ); })}
                  
                  <Button 
                    variant="ghost" 
                    onClick={() => addRowToGroup(gIdx)}
                    className="w-full mt-2 h-10 rounded-xl border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 text-[10px] font-black uppercase tracking-widest"
                  >
                    <Plus size={14} className="mr-2" /> Add Exercise to Section
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

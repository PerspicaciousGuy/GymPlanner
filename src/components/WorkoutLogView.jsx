import { Zap, Weight, Layers, ChevronRight, Activity, Dumbbell } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function WorkoutLogView({ dayData, sessionKey = 'am', onEdit }) {
  const session = dayData?.[sessionKey];
  const groups = session?.groups || [];
  const standalone = session?.standaloneExercises || [];

  const allExercises = [
    ...groups.flatMap(g => g.rows || []),
    ...standalone.map(ex => ({
      exercise: ex.exercise,
      muscle: ex.muscle,
      subMuscle: ex.subMuscle,
      // Summary for standalone: Use first set for weight/reps but indicate total sets
      sets: ex.sets?.length || 0,
      reps: ex.sets?.length === 1 ? ex.sets[0].reps : 'Varies',
      weight: ex.sets?.length === 1 ? ex.sets[0].weight : (ex.sets?.length ? ex.sets[0].weight : 0),
      isAdvanced: true
    }))
  ].filter(r => r.exercise);

  if (allExercises.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-slate-300 gap-3 border-2 border-dashed border-slate-100 rounded-3xl">
        <Activity size={48} strokeWidth={1} />
        <p className="font-bold text-sm uppercase tracking-widest text-slate-400">No activity recorded</p>
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full space-y-3">
      {allExercises.map((ex, idx) => (
        <AccordionItem 
          key={idx} 
          value={`item-${idx}`}
          className="bg-white border border-slate-100 rounded-2xl px-4 shadow-sm hover:shadow-md transition-[box-shadow,border-color] group/card relative border-none ring-1 ring-slate-200/60"
        >
          {/* Accent decoration */}
          <div className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-500 rounded-full opacity-0 group-hover/card:opacity-100 transition-opacity" />
          
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0 text-left">
              <div className="bg-slate-50 w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-indigo-500 shrink-0 shadow-inner">
                <Activity size={18} className="md:size-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-sm md:text-base font-black text-slate-800 uppercase tracking-tight leading-tight break-words">
                    {ex.exercise}
                  </h3>
                  {ex.dropSets && (
                    <Badge variant="secondary" className="bg-amber-50 text-amber-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5 border-amber-100 hover:bg-amber-100">
                      <Zap size={8} fill="currentColor" /> Drop
                    </Badge>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Badge variant="outline" className="text-[9px] md:text-[10px] font-bold text-slate-400 border-slate-200 uppercase tracking-widest px-1.5 py-0">
                    {ex.muscle}
                  </Badge>
                  <span className="text-[9px] md:text-[10px] font-bold text-indigo-500/70 uppercase tracking-widest">
                    {ex.subMuscle}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 mr-4">
                <div className="hidden sm:flex flex-col items-end">
                   <div className="flex items-center gap-1.5 text-slate-900 font-extrabold text-sm">
                    <span className="text-indigo-600">{ex.sets || 0}</span>
                    <span className="text-[9px] text-slate-300 font-black">×</span>
                    <span>{ex.reps || 0}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 font-black text-[9px]">
                    <Weight size={10} strokeWidth={3} className="text-indigo-600" />
                    <span className="text-slate-700">{ex.weight || 0} kg</span>
                  </div>
                </div>
              </div>
            </div>
          </AccordionTrigger>

          <AccordionContent className="pt-2 pb-8 border-t border-slate-50">
            <div className="space-y-4">
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sets</p>
                  <p className="text-sm font-black text-slate-800">{ex.sets || 0}</p>
                </div>
                <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Reps</p>
                  <p className="text-sm font-black text-slate-800">{ex.reps || 0}</p>
                </div>
                <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Weight</p>
                  <p className="text-sm font-black text-indigo-600">{ex.weight || 0} kg</p>
                </div>
                <div className="bg-orange-50/20 rounded-xl p-3 border border-orange-100/50">
                  <p className="text-[9px] font-bold text-orange-400 uppercase tracking-widest mb-1">Intensity</p>
                  <p className="text-sm font-black text-orange-600">Est. 8.5 RPE</p>
                </div>
              </div>

              {ex.dropSets && (
                <div className="flex items-center gap-3 p-3 bg-amber-50/50 rounded-xl border border-amber-100/50">
                  <Layers size={14} className="text-amber-500" />
                  <div className="flex-1">
                    <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">Drop Set Strategy</p>
                    <p className="text-xs font-black text-amber-800">
                      {ex.dropSets} sets @ {ex.dropWeight} kg drop
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 pb-2">
                <button 
                  onClick={onEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Edit Session Data <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

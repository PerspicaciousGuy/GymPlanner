import { Zap, Weight, Layers, ChevronRight, Activity } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export default function WorkoutLogView({ dayData, sessionKey = 'am', onEdit }) {
  const session = dayData?.[sessionKey];
  const groups = session?.groups || [];
  const standalone = session?.standaloneExercises || [];

  const allExercises = [
    ...groups.flatMap(g => g.rows || []),
    ...standalone.map(ex => {
      const dropCount = (ex.sets || []).filter(s => s.isDrop).length;
      return {
        exercise: ex.exercise,
        muscle: ex.muscle,
        subMuscle: ex.subMuscle,
        sets: ex.sets?.length || 0,
        reps: ex.sets?.length === 1 ? ex.sets[0].reps : 'Varies',
        weight: ex.sets?.length === 1 ? ex.sets[0].weight : (ex.sets?.length ? ex.sets[0].weight : 0),
        dropSets: dropCount > 0 ? dropCount : null,
        isAdvanced: true,
        allSets: ex.sets || []
      };
    })
  ].filter(r => r.exercise);

  if (allExercises.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--app-radius-lg)] border-2 border-dashed border-[var(--app-border)] py-12 text-muted-foreground">
        <Activity size={48} strokeWidth={1} />
        <p className="text-sm font-semibold uppercase tracking-normal">No activity recorded</p>
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full space-y-3">
      {allExercises.map((ex, idx) => (
        <AccordionItem 
          key={idx} 
          value={`item-${idx}`}
          className="group/card relative rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 shadow-[var(--app-shadow-sm)] transition-[box-shadow,border-color] hover:border-[var(--app-border-strong)] hover:shadow-[var(--app-shadow-md)]"
        >
          <div className="absolute bottom-2 left-0 top-2 w-1 rounded-[var(--app-radius-sm)] bg-foreground opacity-0 transition-opacity group-hover/card:opacity-100" />
          
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0 text-left">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] text-foreground md:h-12 md:w-12">
                <Activity size={18} className="md:size-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="break-words text-sm font-semibold uppercase leading-tight tracking-normal text-foreground md:text-base">
                    {ex.exercise}
                  </h3>
                  {ex.dropSets && (
                    <Badge variant="secondary" className="flex items-center gap-0.5 rounded-[var(--app-radius-sm)] border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-semibold uppercase text-amber-600 hover:bg-amber-500/15">
                      <Zap size={8} fill="currentColor" /> Drop
                    </Badge>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Badge variant="outline" className="border-[var(--app-border)] px-1.5 py-0 text-[9px] font-semibold uppercase tracking-normal text-muted-foreground md:text-[10px]">
                    {ex.muscle}
                  </Badge>
                  <span className="text-[9px] font-semibold uppercase tracking-normal text-muted-foreground md:text-[10px]">
                    {ex.subMuscle}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 mr-4">
                <div className="hidden sm:flex flex-col items-end">
                   <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <span>{ex.sets || 0}</span>
                    <span className="text-[9px] font-semibold text-muted-foreground">x</span>
                    <span>{ex.reps || 0}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-semibold text-muted-foreground">
                    <Weight size={10} strokeWidth={3} className="text-foreground" />
                    <span className="text-foreground">{ex.weight || 0} kg</span>
                  </div>
                </div>
              </div>
            </div>
          </AccordionTrigger>

          <AccordionContent className="border-t border-[var(--app-border)] pb-8 pt-2">
            <div className="space-y-4">
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
                  <p className="mb-1 text-[9px] font-semibold uppercase tracking-normal text-muted-foreground">Sets</p>
                  <p className="text-sm font-semibold text-foreground">{ex.sets || 0}</p>
                </div>
                <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
                  <p className="mb-1 text-[9px] font-semibold uppercase tracking-normal text-muted-foreground">Reps</p>
                  <p className="text-sm font-semibold text-foreground">{ex.reps || 0}</p>
                </div>
                <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
                  <p className="mb-1 text-[9px] font-semibold uppercase tracking-normal text-muted-foreground">Weight</p>
                  <p className="text-sm font-semibold text-foreground">{ex.weight || 0} kg</p>
                </div>
                <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
                  <p className="mb-1 text-[9px] font-semibold uppercase tracking-normal text-muted-foreground">Intensity</p>
                  <p className="text-sm font-semibold text-foreground">Est. 8.5 RPE</p>
                </div>
              </div>

              {ex.isAdvanced && ex.allSets.some(s => s.isDrop) && (
                <div className="space-y-2 mt-4">
                  <p className="pl-1 text-[9px] font-semibold uppercase tracking-normal text-amber-600">Drop Set Progressions</p>
                  <div className="flex flex-wrap gap-2">
                    {ex.allSets.filter(s => s.isDrop).map((s, i) => {
                      const drops = s.drops || (s.dropReps || s.dropWeight ? [{ reps: s.dropReps, weight: s.dropWeight }] : []);
                      return drops.map((drop, j) => (
                        <div key={`${i}-${j}`} className="flex items-center gap-2 rounded-[var(--app-radius-sm)] border border-amber-500/20 bg-amber-500/10 p-2">
                          <Zap size={10} className="text-amber-500 fill-current" />
                          <span className="text-[10px] font-semibold text-amber-700">
                            {drop.reps} reps @ {drop.weight} kg
                          </span>
                        </div>
                      ));
                    })}
                  </div>
                </div>
              )}

              {!ex.isAdvanced && ex.dropSets && (
                <div className="mt-4 flex items-center gap-3 rounded-[var(--app-radius-md)] border border-amber-500/20 bg-amber-500/10 p-3">
                  <Layers size={14} className="text-amber-500" />
                  <div className="flex-1">
                    <p className="text-[9px] font-semibold uppercase tracking-normal text-amber-600">Drop Set Strategy</p>
                    <p className="text-xs font-semibold text-amber-700">
                      {ex.dropSets} sets @ {ex.dropWeight} kg drop
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 pb-2">
                <button 
                  onClick={onEdit}
                  className="flex items-center gap-2 rounded-[var(--app-radius-md)] bg-[var(--app-accent-soft)] px-4 py-2 text-[10px] font-semibold uppercase tracking-normal text-foreground transition-colors hover:bg-[var(--app-surface-muted)]"
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

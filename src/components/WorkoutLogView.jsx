import { Zap, Weight, Layers, ChevronRight, Activity } from 'lucide-react';

export default function WorkoutLogView({ dayData, sessionKey = 'am', onEdit }) {
  const session = dayData?.[sessionKey];
  const groups = session?.groups || [];

  const allExercises = groups.flatMap(g => g.rows || []).filter(r => r.exercise);

  if (allExercises.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-slate-300 gap-3 border-2 border-dashed border-slate-100 rounded-3xl">
        <Activity size={48} strokeWidth={1} />
        <p className="font-bold text-sm uppercase tracking-widest text-slate-400">No activity recorded</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {allExercises.map((ex, idx) => (
        <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group/card relative overflow-hidden">
          {/* Accent decoration */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-full opacity-0 group-hover/card:opacity-100 transition-opacity" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3 md:gap-4 flex-1 min-w-0">
              <div className="bg-slate-50 w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-indigo-500 shrink-0 shadow-inner">
                <Activity size={18} className="md:size-5" />
              </div>
              
              <div className="flex-1 min-w-0 pt-0.5 sm:pt-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-sm md:text-base font-black text-slate-800 uppercase tracking-tight leading-tight break-words">
                    {ex.exercise}
                  </h3>
                  {ex.dropSets && (
                    <span className="bg-amber-50 text-amber-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5 border border-amber-100">
                      <Zap size={8} fill="currentColor" /> Drop
                    </span>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ex.muscle}</span>
                  <div className="w-1 h-1 rounded-full bg-slate-200" />
                  <span className="text-[9px] md:text-[10px] font-bold text-indigo-500/70 uppercase tracking-widest">{ex.subMuscle}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-50">
              <div className="text-left sm:text-right flex flex-row sm:flex-col items-center sm:items-end gap-4 sm:gap-0.5">
                <div className="flex items-center gap-1.5 text-slate-900 font-extrabold text-sm">
                  <span className="text-indigo-600">{ex.sets || 0}</span>
                  <span className="text-[9px] text-slate-300 font-black">SETS</span>
                  <span className="text-slate-200 font-light mx-0.5">×</span>
                  <span>{ex.reps || 0}</span>
                  <span className="text-[9px] text-slate-300 font-black">REPS</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400 font-black text-[10px] sm:text-xs">
                  <Weight size={10} strokeWidth={3} className="text-indigo-600" />
                  <span className="text-slate-700">{ex.weight || 0} kg</span>
                </div>
              </div>
              
              <div className="hidden sm:block w-px h-8 bg-slate-100 mx-1" />
              
              <button 
                onClick={onEdit}
                className="p-2 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all"
                title="Edit details"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Expanded Drop Set Detail if exists */}
          {ex.dropSets && (
            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50/50 rounded-lg border border-amber-100/50">
                <Layers size={10} className="text-amber-500" />
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">
                  {ex.dropSets} sets @ {ex.dropWeight} kg drop
                </span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

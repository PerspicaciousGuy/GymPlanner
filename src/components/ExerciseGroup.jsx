import { useState, useCallback, useMemo, memo } from 'react';
import { Plus, Trash2, Layers, ChevronDown } from 'lucide-react';
import { defaultRow } from '../utils/storage';
import ExerciseRow from './ExerciseRow';
import { motion, AnimatePresence } from 'framer-motion';

const COLS = ['Muscle Group', 'Sub Muscle', 'Exercise', 'Sets', 'Reps', 'Weight', 'Drop Reps', 'Drop Weight', ''];

const ExerciseGroup = memo(function ExerciseGroup({ groupIndex, group, onChange, onDeleteGroup, groupCount = 1, workoutDate, sessionKey }) {
  const [isOpen, setIsOpen] = useState(true);

  const handleRowChange = useCallback((rowIdx, updatedRow) => {
    const updatedRows = group.rows.map((r, i) => (i === rowIdx ? updatedRow : r));
    onChange({ ...group, rows: updatedRows });
  }, [group, onChange]);

  const handleDeleteRow = useCallback((rowIdx) => {
    onChange({ ...group, rows: group.rows.filter((_, i) => i !== rowIdx) });
  }, [group, onChange]);

  const handleAddRow = useCallback(() => {
    onChange({ ...group, rows: [...group.rows, defaultRow()] });
    if (!isOpen) setIsOpen(true);
  }, [group, onChange, isOpen]);

  const canDeleteGroup = groupCount > 1 && typeof onDeleteGroup === 'function';

  // Summarize exercises for collapsed view
  const exercisesSummary = group.rows
    .map(r => r.exercise)
    .filter(Boolean)
    .slice(0, 2)
    .join(', ');
  
  const hasMore = group.rows.filter(r => r.exercise).length > 2;

  return (
    <div className="bg-card border border-white/5 rounded-3xl shadow-xl hover:shadow-2xl transition-all overflow-hidden group/card relative">
      <div 
        className="bg-white/5 border-b border-white/5 px-5 py-3 flex items-center justify-between gap-2 cursor-pointer hover:bg-white/10 transition-all group/header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary p-1.5 rounded-xl group-hover/header:bg-primary/20 transition-all shadow-[0_0_10px_rgba(212,255,0,0.1)]">
            <Layers size={14} strokeWidth={3} />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] leading-tight group-hover/header:text-slate-200 transition-colors">
              Performance Block {groupIndex + 1}
            </span>
            {!isOpen && (
              <motion.span 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[10px] text-primary/80 font-black uppercase tracking-widest leading-tight mt-0.5 italic"
              >
                {group.rows.length} {group.rows.length === 1 ? 'LOAD' : 'LOADS'} 
                {exercisesSummary && <span className="text-slate-600 ml-1 font-bold">• {exercisesSummary}{hasMore ? '...' : ''}</span>}
              </motion.span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {canDeleteGroup && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteGroup();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20"
              title="Delete this entire group"
            >
              <Trash2 size={12} />
              <span className="hidden xs:inline">Prune Block</span>
            </button>
          )}

          <motion.div 
            animate={{ rotate: isOpen ? 0 : -90 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="text-slate-500 group-hover/header:text-primary transition-colors"
          >
            <ChevronDown size={14} strokeWidth={3} />
          </motion.div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="overflow-hidden"
          >
            <div className="relative">
              {/* Desktop Table: shown on sm and up */}
              <div className="hidden sm:block overflow-x-auto scrollbar-none">
                <table className="min-w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-white/2 border-b border-white/5">
                      {COLS.map((col, i) => (
                        <th
                          key={i}
                          className={`px-3 py-3 text-left font-black text-[9px] uppercase tracking-[0.2em] text-slate-500 whitespace-nowrap ${
                            col === 'Muscle Group'       ? 'min-w-[130px]'
                            : col === 'Sub Muscle'       ? 'min-w-[130px]'
                            : col === 'Exercise'         ? 'min-w-[200px]'
                            : col === 'Sets'             ? 'min-w-[70px] text-center'
                            : col === 'Reps'             ? 'min-w-[70px] text-center'
                            : col === 'Weight'           ? 'min-w-[90px] text-center'
                            : col === 'Drop Set'         ? 'min-w-[80px] text-center'
                            : col === 'Drop Weight'      ? 'min-w-[100px] text-center'
                            : 'w-10'
                          }`}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {group.rows.map((row, rowIdx) => (
                      <ExerciseRow
                        key={rowIdx}
                        row={row}
                        workoutDate={workoutDate}
                        sessionKey={sessionKey}
                        layout="row"
                        onChange={(updated) => handleRowChange(rowIdx, updated)}
                        onDelete={() => handleDeleteRow(rowIdx)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List: shown below sm */}
              <div className="sm:hidden py-1">
                <AnimatePresence mode="popLayout">
                  {group.rows.map((row, rowIdx) => (
                    <motion.div 
                      key={row.id || `${groupIndex}-${rowIdx}`} 
                      layout="position"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="px-2"
                    >
                      <ExerciseRow
                        row={row}
                        workoutDate={workoutDate}
                        sessionKey={sessionKey}
                        layout="card"
                        onChange={(updated) => handleRowChange(rowIdx, updated)}
                        onDelete={() => handleDeleteRow(rowIdx)}
                      />
                      {/* Distinctive spacer line between cards */}
                      {rowIdx < group.rows.length - 1 && (
                        <div className="mt-4 border-b border-white/5 mx-6" />
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {group.rows.length === 0 && (
                  <div className="p-8 text-center space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No exercises in this group</p>
                    <p className="text-[10px] text-slate-300">Add an exercise to start logging your progress.</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="px-5 py-3 bg-white/2 border-t border-white/5">
              <button
                onClick={handleAddRow}
                className="flex items-center gap-2 text-primary hover:text-primary/80 text-[10px] font-black uppercase tracking-[0.2em] transition-all py-1.5 px-3 rounded-xl hover:bg-primary/10 border border-transparent hover:border-primary/20"
              >
                <Plus size={14} strokeWidth={4} />
                <span>Append Data Load</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default ExerciseGroup;


import { useState, useCallback, useEffect, memo } from 'react';
import { Plus, Trash2, Layers, ChevronDown, X } from 'lucide-react';
import { defaultRow } from '../utils/storage';
import ExerciseRow from './ExerciseRow';
import { motion, AnimatePresence } from 'framer-motion';

const COLS = ['Muscle Group', 'Sub Muscle', 'Exercise', 'Sets', 'Reps', 'Weight', 'Drop Reps', 'Drop Weight', ''];

const ExerciseGroup = memo(function ExerciseGroup({ groupIndex, group, onChange, onDeleteGroup, workoutDate, sessionKey }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    let timer;
    if (isConfirmingDelete) {
      timer = setTimeout(() => setIsConfirmingDelete(false), 3000);
    }
    return () => clearTimeout(timer);
  }, [isConfirmingDelete]);

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

  const canDeleteGroup = typeof onDeleteGroup === 'function';

  const exercisesSummary = group.rows
    .map(r => r.exercise)
    .filter(Boolean)
    .slice(0, 2)
    .join(', ');
  
  const hasMore = group.rows.filter(r => r.exercise).length > 2;

  return (
    <div className="group/card overflow-hidden rounded-[var(--app-radius-lg)] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--app-shadow-sm)] transition-[border-color,box-shadow] hover:border-[var(--app-border-strong)] hover:shadow-[var(--app-shadow-md)]">
      <div 
        className="group/header flex cursor-pointer items-center justify-between gap-2 border-b border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-2 transition-colors hover:bg-[var(--app-surface-raised)]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <div className="rounded-[var(--app-radius-sm)] bg-[var(--app-accent-soft)] p-1 text-foreground transition-colors group-hover/header:bg-[var(--app-surface)]">
            <Layers size={12} strokeWidth={3} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase leading-tight tracking-normal text-muted-foreground">
              Exercise Group {groupIndex + 1}
            </span>
            {!isOpen && (
              <motion.span 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[9px] font-semibold uppercase leading-tight tracking-normal text-[var(--app-text-soft)]"
              >
                {group.rows.length} {group.rows.length === 1 ? 'Exercise' : 'Exercises'} 
                {exercisesSummary && <span className="ml-1 text-muted-foreground/70">- {exercisesSummary}{hasMore ? '...' : ''}</span>}
              </motion.span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {canDeleteGroup && (
            <div className="flex items-center gap-2">
              <AnimatePresence mode="wait">
                {isConfirmingDelete ? (
                  <motion.div 
                    key="confirm"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-1.5"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteGroup();
                      }}
                      className="rounded-[var(--app-radius-sm)] bg-destructive px-2 py-1 text-[10px] font-semibold uppercase tracking-normal text-background shadow-[var(--app-shadow-sm)] transition-colors hover:bg-destructive/90"
                    >
                      Confirm Delete
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsConfirmingDelete(false);
                      }}
                      className="rounded-[var(--app-radius-sm)] p-1 text-muted-foreground transition-colors hover:bg-[var(--app-surface-muted)] hover:text-foreground"
                    >
                      <X size={12} strokeWidth={3} />
                    </button>
                  </motion.div>
                ) : (
                  <motion.button
                    key="delete"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsConfirmingDelete(true);
                    }}
                    className="flex items-center gap-1.5 rounded-[var(--app-radius-sm)] px-2 py-1 text-[10px] font-semibold text-destructive transition-colors hover:bg-destructive/10"
                    title="Delete this entire group"
                  >
                    <Trash2 size={12} />
                    <span className="hidden xs:inline">Remove</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          )}

          <motion.div 
            animate={{ rotate: isOpen ? 0 : -90 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="text-muted-foreground transition-colors group-hover/header:text-foreground"
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
              <div className="hidden sm:block overflow-x-auto scrollbar-none">
                <table className="min-w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--app-border)] bg-[var(--app-surface)]">
                      {COLS.map((col, i) => (
                        <th
                          key={i}
                          className={`whitespace-nowrap px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-normal text-muted-foreground ${
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
                  <tbody className="divide-y divide-[var(--app-border)]">
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
                      {rowIdx < group.rows.length - 1 && (
                        <div className="mx-4 mt-4 border-b border-[var(--app-border)]" />
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {group.rows.length === 0 && (
                  <div className="p-8 text-center space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">No exercises in this group</p>
                    <p className="text-[10px] text-muted-foreground/70">Add an exercise to start logging your progress.</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="border-t border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-1.5">
              <button
                onClick={handleAddRow}
                className="flex items-center gap-2 rounded-[var(--app-radius-sm)] px-2 py-1 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground transition-colors hover:bg-[var(--app-surface)] hover:text-foreground"
              >
                <Plus size={12} strokeWidth={3} />
                <span>Add Row</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default ExerciseGroup;


import { Plus, Trash2, Layers } from 'lucide-react';
import { defaultRow } from '../utils/storage';
import ExerciseRow from './ExerciseRow';

const COLS = ['Muscle Group', 'Sub Muscle', 'Exercise', 'Sets', 'Reps', 'Weight', 'Drop Set', 'Drop Weight', ''];

export default function ExerciseGroup({ groupIndex, group, onChange, onDeleteGroup, groupCount = 1, workoutDate, sessionKey }) {
  const handleRowChange = (rowIdx, updatedRow) => {
    const updatedRows = group.rows.map((r, i) => (i === rowIdx ? updatedRow : r));
    onChange({ ...group, rows: updatedRows });
  };

  const handleDeleteRow = (rowIdx) => {
    onChange({ ...group, rows: group.rows.filter((_, i) => i !== rowIdx) });
  };

  const handleAddRow = () => {
    onChange({ ...group, rows: [...group.rows, defaultRow()] });
  };

  const canDeleteGroup = groupCount > 1 && typeof onDeleteGroup === 'function';

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group/card">
      <div className="bg-slate-50/50 border-b border-slate-100 px-4 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-50 text-indigo-600 p-1 rounded-lg">
            <Layers size={12} strokeWidth={3} />
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Exercise Group {groupIndex + 1}</span>
        </div>
        
        {canDeleteGroup && (
          <button
            onClick={onDeleteGroup}
            className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="Delete this entire group"
          >
            <Trash2 size={12} />
            <span>Remove Group</span>
          </button>
        )}
      </div>

      <div className="overflow-x-auto scrollbar-none relative">
        <div className="sm:hidden absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
        <div className="sm:hidden flex items-center justify-end px-4 py-1.5 bg-slate-50 border-b border-slate-100 italic text-[9px] text-slate-400 font-medium">
          Swipe right to see details →
        </div>
        <table className="min-w-full text-xs border-collapse">

          <thead>
            <tr className="bg-white border-b border-slate-50">
              {COLS.map((col, i) => (
                <th
                  key={i}
                  className={`px-3 py-2 text-left font-bold text-[10px] uppercase tracking-widest text-slate-400 whitespace-nowrap ${
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
          <tbody className="divide-y divide-slate-50">
            {group.rows.map((row, rowIdx) => (
              <ExerciseRow
                key={rowIdx}
                row={row}
                workoutDate={workoutDate}
                sessionKey={sessionKey}
                onChange={(updated) => handleRowChange(rowIdx, updated)}
                onDelete={() => handleDeleteRow(rowIdx)}
              />
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="px-4 py-1.5 bg-slate-50/10 border-t border-slate-50">
        <button
          onClick={handleAddRow}
          className="flex items-center gap-2 text-indigo-500 hover:text-indigo-700 text-[10px] font-bold uppercase tracking-widest transition-colors py-1 px-2 rounded-lg hover:bg-indigo-50"
        >
          <Plus size={12} strokeWidth={3} />
          <span>Add Row</span>
        </button>
      </div>
    </div>
  );
}


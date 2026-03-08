import { defaultRow } from '../utils/storage';
import ExerciseRow from './ExerciseRow';

const COLS = ['Muscle Group', 'Sub Muscle', 'Exercise', 'Sets', 'Reps', 'Weight (kg)', 'Drop Set', 'Drop Wt.', ''];

export default function ExerciseGroup({ groupIndex, group, onChange }) {
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

  const handleDuplicate = () => {
    onChange({ ...group, rows: [...group.rows, ...group.rows.map(r => ({ ...r }))] });
  };

  return (
    <div className="premium-card overflow-hidden transition-all duration-700 hover:shadow-2xl hover:shadow-blue-50/50 bg-white ring-1 ring-black/5">
      {/* Group Header */}
      <div className="px-4 md:px-8 py-4 md:py-5 flex items-center justify-between border-b border-gray-100/50 bg-gray-50/10">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-blue-50 text-[#007AFF] flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2-2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h4 className="font-black text-[#1C1C1E] tracking-tight text-xs md:text-sm">Group {groupIndex + 1}</h4>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 rounded-lg hover:bg-blue-50" onClick={handleDuplicate}>
            <svg className="w-3 md:w-3.5 h-3 md:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
            <span className="hidden md:inline">Duplicate</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="min-w-full data-table">
          <thead className="bg-[#FAFAFA]">
            <tr>
              {COLS.map((col, i) => (
                <th key={i} className="whitespace-nowrap py-3 md:py-4 px-3 md:px-6 text-left">
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#AEAEC0]">
                    {col}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50/50">
            {group.rows.map((row, rowIdx) => (
              <ExerciseRow
                key={`${groupIndex}-${rowIdx}`}
                row={row}
                onChange={(updated) => handleRowChange(rowIdx, updated)}
                onDelete={() => handleDeleteRow(rowIdx)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Actions */}
      <div className="px-4 md:px-8 py-4 md:py-5 border-t border-gray-50 flex items-center justify-between bg-white text-gray-400">
        <button
          onClick={handleAddRow}
          className="text-[10px] md:text-[11px] font-black uppercase tracking-widest flex items-center gap-2 text-[#007AFF] hover:bg-blue-50 px-3 md:px-4 py-2 rounded-xl transition-all"
        >
          <span className="text-base md:text-lg leading-none">+</span>
          Add Exercise
        </button>

        <div className="hidden md:flex items-center gap-2">
          <svg className="w-4 h-4 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Duplicate Group</span>
        </div>
      </div>
    </div>
  );
}

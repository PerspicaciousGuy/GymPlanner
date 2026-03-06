import { defaultRow } from '../utils/storage';
import ExerciseRow from './ExerciseRow';

const COLS = ['Muscle Group', 'Sub Muscle', 'Exercise', 'Sets', 'Reps', 'Weight (kg)', 'Drop Set', 'Drop Weight (kg)', ''];

/**
 * ExerciseGroup — one group card with 3 exercise rows.
 * Props:
 *   groupIndex  – 0-based
 *   group       – { rows: [row, row, row] }
 *   onChange    – (updatedGroup) => void
 */
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

  // Badge: show distinct exercises selected in this group
  const exercises = group.rows.map((r) => r.exercise).filter(Boolean);
  const badge = exercises.length > 0 ? exercises.join(', ') : null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center">
        <span className="font-semibold text-gray-700">Group {groupIndex + 1}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              {COLS.map((col, i) => (
                <th
                  key={i}
                  className={`px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap${
                    col === 'Muscle Group'       ? ' min-w-[140px]'
                    : col === 'Sub Muscle'       ? ' min-w-[140px]'
                    : col === 'Exercise'         ? ' min-w-[220px]'
                    : col === 'Sets'             ? ' min-w-[90px]'
                    : col === 'Reps'             ? ' min-w-[90px]'
                    : col === 'Weight (kg)'      ? ' min-w-[120px]'
                    : col === 'Drop Set'         ? ' min-w-[100px]'
                    : col === 'Drop Weight (kg)' ? ' min-w-[140px]'
                    : ' w-8'
                  }`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {group.rows.map((row, rowIdx) => (
              <ExerciseRow
                key={rowIdx}
                row={row}
                onChange={(updated) => handleRowChange(rowIdx, updated)}
                onDelete={() => handleDeleteRow(rowIdx)}
              />
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 border-t border-gray-100">
        <button
          onClick={handleAddRow}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 transition-colors"
        >
          <span className="text-base leading-none">+</span> Add Row
        </button>
      </div>
    </div>
  );
}

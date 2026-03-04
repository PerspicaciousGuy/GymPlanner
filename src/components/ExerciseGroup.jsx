import ExerciseRow from './ExerciseRow';

const COLS = ['Exercise', 'Sets', 'Reps', 'Weight (kg)', 'Drop Set', 'Drop Weight (kg)'];

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

  // Badge: show distinct exercises selected in this group
  const exercises = group.rows.map((r) => r.exercise).filter(Boolean);
  const badge = exercises.length > 0 ? exercises.join(', ') : null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <span className="font-semibold text-gray-700">Group {groupIndex + 1}</span>
        {badge && (
          <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full truncate max-w-xs">
            {badge}
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              {COLS.map((col) => (
                <th key={col} className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">
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
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

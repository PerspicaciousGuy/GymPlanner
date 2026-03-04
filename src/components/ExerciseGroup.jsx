import ExerciseRow from './ExerciseRow';

/**
 * ExerciseGroup — card wrapper for one exercise group.
 * Renders a header and the 7-column ExerciseRow inside a scrollable table.
 *
 * Props:
 *   groupNumber – 1-based group index label
 *   row         – the row data object
 *   onChange    – (updatedRow) => void
 */
export default function ExerciseGroup({ groupNumber, row, onChange }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <span className="font-semibold text-gray-700">Group {groupNumber}</span>
        {row.exercise && (
          <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
            {row.exercise}
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">Muscle Group</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">Sub Muscle</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">Exercise</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">Sets</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">Reps</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">Weight (kg)</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">Notes</th>
            </tr>
          </thead>
          <tbody>
            <ExerciseRow row={row} onChange={onChange} />
          </tbody>
        </table>
      </div>
    </div>
  );
}

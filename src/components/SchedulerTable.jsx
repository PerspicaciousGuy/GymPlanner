import { DAYS, SCHEDULER_OPTIONS } from '../data/exerciseDatabase';

export default function SchedulerTable({ schedule, onChange }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full bg-white text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left font-semibold text-gray-600 w-40">Day</th>
            <th className="px-6 py-3 text-left font-semibold text-gray-600">Muscle Group</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {DAYS.map((day) => (
            <tr key={day} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-3 font-medium text-gray-800">{day}</td>
              <td className="px-6 py-3">
                <select
                  value={schedule[day] || ''}
                  onChange={(e) => onChange(day, e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 w-48"
                >
                  <option value="">— Select —</option>
                  {SCHEDULER_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

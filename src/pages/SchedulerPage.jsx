import { useState, useEffect } from 'react';
import SchedulerTable from '../components/SchedulerTable';
import { loadSchedule, saveSchedule } from '../utils/storage';
import { DAYS } from '../data/exerciseDatabase';

function buildDefaultSchedule() {
  return DAYS.reduce((acc, day) => ({ ...acc, [day]: '' }), {});
}

export default function SchedulerPage() {
  const [schedule, setSchedule] = useState(() => {
    const loaded = loadSchedule();
    return Object.keys(loaded).length > 0 ? loaded : buildDefaultSchedule();
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (saved) {
      const t = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(t);
    }
  }, [saved]);

  const handleChange = (day, value) => {
    setSchedule((prev) => ({ ...prev, [day]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    saveSchedule(schedule);
    setSaved(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Workout Scheduler</h1>
      <p className="text-gray-500 mb-6 text-sm">
        Assign a muscle group to each day of the week. Your schedule persists in your browser.
      </p>

      <SchedulerTable schedule={schedule} onChange={handleChange} />

      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded transition-colors shadow-sm"
        >
          Save Schedule
        </button>
        {saved && (
          <span className="text-green-600 font-medium text-sm">✓ Schedule saved!</span>
        )}
      </div>
    </div>
  );
}

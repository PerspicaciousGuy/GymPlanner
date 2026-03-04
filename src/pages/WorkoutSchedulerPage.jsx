import { useMemo } from 'react';
import WorkoutSection from '../components/WorkoutSection';
import { loadSchedule, loadWorkouts, isDayComplete, defaultDayWorkout } from '../utils/storage';
import { DAYS } from '../data/exerciseDatabase';

function getDayName(date) {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getDayName(d);
}

export default function WorkoutSchedulerPage() {
  const today     = getDayName(new Date());
  const yesterday = getYesterday();

  const schedule  = loadSchedule();
  const workouts  = loadWorkouts();

  // Determine if yesterday was missed (scheduled, not completed, not Rest)
  const yesterdayMuscle = schedule[yesterday] || '';
  const yesterdayMissed =
    yesterdayMuscle &&
    yesterdayMuscle !== 'Rest' &&
    !isDayComplete(yesterday);

  const todayMuscle = schedule[today] || '';

  // Pre-load stored data or fall back to defaults
  const sections = useMemo(() => {
    const list = [];
    if (yesterdayMissed) {
      list.push({
        day: yesterday,
        muscleGroup: yesterdayMuscle,
        isMissed: true,
        data: workouts[yesterday] || defaultDayWorkout(),
      });
    }
    list.push({
      day: today,
      muscleGroup: todayMuscle,
      isMissed: false,
      data: workouts[today] || defaultDayWorkout(),
    });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Workout Scheduler</h1>
        <p className="text-gray-500 text-sm">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {sections.length === 0 && (
        <div className="bg-gray-100 rounded-lg px-6 py-8 text-center text-gray-500">
          No workout scheduled for today. Set up your weekly schedule to get started.
        </div>
      )}

      {sections.map((s) => (
        <WorkoutSection
          key={s.day}
          day={s.day}
          muscleGroup={s.muscleGroup}
          isMissed={s.isMissed}
          initialData={s.data}
        />
      ))}
    </div>
  );
}

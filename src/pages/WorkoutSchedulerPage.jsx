import { useMemo } from 'react';
import WorkoutSection from '../components/WorkoutSection';
import { loadSchedule, loadWorkouts, isDayComplete, defaultDayWorkout, ensureAmPm } from '../utils/storage';
import { DAYS } from '../data/exerciseDatabase';

function getDayName(date) {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getDayName(d);
}

function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return getDayName(d);
}

export default function WorkoutSchedulerPage() {
  const today     = getDayName(new Date());
  const yesterday = getYesterday();
  const tomorrow  = getTomorrow();

  const schedule  = loadSchedule();
  const workouts  = loadWorkouts();

  // Yesterday is missed if it was scheduled (non-Rest) and neither session is done
  const yesterdayMuscle = schedule[yesterday] || '';
  const yesterdayMissed =
    yesterdayMuscle &&
    yesterdayMuscle !== 'Rest' &&
    !isDayComplete(yesterday, 'am') &&
    !isDayComplete(yesterday, 'pm');

  const todayMuscle    = schedule[today]    || '';
  const tomorrowMuscle = schedule[tomorrow] || '';

  const sections = useMemo(() => {
    const list = [];
    if (yesterdayMissed) {
      list.push({
        day: yesterday,
        muscleGroup: yesterdayMuscle,
        isMissed: true,
        isTomorrow: false,
        data: ensureAmPm(workouts[yesterday]),
      });
    }
    list.push({
      day: today,
      muscleGroup: todayMuscle,
      isMissed: false,
      isTomorrow: false,
      data: ensureAmPm(workouts[today]),
    });
    list.push({
      day: tomorrow,
      muscleGroup: tomorrowMuscle,
      isMissed: false,
      isTomorrow: true,
      data: ensureAmPm(workouts[tomorrow]),
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

      {sections.map((s) => (
        <WorkoutSection
          key={s.day}
          day={s.day}
          muscleGroup={s.muscleGroup}
          isMissed={s.isMissed}
          isTomorrow={s.isTomorrow}
          initialData={s.data}
        />
      ))}
    </div>
  );
}

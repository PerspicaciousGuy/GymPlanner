import { loadWorkouts, loadCompletion, getEffectiveSessionTitle } from '../../utils/storage';
import { formatDateDisplay, formatDateKey } from '../../utils/dateUtils';
import { calculateRecovery } from '../../utils/recoveryLogic';

function getStartDate(timeRange) {
  const today = new Date();
  const startDate = new Date(timeRange === 'all' ? 0 : today);

  if (timeRange === '30d') {
    startDate.setDate(today.getDate() - 30);
  } else if (timeRange === '90d') {
    startDate.setDate(today.getDate() - 90);
  } else if (timeRange === '1y') {
    startDate.setFullYear(today.getFullYear() - 1);
  }

  return startDate;
}

function getPreviousStartDate(timeRange, startDate) {
  const previousStartDate = new Date(startDate);

  if (timeRange === '30d') {
    previousStartDate.setDate(previousStartDate.getDate() - 30);
  } else if (timeRange === '90d') {
    previousStartDate.setDate(previousStartDate.getDate() - 90);
  } else if (timeRange === '1y') {
    previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
  } else {
    previousStartDate.setTime(0);
  }

  return previousStartDate;
}

function isOffSession(text) {
  if (!text) return true;
  const normalized = String(text).toLowerCase().trim();
  return (
    normalized === '' ||
    normalized === 'off' ||
    normalized === 'rest' ||
    normalized.startsWith('off ') ||
    normalized.startsWith('rest ')
  );
}

function calculateTrend(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function addGroupRowVolume(row) {
  const weight = parseFloat(row.weight) || 0;
  const sets = parseInt(row.sets) || 0;
  const reps = parseInt(row.reps) || 0;
  let volume = weight * sets * reps;

  if (row.dropSets && row.dropWeight) {
    volume += (parseInt(row.dropSets) || 0) * (parseFloat(row.dropWeight) || 0) * reps;
  }

  return volume;
}

function addStandaloneSetVolume(set) {
  const weight = parseFloat(set.weight) || 0;
  const reps = parseInt(set.reps) || 0;
  let volume = weight * reps;
  const drops = set.drops || (set.isDrop && (set.dropWeight || set.dropReps)
    ? [{ weight: set.dropWeight, reps: set.dropReps }]
    : []);

  drops.forEach((drop) => {
    const dropWeight = parseFloat(drop.weight) || 0;
    const dropReps = parseInt(drop.reps) || 0;
    volume += dropWeight * dropReps;
  });

  return volume;
}

function processMuscleSession(session, map) {
  (session.groups || []).forEach((group) => {
    (group.rows || []).forEach((row) => {
      if (!row.muscle) return;

      const muscle = row.muscle;
      if (!map[muscle]) map[muscle] = { sets: 0, volume: 0 };

      const sets = parseInt(row.sets) || 0;
      const reps = parseInt(row.reps) || 0;
      const weight = parseFloat(row.weight) || 0;
      map[muscle].sets += sets;
      map[muscle].volume += sets * reps * weight;
    });
  });

  (session.standaloneExercises || []).forEach((exercise) => {
    if (!exercise.muscle) return;

    const muscle = exercise.muscle;
    if (!map[muscle]) map[muscle] = { sets: 0, volume: 0 };

    (exercise.sets || []).forEach((set) => {
      map[muscle].sets += 1;
      map[muscle].volume += addStandaloneSetVolume(set);
    });
  });
}

function formatMuscleMap(map) {
  return Object.entries(map)
    .map(([name, data]) => ({
      name,
      sets: data.sets,
      volume: Math.round(data.volume),
    }))
    .sort((a, b) => b.sets - a.sets);
}

function buildPersonalRecords(exerciseHistory) {
  return Object.entries(exerciseHistory)
    .map(([name, history]) => {
      const best = [...history].sort((a, b) => b.weight - a.weight)[0];
      return { name, ...best };
    })
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);
}

export function buildAnalyticsData(timeRange) {
  const workouts = loadWorkouts();
  const completion = loadCompletion();
  const startDate = getStartDate(timeRange);
  const startDateString = formatDateKey(startDate);
  const prevStartStr = formatDateKey(getPreviousStartDate(timeRange, startDate));
  const prevEndStr = startDateString;

  let totalVolume = 0;
  let completedSessions = 0;
  let plannedSessions = 0;
  let prevTotalVolume = 0;
  let prevCompletedSessions = 0;
  let prevPlannedSessions = 0;

  const volumeHistory = [];
  const muscleMap = {};
  const prevMuscleMap = {};
  const exerciseList = new Set();
  const exerciseHistory = {};

  Object.keys(workouts).sort().forEach((date) => {
    if (date < prevStartStr) return;

    const isCurrentPeriod = date >= startDateString;
    const isPrevPeriod = date >= prevStartStr && date < prevEndStr;
    const dayData = workouts[date];
    let dayVolume = 0;
    let exerciseCount = 0;
    const dailyMuscles = new Set();

    ['am', 'pm'].forEach((sessionKey) => {
      const scheduledTitle = getEffectiveSessionTitle(new Date(date), sessionKey);
      const isSessionPlanned = !isOffSession(scheduledTitle);
      const isCompleted = completion[`${date}_${sessionKey}`] === true;
      const session = dayData?.[sessionKey] || {};

      if (isSessionPlanned) {
        if (isCurrentPeriod) plannedSessions++;
        if (isPrevPeriod) prevPlannedSessions++;
      }

      if (isCurrentPeriod) {
        processMuscleSession(session, muscleMap);
      } else if (isPrevPeriod) {
        processMuscleSession(session, prevMuscleMap);
      }

      if (!isCompleted) return;

      if (isCurrentPeriod) completedSessions++;
      if (isPrevPeriod) prevCompletedSessions++;

      (session.groups || []).forEach((group) => {
        (group.rows || []).forEach((row) => {
          dayVolume += addGroupRowVolume(row);

          if (isCurrentPeriod && row.exercise) {
            exerciseCount++;
            if (row.muscle) dailyMuscles.add(row.muscle);
          }

          if (isCurrentPeriod && row.exercise && row.weight) {
            const name = row.exercise.trim();
            exerciseList.add(name);
            if (!exerciseHistory[name]) exerciseHistory[name] = [];
            exerciseHistory[name].push({
              date,
              weight: parseFloat(row.weight),
              reps: parseInt(row.reps),
            });
          }
        });
      });

      (session.standaloneExercises || []).forEach((exercise) => {
        if (isCurrentPeriod && exercise.exercise) {
          exerciseCount++;
          if (exercise.muscle) dailyMuscles.add(exercise.muscle);

          const name = exercise.exercise.trim();
          exerciseList.add(name);
          if (!exerciseHistory[name]) exerciseHistory[name] = [];

          (exercise.sets || []).forEach((set) => {
            if (set.weight && set.reps) {
              exerciseHistory[name].push({
                date,
                weight: parseFloat(set.weight),
                reps: parseInt(set.reps),
              });
            }
          });
        }

        (exercise.sets || []).forEach((set) => {
          dayVolume += addStandaloneSetVolume(set);
        });
      });
    });

    if (isCurrentPeriod) {
      totalVolume += dayVolume;
      if (dayVolume > 0) {
        volumeHistory.push({
          date,
          displayDate: formatDateDisplay(date),
          volume: dayVolume,
          exerciseCount,
          muscles: Array.from(dailyMuscles),
        });
      }
    } else if (isPrevPeriod) {
      prevTotalVolume += dayVolume;
    }
  });

  const muscleData = formatMuscleMap(muscleMap);
  const prevMuscleData = formatMuscleMap(prevMuscleMap);
  const personalRecords = buildPersonalRecords(exerciseHistory);
  const sessionsTrend = timeRange === 'all' ? null : calculateTrend(completedSessions, prevCompletedSessions);
  const compliance = plannedSessions > 0 ? Math.round((completedSessions / plannedSessions) * 100) : 100;
  const prevCompliance = prevPlannedSessions > 0 ? Math.round((prevCompletedSessions / prevPlannedSessions) * 100) : 100;
  const complianceTrend = timeRange === 'all' ? null : calculateTrend(compliance, prevCompliance);
  const recoveryData = calculateRecovery(Object.entries(workouts).flatMap(([date, day]) =>
    ['am', 'pm'].map((session) => ({ date, ...day[session], session }))
  ));

  return {
    volumeHistory,
    muscleData,
    prevMuscleData,
    totalVolume,
    prevTotalVolume,
    completedSessions,
    plannedSessions,
    compliance,
    volumeTrend: timeRange === 'all' ? null : calculateTrend(totalVolume, prevTotalVolume),
    sessionsTrend,
    complianceTrend,
    exerciseHistory,
    personalRecords,
    recoveryData,
    exerciseList: Array.from(exerciseList).sort(),
    insights: {
      highestVolumeDay: [...volumeHistory].sort((a, b) => b.volume - a.volume)[0],
      topMuscle: muscleData[0],
      prevTopMuscle: prevMuscleData[0],
      topExercise: Object.entries(exerciseHistory)
        .map(([name, history]) => ({ name, count: history.length }))
        .sort((a, b) => b.count - a.count)[0],
    },
  };
}

export function buildSelectedExerciseData(exerciseFilter, exerciseHistory) {
  if (exerciseFilter === 'All') return [];

  const history = exerciseHistory[exerciseFilter] || [];
  const dailyBest = {};

  history.forEach((item) => {
    const { date, weight, reps } = item;
    const est1RM = reps > 1 ? Math.round(weight * (36 / (37 - reps))) : weight;

    if (!dailyBest[date] || weight > dailyBest[date].weight) {
      dailyBest[date] = {
        date,
        weight,
        reps,
        est1RM,
      };
    }
  });

  return Object.values(dailyBest).sort((a, b) => a.date.localeCompare(b.date));
}

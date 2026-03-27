import { MuscleType } from '../components/InteractiveMuscleMap/AnatomyData';

/**
 * Advanced Muscle Science Configuration
 * Defines specific recovery windows (in hours) for different muscle groups based on size and complexity.
 */
const RECOVERY_PROFILES = {
  // LARGE: 48-72h recovery
  [MuscleType.QUADRICEPS]: { fatigueLimit: 36, recoveryLimit: 72 },
  [MuscleType.HAMSTRING]: { fatigueLimit: 36, recoveryLimit: 72 },
  [MuscleType.GLUTEAL]: { fatigueLimit: 36, recoveryLimit: 72 },
  [MuscleType.LOWER_BACK]: { fatigueLimit: 36, recoveryLimit: 64 },
  
  // MEDIUM: 36-48h recovery
  [MuscleType.UPPER_BACK]: { fatigueLimit: 24, recoveryLimit: 54 },
  [MuscleType.CHEST]: { fatigueLimit: 24, recoveryLimit: 48 },
  [MuscleType.TRAPEZIUS]: { fatigueLimit: 24, recoveryLimit: 48 },
  [MuscleType.FRONT_DELTOIDS]: { fatigueLimit: 20, recoveryLimit: 44 },
  [MuscleType.BACK_DELTOIDS]: { fatigueLimit: 20, recoveryLimit: 44 },
  
  // SMALL: 24-36h recovery
  [MuscleType.BICEPS]: { fatigueLimit: 18, recoveryLimit: 36 },
  [MuscleType.TRICEPS]: { fatigueLimit: 18, recoveryLimit: 36 },
  [MuscleType.CALVES]: { fatigueLimit: 24, recoveryLimit: 36 },
  
  // ENDURANCE / FAST RECOVERY: 12-24h
  [MuscleType.ABS]: { fatigueLimit: 8, recoveryLimit: 18 },
  [MuscleType.OBLIQUES]: { fatigueLimit: 8, recoveryLimit: 18 },
  [MuscleType.FOREARM]: { fatigueLimit: 12, recoveryLimit: 24 },
};

/**
 * Secondary Fatigue Mapping (Accessory Muscles)
 * When a primary muscle is trained, these secondary muscles receive partial fatigue.
 */
const SECONDARY_FATIGUE = {
  [MuscleType.CHEST]: [MuscleType.TRICEPS, MuscleType.FRONT_DELTOIDS],
  [MuscleType.UPPER_BACK]: [MuscleType.BICEPS, MuscleType.BACK_DELTOIDS],
  [MuscleType.LOWER_BACK]: [MuscleType.HAMSTRING, MuscleType.GLUTEAL],
  [MuscleType.QUADRICEPS]: [MuscleType.GLUTEAL, MuscleType.CALVES],
  [MuscleType.FRONT_DELTOIDS]: [MuscleType.TRICEPS],
};

/**
 * Maps standard exercise muscle labels to internal Anatomy IDs
 */
const MUSCLE_MAPPING = {
  'chest': [MuscleType.CHEST],
  'back': [MuscleType.UPPER_BACK, MuscleType.LOWER_BACK, MuscleType.TRAPEZIUS],
  'shoulders': [MuscleType.FRONT_DELTOIDS, MuscleType.BACK_DELTOIDS],
  'arms': [MuscleType.BICEPS, MuscleType.TRICEPS, MuscleType.FOREARM],
  'legs': [MuscleType.QUADRICEPS, MuscleType.HAMSTRING, MuscleType.GLUTEAL, MuscleType.CALVES],
  'core': [MuscleType.ABS, MuscleType.OBLIQUES],
  'biceps': [MuscleType.BICEPS],
  'triceps': [MuscleType.TRICEPS],
  'forearms': [MuscleType.FOREARM],
  'quadriceps': [MuscleType.QUADRICEPS],
  'quads': [MuscleType.QUADRICEPS],
  'hamstrings': [MuscleType.HAMSTRING],
  'glutes': [MuscleType.GLUTEAL],
  'calves': [MuscleType.CALVES],
  'abs': [MuscleType.ABS],
  'upper abs': [MuscleType.ABS],
  'lower abs': [MuscleType.ABS],
  'obliques': [MuscleType.OBLIQUES],
  'traps': [MuscleType.TRAPEZIUS],
  'lats': [MuscleType.LOWER_BACK, MuscleType.UPPER_BACK],
  'upper back': [MuscleType.UPPER_BACK, MuscleType.TRAPEZIUS],
  'mid back': [MuscleType.LOWER_BACK],
};

const DEFAULT_PROFILE = { fatigueLimit: 24, recoveryLimit: 48 };

/**
 * Calculates muscle recovery status based on workout history
 * @param {Array} history - Workout log history
 * @returns {Object} - Map of muscleKey -> { status, lastTrained, hoursSince }
 */
export const calculateRecovery = (history) => {
  const now = new Date();
  const muscleStates = {};

  // Sort history newest first to prioritize the most recent data
  const sortedHistory = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));

  sortedHistory.forEach(session => {
    const sessionDate = new Date(session.date);
    const hoursSince = (now - sessionDate) / (1000 * 60 * 60);

    const trainedMuscles = new Set();
    
    // 1. Collect all muscles trained in this session
    session.groups?.forEach(group => {
      group.rows?.forEach(row => {
        if (row.exercise && (row.sets || row.weight)) {
          getAnatomyKeys(row.muscle, row.subMuscle).forEach(k => trainedMuscles.add(k));
        }
      });
    });

    session.standaloneExercises?.forEach(ex => {
      if (ex.exercise) {
        getAnatomyKeys(ex.muscle || ex.muscleGroup, ex.subMuscle).forEach(k => trainedMuscles.add(k));
      }
    });

    // 2. Process Primary Fatigue
    trainedMuscles.forEach(key => {
      if (!muscleStates[key]) {
        muscleStates[key] = determineState(key, hoursSince, session.date);
      }
      
      // 3. Process Secondary Fatigue (Accessory Muscles)
      // Accessory fatigue is modeled as a slightly less severe state ('recovering' instead of 'fatigued')
      const accessories = SECONDARY_FATIGUE[key] || [];
      accessories.forEach(accKey => {
        if (!muscleStates[accKey]) {
          // If we haven't seen this accessory trained PRIMARILY yet, 
          // give it a "Secondary" fatigue status (Recovering).
          const accProfile = RECOVERY_PROFILES[accKey] || DEFAULT_PROFILE;
          if (hoursSince < accProfile.recoveryLimit) {
            muscleStates[accKey] = {
              status: 'recovering',
              hoursSince: Math.round(hoursSince),
              lastTrained: session.date,
              isAccessory: true // Helpful for tooltips later
            };
          }
        }
      });
    });
  });

  return muscleStates;
};

/**
 * Helper to determine the state of a specific muscle based on hours and its unique profile
 */
function determineState(key, hoursSince, date) {
  const profile = RECOVERY_PROFILES[key] || DEFAULT_PROFILE;
  
  let status = 'recovered';
  if (hoursSince < profile.fatigueLimit) status = 'fatigued';
  else if (hoursSince < profile.recoveryLimit) status = 'recovering';

  return {
    status,
    hoursSince: Math.round(hoursSince),
    lastTrained: date,
    intensity: hoursSince < (profile.recoveryLimit + 24) ? 'Active' : 'Doughnut'
  };
}

/**
 * Helper to map labels to anatomy IDs
 */
function getAnatomyKeys(main, sub) {
  const targetSub = sub?.toLowerCase();
  const targetMain = main?.toLowerCase();

  const keys = [
    ...(MUSCLE_MAPPING[targetSub] || []),
    ...(!targetSub ? (MUSCLE_MAPPING[targetMain] || []) : [])
  ];
  
  if (keys.length === 0 && targetMain) {
    keys.push(...(MUSCLE_MAPPING[targetMain] || []));
  }

  return keys;
}

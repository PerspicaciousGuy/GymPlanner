// Central exercise database: Muscle Group → Sub Muscle → Exercise list
export const exerciseDatabase = {
  Chest: {
    'Upper Chest': [
      'Incline Barbell Bench Press',
      'Incline Dumbbell Press',
      'Low to High Cable Fly',
    ],
    'Middle Chest': [
      'Flat Barbell Bench Press',
      'Flat Dumbbell Press',
      'Machine Chest Press',
    ],
    'Lower Chest': [
      'Decline Bench Press',
      'Chest Dips',
      'Cable Crossover Low',
    ],
  },

  Back: {
    Lats: [
      'Pull Ups',
      'Lat Pulldown',
      'Straight Arm Pulldown',
    ],
    'Mid Back': [
      'Seated Cable Row',
      'T Bar Row',
      'Bent Over Barbell Row',
    ],
    'Lower Back': [
      'Hyperextensions',
      'Deadlift',
      'Good Mornings',
    ],
  },

  Legs: {
    Quads: [
      'Barbell Squat',
      'Leg Press',
      'Leg Extension',
    ],
    Hamstrings: [
      'Romanian Deadlift',
      'Lying Leg Curl',
      'Seated Leg Curl',
    ],
    Calves: [
      'Standing Calf Raise',
      'Seated Calf Raise',
      'Leg Press Calf Raise',
    ],
  },

  Shoulders: {
    'Front Delts': [
      'Overhead Press',
      'Dumbbell Front Raise',
      'Arnold Press',
    ],
    'Side Delts': [
      'Lateral Raise',
      'Cable Lateral Raise',
      'Machine Lateral Raise',
    ],
    'Rear Delts': [
      'Face Pulls',
      'Reverse Flyes',
      'Bent Over Lateral Raise',
    ],
  },

  Arms: {
    Biceps: [
      'Barbell Curl',
      'Dumbbell Curl',
      'Hammer Curl',
    ],
    Triceps: [
      'Tricep Pushdown',
      'Skull Crushers',
      'Overhead Tricep Extension',
    ],
    Forearms: [
      'Wrist Curl',
      'Reverse Curl',
      'Farmers Carry',
    ],
  },

  Core: {
    Abs: [
      'Crunches',
      'Hanging Leg Raises',
      'Cable Crunch',
    ],
    Obliques: [
      'Russian Twists',
      'Side Plank',
      'Woodchoppers',
    ],
    'Lower Core': [
      'Plank',
      'Dead Bug',
      'Ab Wheel Rollout',
    ],
  },
};

// All trainable muscle group keys (excludes Rest — used separately in the scheduler)
export const muscleGroupKeys = Object.keys(exerciseDatabase);

// Days of the week for the scheduler
export const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

// Scheduler dropdown options = all muscle groups + Rest day
export const SCHEDULER_OPTIONS = [...muscleGroupKeys, 'Rest'];

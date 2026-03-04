// Hierarchical exercise data: Muscle Group → Sub Muscle → Exercises
export const exerciseData = {
  Chest: {
    'Upper Chest': [
      'Incline Bench Press',
      'Incline Dumbbell Press',
      'Cable Crossover High',
    ],
    'Middle Chest': [
      'Flat Bench Press',
      'Machine Chest Press',
      'Dumbbell Flyes',
    ],
    'Lower Chest': [
      'Decline Bench Press',
      'Dips',
      'Cable Crossover Low',
    ],
  },
  Back: {
    Lats: [
      'Lat Pulldown',
      'Pull Ups',
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

export const muscleGroups = Object.keys(exerciseData);

export const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const SCHEDULER_MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Legs',
  'Shoulders',
  'Arms',
  'Core',
  'Rest',
];

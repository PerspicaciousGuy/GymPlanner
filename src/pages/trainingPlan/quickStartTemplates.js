import { createCycleSlot, defaultTrainingPlan } from '../../utils/trainingPlan';

export const quickStartTemplates = [
  {
    id: 'ppl-rest',
    name: 'Push Pull Legs',
    description: 'A rotating 4-day cycle for strength or hypertrophy blocks.',
    mode: 'dynamic',
    slots: [
      { name: 'Push', type: 'workout' },
      { name: 'Pull', type: 'workout' },
      { name: 'Legs', type: 'workout' },
      { name: 'Rest', type: 'rest' },
    ],
  },
  {
    id: 'upper-lower',
    name: 'Upper Lower',
    description: 'A balanced 6-day cycle with two upper and two lower days.',
    mode: 'dynamic',
    slots: [
      { name: 'Upper', type: 'workout' },
      { name: 'Lower', type: 'workout' },
      { name: 'Rest', type: 'rest' },
      { name: 'Upper', type: 'workout' },
      { name: 'Lower', type: 'workout' },
      { name: 'Rest', type: 'rest' },
    ],
  },
  {
    id: 'full-body-3-day',
    name: 'Full Body 3-Day',
    description: 'A simple fixed-week plan for Monday, Wednesday, and Friday.',
    mode: 'fixed',
    fixedWeek: {
      am: {
        Monday: 'Full Body',
        Wednesday: 'Full Body',
        Friday: 'Full Body',
      },
      pm: {},
      amSubtitles: {},
      pmSubtitles: {},
    },
  },
];

export function createPlanFromQuickStartTemplate(template) {
  const plan = defaultTrainingPlan();
  plan.name = template.name;
  plan.mode = template.mode;
  plan.loggingStyle = 'advanced';

  if (template.mode === 'dynamic') {
    plan.cycle = template.slots.map((slot) => createCycleSlot(slot.name, slot.type));
  }

  if (template.mode === 'fixed') {
    plan.fixedWeek = {
      am: template.fixedWeek?.am || {},
      pm: template.fixedWeek?.pm || {},
      amSubtitles: template.fixedWeek?.amSubtitles || {},
      pmSubtitles: template.fixedWeek?.pmSubtitles || {},
    };
  }

  return plan;
}

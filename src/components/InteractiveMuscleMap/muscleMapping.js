import catalog from './vendor/muscles.json';

// These are broad existing workout groups, not separate anatomical measurements.
// Null deliberately leaves muscles without an honest equivalent unsupported.
export const APP_MUSCLE_BY_ID = {
  sternocleidomastoid: 'neck',
  trapezius: 'trapezius',
  anterior_deltoid: 'front-deltoids',
  lateral_deltoid: null,
  posterior_deltoid: 'back-deltoids',
  pectoralis_major: 'chest',
  biceps_brachii: 'biceps',
  brachialis: null,
  serratus_anterior: null,
  rectus_abdominis: 'abs',
  external_oblique: 'obliques',
  forearm_flexors: 'forearm',
  tensor_fasciae_latae: 'abductors',
  hip_adductors: 'adductor',
  sartorius: null,
  rectus_femoris: 'quadriceps',
  vastus_lateralis: 'quadriceps',
  vastus_medialis: 'quadriceps',
  tibialis_anterior: null,
  gastrocnemius: 'calves',
  fibularis_group: null,
  soleus: 'calves',
  posterior_rotator_cuff: null,
  triceps_brachii: 'triceps',
  latissimus_dorsi: 'upper-back',
  erector_spinae: 'lower-back',
  forearm_extensors: 'forearm',
  gluteus_medius: 'abductors',
  gluteus_maximus: 'gluteal',
  biceps_femoris: 'hamstring',
  medial_hamstrings: 'hamstring',
};

export const SELECTABLE_MUSCLES = catalog.muscles.filter(muscle => muscle.selectable);

/** Translate stable upstream IDs without inferring recovery for unmapped muscles. */
export function getMuscleStatus(muscleId, muscleStats) {
  const appMuscle = APP_MUSCLE_BY_ID[muscleId];
  if (!appMuscle) return 'Not tracked separately in this app';
  const stat = muscleStats[appMuscle];
  return stat ? `${appMuscle.replaceAll('-', ' ')}: ${stat.status}` : 'Not targeted recently';
}

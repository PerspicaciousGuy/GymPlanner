import { formatDateKey } from './dateUtils.js';
import { 
  saveCloudSavedPlans, 
  saveCloudActivePlanId, 
} from './cloudSync.js';
import { ACTIVE_PLAN_KEY, SAVED_PLANS_KEY } from '../constants/storageKeys.js';
import { readJson, writeJson } from './localStorage.js';
import { runCloudSync } from './cloudSyncRunner.js';

// ─── Storage Keys ─────────────────────────────────────────────
// Legacy key (single-plan era) – migrated on first load
const LEGACY_PLAN_KEY   = 'gymplanner_training_plan';

// ─── Default Plan Blueprint ───────────────────────────────────
export function defaultTrainingPlan() {
  return {
    id: crypto.randomUUID(),
    name: 'My Plan',
    createdAt: new Date().toISOString(),
    mode: 'fixed',        // 'fixed' | 'dynamic'
    startDate: formatDateKey(new Date()),
    cycle: [],            // Array of { id, name, type, templateId, amTitle, pmTitle }
    fixedWeek: {
      am: {},
      pm: {},
      amSubtitles: {},
      pmSubtitles: {},
    },
    loggingStyle: 'advanced', // 'legacy' (groups) | 'advanced' (standalone)
  };
}

// ─── Multi-Plan Storage ───────────────────────────────────────

/**
 * Load all saved plans from localStorage.
 * On first run, migrates the legacy single-plan format.
 * @returns {Array} Array of plan objects
 */
export function loadSavedPlans() {
  const plans = readJson(SAVED_PLANS_KEY, null);
  if (Array.isArray(plans)) {
    return plans.map(hydratePlan);
  }

  // Migration: check for legacy single plan
  const legacy = readJson(LEGACY_PLAN_KEY, null);
  if (legacy && typeof legacy === 'object') {
    const migrated = hydratePlan({
      ...legacy,
      id: legacy.id || crypto.randomUUID(),
      name: legacy.name || 'My Plan',
      createdAt: legacy.createdAt || new Date().toISOString(),
    });
    saveSavedPlans([migrated]);
    setActivePlanId(migrated.id);
    localStorage.removeItem(LEGACY_PLAN_KEY);
    return [migrated];
  }

  return [];
}

/**
 * Save the full array of plans.
 */
export function saveSavedPlans(plans) {
  writeJson(SAVED_PLANS_KEY, plans);
  runCloudSync(
    () => saveCloudSavedPlans(plans),
    '[trainingPlan] Cloud plans sync failed:'
  );
}

/**
 * Get/set the active plan ID.
 */
export function getActivePlanId() {
  return localStorage.getItem(ACTIVE_PLAN_KEY) || null;
}

export function setActivePlanId(id) {
  localStorage.setItem(ACTIVE_PLAN_KEY, id);
  runCloudSync(
    () => saveCloudActivePlanId(id),
    '[trainingPlan] Cloud active plan ID sync failed:'
  );
}

/**
 * Load the currently active plan (the one used by the Training Hub).
 * Falls back to a default plan if nothing is saved.
 */
export function loadTrainingPlan() {
  const plans = loadSavedPlans();
  const activeId = getActivePlanId();

  if (plans.length === 0) return defaultTrainingPlan();

  const active = plans.find(p => p.id === activeId);
  return active || plans[0];
}

/**
 * Save a plan (update if exists, insert if new).
 * Also keeps the legacy saveTrainingPlan contract working.
 */
export function saveTrainingPlan(plan) {
  const plans = loadSavedPlans();
  const idx = plans.findIndex(p => p.id === plan.id);
  if (idx >= 0) {
    plans[idx] = plan;
  } else {
    plans.push(plan);
  }
  saveSavedPlans(plans);
}

/**
 * Delete a saved plan by ID.
 * If the deleted plan was active, the first remaining plan becomes active.
 */
export function deleteSavedPlan(planId) {
  let plans = loadSavedPlans();
  plans = plans.filter(p => p.id !== planId);
  saveSavedPlans(plans);

  if (getActivePlanId() === planId) {
    setActivePlanId(plans[0]?.id || '');
  }
}

// ─── Hydrate helper ───────────────────────────────────────────
/** Merge defaults into a plan to handle missing fields */
function hydratePlan(raw) {
  return {
    ...defaultTrainingPlan(),
    ...raw,
    loggingStyle: raw.loggingStyle || 'advanced',
    fixedWeek: {
      am: raw.fixedWeek?.am ?? {},
      pm: raw.fixedWeek?.pm ?? {},
      amSubtitles: raw.fixedWeek?.amSubtitles ?? {},
      pmSubtitles: raw.fixedWeek?.pmSubtitles ?? {},
    },
  };
}

// ─── Cycle Math ───────────────────────────────────────────────

/**
 * Calculate the cycle position (0-indexed) for a given date.
 */
export function getCyclePosition(date, plan) {
  if (!plan || plan.mode !== 'dynamic' || !plan.cycle?.length) return -1;

  const d = date instanceof Date ? date : new Date(date);
  const start = new Date(plan.startDate);

  if (Number.isNaN(d.getTime()) || Number.isNaN(start.getTime())) return -1;

  d.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);

  const diffMs = d.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  const cycleLen = plan.cycle.length;
  const pos = ((diffDays % cycleLen) + cycleLen) % cycleLen;
  return pos;
}

/**
 * Get the cycle slot for a given date.
 */
export function getCycleSlotForDate(date, plan) {
  const pos = getCyclePosition(date, plan);
  if (pos < 0) return null;

  return {
    slot: plan.cycle[pos],
    position: pos,
    cycleLength: plan.cycle.length,
  };
}

/**
 * Get the session title for a date based on the training plan.
 */
export function getPlanSessionTitle(date, session, plan) {
  const p = plan || loadTrainingPlan();
  const d = date instanceof Date ? date : new Date(date);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[d.getDay()];

  if (p.mode === 'fixed') {
    return p.fixedWeek?.[session]?.[dayName] || '';
  }

  const info = getCycleSlotForDate(date, p);
  if (!info || !info.slot) return '';

  const { slot } = info;

  if (slot.type === 'rest') {
    return 'REST';
  }

  if (session === 'am') {
    return slot.amTitle || slot.name || '';
  }
  return slot.pmTitle || '';
}

/**
 * Get the session subtitle for a date based on the training plan.
 */
export function getPlanSessionSubtitle(date, session, plan) {
  const p = plan || loadTrainingPlan();
  const d = date instanceof Date ? date : new Date(date);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[d.getDay()];

  if (p.mode === 'fixed') {
    const key = session === 'am' ? 'amSubtitles' : 'pmSubtitles';
    return p.fixedWeek?.[key]?.[dayName] || '';
  }

  const info = getCycleSlotForDate(date, p);
  if (!info || !info.slot) return '';

  const { slot } = info;
  return session === 'am' ? (slot.amSubtitle || '') : (slot.pmSubtitle || '');
}

/**
 * Check if a date is a rest day according to the training plan.
 */
export function isRestDay(date, plan) {
  const p = plan || loadTrainingPlan();

  if (p.mode === 'fixed') {
    const d = date instanceof Date ? date : new Date(date);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[d.getDay()];
    const am = (p.fixedWeek?.am?.[dayName] || '').toLowerCase();
    const pm = (p.fixedWeek?.pm?.[dayName] || '').toLowerCase();
    const isOff = (txt) => txt === '' || txt === 'off' || txt === 'rest' || txt.startsWith('off ') || txt.startsWith('rest ');
    return isOff(am) && isOff(pm);
  }

  const info = getCycleSlotForDate(date, p);
  if (!info || !info.slot) return false;
  return info.slot.type === 'rest';
}

// ─── Cycle Slot Helpers ───────────────────────────────────────

export function createCycleSlot(name, type = 'workout', options = {}) {
  return {
    id: crypto.randomUUID(),
    name: name || (type === 'rest' ? 'Rest' : 'Workout'),
    type,
    templateId: options.templateId || null,
    amTitle: options.amTitle || '',
    pmTitle: options.pmTitle || '',
    amSubtitle: options.amSubtitle || '',
    pmSubtitle: options.pmSubtitle || '',
  };
}

export function addSlotToCycle(plan, slot) {
  return { ...plan, cycle: [...plan.cycle, slot] };
}

export function removeSlotFromCycle(plan, index) {
  return { ...plan, cycle: plan.cycle.filter((_, i) => i !== index) };
}

export function reorderCycleSlot(plan, oldIndex, newIndex) {
  const cycle = [...plan.cycle];
  const [moved] = cycle.splice(oldIndex, 1);
  cycle.splice(newIndex, 0, moved);
  return { ...plan, cycle };
}

export function updateCycleSlot(plan, index, updates) {
  const cycle = [...plan.cycle];
  cycle[index] = { ...cycle[index], ...updates };
  return { ...plan, cycle };
}

import {
  saveCloudDailyMetadata,
  saveCloudSessionTitles,
} from './cloudSync.js';
import { formatDateKey, getDayOfWeek } from './dateUtils.js';
import { loadTrainingPlan, getPlanSessionTitle } from './trainingPlan.js';
import { runCloudSync } from './cloudSyncRunner.js';
import {
  DAILY_METADATA_KEY,
  SESSION_TITLES_KEY,
} from '../constants/storageKeys.js';
import { safeLoad } from './storageCore.js';

// ─── Session Titles ───────────────────────────────────────────
export function loadSessionTitles() {
  const raw = safeLoad(SESSION_TITLES_KEY, { am: {}, pm: {} }) || { am: {}, pm: {} };
  return {
    am: raw.am || {},
    pm: raw.pm || {}
  };
}

export function saveSessionTitles(titles) {
  localStorage.setItem(SESSION_TITLES_KEY, JSON.stringify(titles || { am: {}, pm: {} }));
}

export function saveSessionTitlesWithSync(titles) {
  saveSessionTitles(titles);
  runCloudSync(
    () => saveCloudSessionTitles(loadSessionTitles()),
    '[storage] Cloud session titles sync failed:'
  );
}

// ─── Daily Overrides (Date-specific metadata) ────────────────
export function loadDailyMetadata() {
  return safeLoad(DAILY_METADATA_KEY, {});
}

export function saveDailyMetadata(date, session, data) {
  const dateKey = formatDateKey(date);
  const all = loadDailyMetadata();
  if (!all[dateKey]) all[dateKey] = { am: {}, pm: {} };

  all[dateKey][session] = {
    ...(all[dateKey][session] || {}),
    ...data
  };

  localStorage.setItem(DAILY_METADATA_KEY, JSON.stringify(all));
}

export function saveDailyMetadataWithSync(date, session, data) {
  saveDailyMetadata(date, session, data);
  runCloudSync(
    () => saveCloudDailyMetadata(loadDailyMetadata()),
    '[storage] Cloud metadata sync failed:'
  );
}

export function getDailyMetadata(date, session) {
  const dateKey = formatDateKey(date);
  const all = loadDailyMetadata();
  return all[dateKey]?.[session] || {};
}

/**
 * Returns the session title for a specific date/session.
 * Priorities:
 * 1. Daily Metadata Override
 * 2. Training Plan (Fixed or Dynamic mode)
 * 3. Legacy Session Title Template (Day of week fallback)
 * 4. Fallback to Empty
 */
export function getEffectiveSessionTitle(date, session) {
  const override = getDailyMetadata(date, session);
  if (
    override.title !== undefined &&
    override.title !== null &&
    override.title.trim() !== '' &&
    override.title.trim().toLowerCase() !== 'workout'
  ) {
    return override.title;
  }

  // Try training plan
  const plan = loadTrainingPlan();
  const planTitle = getPlanSessionTitle(date, session, plan);
  if (planTitle !== null && planTitle !== undefined) {
    return planTitle;
  }

  const titles = loadSessionTitles();
  const dayName = getDayOfWeek(date);
  return titles[session]?.[dayName] || '';
}

/**
 * Returns the session notes for a specific date/session.
 */
export function getEffectiveSessionNotes(date, session) {
  return getDailyMetadata(date, session).notes || '';
}

/**
 * Freezes the dynamically computed session title into dailyMetadata
 * so that future changes to the training plan do not alter historical records.
 */
export function freezeEffectiveSessionTitle(dateOrDateKey, session) {
  let localDate;
  if (dateOrDateKey instanceof Date) {
    localDate = dateOrDateKey;
  } else if (typeof dateOrDateKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateOrDateKey)) {
    const [y, m, d] = dateOrDateKey.split('-');
    localDate = new Date(y, parseInt(m, 10) - 1, d);
  } else {
    return;
  }

  const currentTitle = getEffectiveSessionTitle(localDate, session);
  if (currentTitle && currentTitle.trim() !== '' && currentTitle.trim().toLowerCase() !== 'workout') {
    const existingOverride = getDailyMetadata(localDate, session).title;
    if (existingOverride !== currentTitle && !existingOverride?.startsWith('Rest (Shifted to')) {
      saveDailyMetadataWithSync(localDate, session, { title: currentTitle });
    }
  }
}

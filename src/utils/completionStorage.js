import {
  isCloudSyncReady,
  saveCloudCompletionEntry,
  saveCloudCompletionMap,
} from './cloudSync.js';
import {
  formatDateKey,
  getDayOfWeek,
  getWeekStart,
  getDateForDayInWeek,
  getWeekDates,
} from './dateUtils.js';
import { runCloudSync } from './cloudSyncRunner.js';
import {
  COMPLETION_KEY,
  MIGRATION_FLAG_KEY,
} from '../constants/storageKeys.js';
import { safeLoad } from './storageCore.js';
import { freezeEffectiveSessionTitle } from './sessionMetaStorage.js';

// ─── Completion ───────────────────────────────────────────────
// Run migration from day-based to date-based completion on first load
export function migrateCompletionToDateBased() {
  const migrated = localStorage.getItem(MIGRATION_FLAG_KEY);
  if (migrated === 'true') return; // Already migrated

  const completion = safeLoad(COMPLETION_KEY, {});
  const hasOldFormat = Object.keys(completion).some(key =>
    /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)_(am|pm)/.test(key)
  );

  if (!hasOldFormat) {
    localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
    return; // No old data to migrate
  }

  // Get previous week's Monday (the week that just ended)
  // This is more logical since completion data is typically historical
  const currentWeekStart = getWeekStart(new Date());
  const previousWeekStart = new Date(currentWeekStart);
  previousWeekStart.setDate(currentWeekStart.getDate() - 7);

  const newCompletion = {};

  // Migrate old day-based keys to previous week's dates
  for (const [key, value] of Object.entries(completion)) {
    const match = key.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)_(am|pm)/);
    if (match) {
      const [_, dayName, session] = match;
      const date = getDateForDayInWeek(previousWeekStart, dayName);
      const dateKey = formatDateKey(date);
      newCompletion[`${dateKey}_${session}`] = value;
    } else if (/^\d{4}-\d{2}-\d{2}_(am|pm)/.test(key)) {
      // Already date-based, keep it
      newCompletion[key] = value;
    }
  }

  localStorage.setItem(COMPLETION_KEY, JSON.stringify(newCompletion));
  localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
}

export function loadCompletion() {
  return normalizeCompletionMap(safeLoad(COMPLETION_KEY, {}));
}

export function normalizeCompletionMap(raw) {
  if (!raw || typeof raw !== 'object') return {};
  const normalized = {};

  const isTruthy = (v) => v === true || v === 1 || v === '1' || v === 'true';

  for (const [key, value] of Object.entries(raw)) {
    if (typeof key !== 'string') continue;

    // Backward compatibility for old "day_session_skipped" keys
    const skippedMatch = key.match(/^(.*)_(am|pm)_skipped$/);
    if (skippedMatch) {
      if (isTruthy(value) || String(value).toLowerCase() === 'skipped') {
        normalized[`${skippedMatch[1]}_${skippedMatch[2]}`] = 'skipped';
      }
      continue;
    }

    // Accept both date-based (2026-03-10_am) and old day-based (Monday_am) keys
    if (!/(?:_am|_pm)$/.test(key)) continue;

    const lower = String(value).toLowerCase();
    if (lower === 'skipped' || lower === 'skip') {
      normalized[key] = 'skipped';
      continue;
    }

    if (isTruthy(value) && normalized[key] !== 'skipped') {
      normalized[key] = true;
    }
  }

  return normalized;
}

// session: 'am' | 'pm'
// date: Date object or ISO date string (YYYY-MM-DD)
export function markDayComplete(date, session = 'am') {
  freezeEffectiveSessionTitle(date, session);
  const dateKey = formatDateKey(date);
  const all = loadCompletion();
  all[`${dateKey}_${session}`] = true;
  localStorage.setItem(COMPLETION_KEY, JSON.stringify(all));
}

export function isDayComplete(date, session = 'am') {
  const dateKey = formatDateKey(date);
  const val = loadCompletion()[`${dateKey}_${session}`];
  return val === true;
}

/**
 * Returns true if the session is either completed or explicitly skipped.
 * Used for filtering/hub logic.
 */
export function isSessionFinished(date, session = 'am') {
  const dateKey = formatDateKey(date);
  const val = loadCompletion()[`${dateKey}_${session}`];
  return val === true || val === 'skipped';
}

export function isDaySkipped(date, session = 'am') {
  const dateKey = formatDateKey(date);
  return loadCompletion()[`${dateKey}_${session}`] === 'skipped';
}

export function markDaySkipped(date, session = 'am') {
  freezeEffectiveSessionTitle(date, session);
  const dateKey = formatDateKey(date);
  const all = loadCompletion();
  all[`${dateKey}_${session}`] = 'skipped';
  localStorage.setItem(COMPLETION_KEY, JSON.stringify(all));
}

// Get completion data for a specific week
export function getCompletionForWeek(weekStartDate) {
  const weekDates = getWeekDates(weekStartDate);
  const completion = loadCompletion();
  const weekCompletion = {};

  for (const date of weekDates) {
    const dateKey = formatDateKey(date);
    const dayName = getDayOfWeek(date);

    weekCompletion[dayName] = {
      date: dateKey,
      am: completion[`${dateKey}_am`],
      pm: completion[`${dateKey}_pm`],
    };
  }

  return weekCompletion;
}

// Get completion status for display (used by Data Console)
export function getCompletionStatus(date, session) {
  const dateKey = formatDateKey(date);
  const val = loadCompletion()[`${dateKey}_${session}`];
  if (val === true) return 'done';
  if (val === 'skipped') return 'skipped';
  return '';
}

// Set completion status from Data Console dropdown
export function setCompletionStatus(date, session, status) {
  if (status === 'done' || status === 'skipped') {
    freezeEffectiveSessionTitle(date, session);
  }
  const dateKey = formatDateKey(date);
  const all = loadCompletion();

  if (status === 'done') {
    all[`${dateKey}_${session}`] = true;
  } else if (status === 'skipped') {
    all[`${dateKey}_${session}`] = 'skipped';
  } else {
    // Remove the key if status is empty/none
    delete all[`${dateKey}_${session}`];
  }

  localStorage.setItem(COMPLETION_KEY, JSON.stringify(all));
}

export function saveCompletion(completionMap) {
  localStorage.setItem(
    COMPLETION_KEY,
    JSON.stringify(normalizeCompletionMap(completionMap))
  );
}

export function saveCompletionWithSync(completionMap) {
  const normalized = normalizeCompletionMap(completionMap);
  localStorage.setItem(COMPLETION_KEY, JSON.stringify(normalized));

  if (isCloudSyncReady()) {
    saveCloudCompletionMap(normalized).catch((err) =>
      console.warn('[storage] Cloud completion sync failed:', err)
    );
  }
}

export function markDayCompleteWithSync(date, session = 'am') {
  markDayComplete(date, session);

  const dateKey = formatDateKey(date);
  runCloudSync(
    () => saveCloudCompletionEntry(dateKey, session, true),
    '[storage] Cloud completion sync failed:'
  );
}

export function markDaySkippedWithSync(date, session = 'am') {
  markDaySkipped(date, session);

  const dateKey = formatDateKey(date);
  runCloudSync(
    () => saveCloudCompletionEntry(dateKey, session, 'skipped'),
    '[storage] Cloud skip sync failed:'
  );
}

export function setCompletionStatusWithSync(date, session, status) {
  setCompletionStatus(date, session, status);

  const completion = loadCompletion();
  runCloudSync(
    () => saveCloudCompletionMap(completion),
    '[storage] Cloud completion sync failed:'
  );
}

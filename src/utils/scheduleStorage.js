import { saveCloudSchedule } from './cloudSync.js';
import { runCloudSync } from './cloudSyncRunner.js';
import { SCHEDULE_KEY } from '../constants/storageKeys.js';
import { safeLoad } from './storageCore.js';

// ─── Schedule ─────────────────────────────────────────────────
export function loadSchedule() {
  return safeLoad(SCHEDULE_KEY, {});
}

export function saveSchedule(schedule) {
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
}

export function saveScheduleWithSync(schedule) {
  saveSchedule(schedule);

  runCloudSync(
    () => saveCloudSchedule(schedule),
    '[storage] Cloud schedule sync failed:'
  );
}

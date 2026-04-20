import { VITALS_LOG_KEY, WATER_LOG_KEY } from '../constants/storageKeys';
import { formatDateKey } from './dateUtils';
import { saveCloudVitalsLog, saveCloudWaterLog } from './cloudSync';

// --- Storage Helpers ---
function safeLoad(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeSave(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// --- Weight (Vitals) ---
export function getVitalsLog() {
  return safeLoad(VITALS_LOG_KEY, {});
}

export function logWeight(date, weight) {
  const dateKey = typeof date === 'string' ? date : formatDateKey(date);
  const log = getVitalsLog();
  
  if (!log[dateKey]) log[dateKey] = {};
  log[dateKey].weight = parseFloat(weight);
  log[dateKey].updatedAt = new Date().toISOString();
  
  safeSave(VITALS_LOG_KEY, log);
  
  // Trigger cloud sync
  saveCloudVitalsLog(log).catch(err => console.warn('Cloud vitals sync failed:', err));
  
  return log[dateKey];
}

export function getWeightForDate(date) {
  const dateKey = typeof date === 'string' ? date : formatDateKey(date);
  const log = getVitalsLog();
  return log[dateKey]?.weight || null;
}

export function getLatestWeight() {
  const log = getVitalsLog();
  const keys = Object.keys(log).sort().reverse();
  if (keys.length === 0) return null;
  return log[keys[0]].weight;
}

export function getWeightHistory(days = 30) {
  const log = getVitalsLog();
  return Object.entries(log)
    .map(([date, data]) => ({ date, weight: data.weight }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, days)
    .reverse();
}

// --- Water ---
export function getWaterLog() {
  return safeLoad(WATER_LOG_KEY, {});
}

export function logWater(date, amount) {
  const dateKey = typeof date === 'string' ? date : formatDateKey(date);
  const log = getWaterLog();
  
  log[dateKey] = (log[dateKey] || 0) + amount;
  if (log[dateKey] < 0) log[dateKey] = 0;
  
  safeSave(WATER_LOG_KEY, log);
  
  // Trigger cloud sync
  saveCloudWaterLog(log).catch(err => console.warn('Cloud water sync failed:', err));
  
  return log[dateKey];
}

export function getWaterForDate(date) {
  const dateKey = typeof date === 'string' ? date : formatDateKey(date);
  const log = getWaterLog();
  return log[dateKey] || 0;
}

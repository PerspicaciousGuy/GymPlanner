import { isCloudSyncReady, saveCloudSettings } from './cloudSync';
import { SETTINGS_KEY } from '../constants/storageKeys.js';
import { readJson, writeJson } from './localStorage.js';

const runCloudSync = (task, warningMessage) => {
  if (!isCloudSyncReady()) return;
  task().catch((err) => console.warn(warningMessage, err));
};

const defaultSettings = {
  units: 'kg', // 'kg' | 'lbs'
  theme: 'light', // 'light' | 'dark'
  compactMode: false,
  trainingMode: 'fixed', // 'fixed' | 'dynamic'
  nutritionGoals: {
    enabled: false,
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0
  }
};

export const loadSettings = () => {
  const stored = readJson(SETTINGS_KEY, defaultSettings);
  return { ...defaultSettings, ...stored };
};

export const saveSettings = (settings) => {
  writeJson(SETTINGS_KEY, settings);
  runCloudSync(() => saveCloudSettings(settings), '[settings] Cloud sync failed:');
};

export const updateSetting = (key, value) => {
  const current = loadSettings();
  const updated = { ...current, [key]: value };
  saveSettings(updated);
  return updated;
};

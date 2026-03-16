const SETTINGS_KEY = 'gymplanner_settings';

const defaultSettings = {
  units: 'kg', // 'kg' | 'lbs'
  theme: 'light', // 'light' | 'dark'
  compactMode: false
};

export const loadSettings = () => {
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (!stored) return defaultSettings;
  try {
    return { ...defaultSettings, ...JSON.parse(stored) };
  } catch {
    return defaultSettings;
  }
};

export const saveSettings = (settings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const updateSetting = (key, value) => {
  const current = loadSettings();
  const updated = { ...current, [key]: value };
  saveSettings(updated);
  return updated;
};

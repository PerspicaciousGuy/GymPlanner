import { getTomorrow, getDayOfWeek, formatDateKey } from './dateUtils';
import { saveCloudNotifSettings } from './cloudSync';
import { NOTIFICATION_SETTINGS_KEY } from '../constants/storageKeys.js';
import { loadWorkoutByDate, loadSessionTitles } from './storage';
import { runCloudSync } from './cloudSyncRunner.js';

export { NOTIFICATION_SETTINGS_KEY };
export const LAST_NOTIFIED_DATE_KEY = 'last_notified_date'; // Store the date (YYYY-MM-DD) when we last showed a summary

export const isNotificationSupported = () => 'Notification' in window;

export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) return false;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return 'default';
  return Notification.permission;
};

export const showNotification = (title, body) => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;
  
  new Notification(title, {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
  });
};

export const scheduleTomorrowSummary = () => {
  const enabled = localStorage.getItem(NOTIFICATION_SETTINGS_KEY) === 'true';
  if (!enabled || Notification.permission !== 'granted') return;

  const todayStr = formatDateKey(new Date());
  const lastNotified = localStorage.getItem(LAST_NOTIFIED_DATE_KEY);

  // Only notify once per day
  if (lastNotified === todayStr) return;

  const tomorrow = getTomorrow();
  const tomorrowKey = formatDateKey(tomorrow);
  const tomorrowDayName = getDayOfWeek(tomorrow);
  
  const dayData = loadWorkoutByDate(tomorrowKey);
  const sessionTitles = loadSessionTitles();

  const getSessionString = (session) => {
    const title = sessionTitles[session]?.[tomorrowDayName] || 'Rest/Off';
    const groups = dayData[session]?.groups || [];
    const muscleGroups = new Set();
    let totalSets = 0;

    groups.forEach(g => {
      g.rows?.forEach(r => {
        if (r.muscle) muscleGroups.add(r.muscle);
        if (r.sets) totalSets += parseInt(r.sets) || 0;
      });
    });

    if (muscleGroups.size === 0 && totalSets === 0) return `💤 ${session.toUpperCase()}: ${title}`;
    
    const muscles = Array.from(muscleGroups).join(', ');
    return `${session === 'am' ? '🌅' : '🌙'} ${session.toUpperCase()}: ${title} (${muscles}) - ${totalSets} sets`;
  };

  const amStr = getSessionString('am');
  const pmStr = getSessionString('pm');

  showNotification(
    `📋 Tomorrow's Schedule (${tomorrowDayName})`,
    `${amStr}\n${pmStr}`
  );

  localStorage.setItem(LAST_NOTIFIED_DATE_KEY, todayStr);
};

export const setNotificationEnabledWithSync = (enabled) => {
  localStorage.setItem(NOTIFICATION_SETTINGS_KEY, enabled ? 'true' : 'false');
  runCloudSync(
    () => saveCloudNotifSettings(enabled),
    '[notif] Cloud preference sync failed:'
  );
};

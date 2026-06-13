import { useState } from 'react';
import {
  Settings,
  RefreshCw,
  LogOut,
  ChevronRight,
  Download,
  Sun,
  Moon,
  Utensils,
  Flame,
  Zap,
  Bell,
  Scale,
  Database,
  User
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import {
  isNotificationSupported,
  requestNotificationPermission,
  getNotificationPermission,
  showNotification,
  scheduleTomorrowSummary,
  NOTIFICATION_SETTINGS_KEY,
  setNotificationEnabledWithSync
} from '../utils/notificationService';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/layout/Panel";
import { cn } from "@/lib/utils";
import { loadSettings, updateSetting } from '../utils/settings';
import { formatDateKey } from '../utils/dateUtils';
import DataConsolePage from './DataConsolePage';

export default function ProfilePage({ authState, onDataRefreshed, onSettingsChange, onNavigateToLogin }) {
  const [settings, setSettings] = useState(loadSettings());
  const [, setBusy] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    localStorage.getItem(NOTIFICATION_SETTINGS_KEY) === 'true'
  );
  const [notifPermission, setNotifPermission] = useState(getNotificationPermission());
  const [showConsole, setShowConsole] = useState(false);
  const user = authState?.user;

  const handleToggleUnits = (newUnits) => {
    const updated = updateSetting('units', newUnits);
    setSettings(updated);
  };

  const handleLogout = async () => {
    try {
      setBusy(true);
      await authState.logout();
    } finally {
      setBusy(false);
    }
  };

  const handleToggleNotifications = async (checked) => {
    if (checked && notifPermission !== 'granted') {
      const granted = await requestNotificationPermission();
      setNotifPermission(getNotificationPermission());
      if (!granted) return;
    }

    setNotificationEnabledWithSync(checked);
    setNotificationsEnabled(checked);

    if (checked) {
      showNotification("Reminders Enabled", "You will receive a summary of tomorrow's workout daily.");
    }
  };

  const testNotification = () => {
    scheduleTomorrowSummary();
  };

  const exportData = () => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      data[key] = localStorage.getItem(key);
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gymplanner_backup_${formatDateKey(new Date())}.json`;
    a.click();
  };

  const handleToggleTheme = (checked) => {
    const newTheme = checked ? 'dark' : 'light';
    const updated = updateSetting('theme', newTheme);
    setSettings(updated);
    onSettingsChange?.(updated);
  };

  const handleUpdateNutrition = (key, value) => {
    const newGoals = { ...settings.nutritionGoals, [key]: value };
    const updated = updateSetting('nutritionGoals', newGoals);
    setSettings(updated);
    onSettingsChange?.(updated);
  };

  if (showConsole) {
    return (
      <PageShell className="animate-in fade-in slide-in-from-right-4 duration-500">
          <Button
            variant="ghost"
            onClick={() => setShowConsole(false)}
          className="w-fit text-[11px] font-semibold uppercase tracking-normal text-muted-foreground hover:text-foreground flex items-center gap-2 group"
          >
            <ChevronRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
            Back to Profile
          </Button>
          <Panel className="overflow-hidden min-h-[70vh]">
            <DataConsolePage hideSidebar />
          </Panel>
      </PageShell>
    );
  }

  return (
    <PageShell className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Profile"
        meta={(
          <span className="text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
            Account and preferences
          </span>
        )}
      />

      <Panel className="overflow-hidden p-0">
        <div className="bg-[var(--app-accent-soft)] px-5 py-5 md:px-7 md:py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 border-4 border-[var(--app-surface)] shadow-[var(--app-shadow-sm)] ring-1 ring-[var(--app-border)] md:h-16 md:w-16">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'guest'}`} />
                <AvatarFallback className="bg-foreground text-lg font-semibold text-background">
                  {user?.email?.[0].toUpperCase() || 'G'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h2 className="truncate text-xl font-semibold tracking-normal text-foreground md:text-2xl">
                  {user?.email?.split('@')[0] || 'guest'}
                </h2>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">
                  {user ? user.email : 'Offline / Local'}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge className="rounded-[var(--app-radius-sm)] border border-[var(--app-border)] bg-[var(--app-surface)] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-normal text-foreground shadow-none">
                    {user ? 'Cloud Active' : 'Local Mode'}
                  </Badge>
                  <Badge className="rounded-[var(--app-radius-sm)] border border-[var(--app-border)] bg-[var(--app-surface)] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-normal text-muted-foreground shadow-none">
                    {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </Badge>
                </div>
              </div>
            </div>

            {user ? (
              <Button
                onClick={handleLogout}
                variant="outline"
                className="h-10 rounded-[var(--app-radius-md)] border-[var(--app-border)] bg-[var(--app-surface)] px-5 text-[10px] font-semibold uppercase tracking-normal text-foreground hover:bg-[var(--app-surface-muted)] md:h-11"
              >
                <LogOut size={15} className="mr-2" /> Sign Out
              </Button>
            ) : (
              <Button
                onClick={() => onNavigateToLogin?.()}
                className="h-10 rounded-[var(--app-radius-md)] bg-foreground px-5 text-[10px] font-semibold uppercase tracking-normal text-background hover:bg-foreground/90 md:h-11"
              >
                <User size={15} className="mr-2" /> Sign In to Sync
              </Button>
            )}
          </div>
        </div>
      </Panel>

      <Panel className="p-5 md:p-7">
        <div className="mb-4 flex items-end justify-between gap-4 md:mb-5">
          <div>
            <h2 className="text-xl font-semibold tracking-normal text-foreground">Preferences</h2>
            <p className="text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">App behavior and display</p>
          </div>
        </div>

        <div className="divide-y divide-[var(--app-border)] overflow-hidden rounded-[var(--app-radius-lg)] border border-[var(--app-border)] bg-[var(--app-surface)]">
          <div className="flex items-center justify-between gap-4 p-3 md:p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--app-radius-md)] bg-[var(--app-surface-muted)] text-muted-foreground md:h-10 md:w-10">
                {settings.theme === 'dark' ? <Moon size={17} /> : <Sun size={17} />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-normal text-foreground">Appearance</p>
                <p className="truncate text-[11px] font-medium tracking-normal text-muted-foreground">
                  {settings.theme === 'dark' ? 'Racing Orange & Charcoal' : 'Legacy Indigo & White'}
                </p>
              </div>
            </div>
            <Switch
              checked={settings.theme === 'dark'}
              onCheckedChange={handleToggleTheme}
              className="data-[state=checked]:bg-foreground"
            />
          </div>

          <div className="flex items-center justify-between gap-4 p-3 md:p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--app-radius-md)] bg-[var(--app-surface-muted)] text-muted-foreground md:h-10 md:w-10">
                <Scale size={17} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-normal text-foreground">Weight Units</p>
                <p className="text-[11px] font-medium tracking-normal text-muted-foreground">
                  Currently: {settings.units === 'kg' ? 'Kilograms' : 'Pounds'}
                </p>
              </div>
            </div>
            <div className="flex rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-1">
              <button
                onClick={() => handleToggleUnits('kg')}
                className={cn(
                  "rounded-[var(--app-radius-sm)] px-3 py-1 text-[10px] font-semibold transition-all",
                  settings.units === 'kg' ? "bg-foreground text-background shadow-[var(--app-shadow-sm)]" : "text-muted-foreground hover:text-foreground"
                )}
              >
                KG
              </button>
              <button
                onClick={() => handleToggleUnits('lbs')}
                className={cn(
                  "rounded-[var(--app-radius-sm)] px-3 py-1 text-[10px] font-semibold transition-all",
                  settings.units === 'lbs' ? "bg-foreground text-background shadow-[var(--app-shadow-sm)]" : "text-muted-foreground hover:text-foreground"
                )}
              >
                LBS
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 p-3 md:p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--app-radius-md)] bg-[var(--app-surface-muted)] text-muted-foreground md:h-10 md:w-10">
                <Bell size={17} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-normal text-foreground">Workout Reminders</p>
                <p className="text-[11px] font-medium tracking-normal text-muted-foreground">Get tomorrow's session summary</p>
              </div>
            </div>
            <Switch
              checked={notificationsEnabled && notifPermission === 'granted'}
              onCheckedChange={handleToggleNotifications}
              disabled={notifPermission === 'denied' || !isNotificationSupported()}
              className="data-[state=checked]:bg-foreground"
            />
          </div>
        </div>
      </Panel>

      <Panel className="p-5 md:p-7">
        <div className="mb-4 flex items-center justify-between gap-4 md:mb-5">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-semibold tracking-normal text-foreground">
              Nutrition Targets <Utensils size={18} className="text-[var(--app-accent)]" />
            </h2>
            <p className="text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">Daily goals on Health Hub</p>
          </div>
          <Switch
            checked={settings.nutritionGoals?.enabled}
            onCheckedChange={(checked) => handleUpdateNutrition('enabled', checked)}
            className="data-[state=checked]:bg-foreground"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">
              Calories <Flame size={10} className="fill-foreground text-[var(--app-text-soft)]" />
            </label>
            <Input
              type="number"
              value={settings.nutritionGoals?.calories || ''}
              onChange={(e) => handleUpdateNutrition('calories', parseInt(e.target.value) || 0)}
              className="h-11 rounded-[var(--app-radius-md)] border-[var(--app-border)] bg-[var(--app-surface-muted)] font-semibold text-foreground md:h-12"
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">
              Protein <Zap size={10} className="fill-destructive text-destructive" />
            </label>
            <Input
              type="number"
              value={settings.nutritionGoals?.protein || ''}
              onChange={(e) => handleUpdateNutrition('protein', parseInt(e.target.value) || 0)}
              className="h-11 rounded-[var(--app-radius-md)] border-[var(--app-border)] bg-[var(--app-surface-muted)] font-semibold text-foreground md:h-12"
            />
          </div>
          <div className="space-y-2">
            <label className="px-1 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">Carbs</label>
            <Input
              type="number"
              value={settings.nutritionGoals?.carbs || ''}
              onChange={(e) => handleUpdateNutrition('carbs', parseInt(e.target.value) || 0)}
              className="h-11 rounded-[var(--app-radius-md)] border-[var(--app-border)] bg-[var(--app-surface-muted)] font-semibold text-foreground md:h-12"
            />
          </div>
          <div className="space-y-2">
            <label className="px-1 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">Fats</label>
            <Input
              type="number"
              value={settings.nutritionGoals?.fats || ''}
              onChange={(e) => handleUpdateNutrition('fats', parseInt(e.target.value) || 0)}
              className="h-11 rounded-[var(--app-radius-md)] border-[var(--app-border)] bg-[var(--app-surface-muted)] font-semibold text-foreground md:h-12"
            />
          </div>
        </div>
      </Panel>

      <Panel className="p-5 md:p-7">
        <div className="mb-5">
          <h2 className="text-xl font-semibold tracking-normal text-foreground">Data & Tools</h2>
          <p className="text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">Sync, backup, and internal controls</p>
        </div>

        <div className="grid gap-3">
          <Button
            variant="outline"
            className="h-14 justify-start rounded-[var(--app-radius-md)] border-[var(--app-border)] bg-[var(--app-surface)] px-4 text-left hover:bg-[var(--app-surface-muted)]"
            onClick={() => onDataRefreshed?.()}
          >
            <RefreshCw size={16} className="mr-3 text-muted-foreground" />
            <span className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-normal text-foreground">Manual Data Sync</span>
              <span className="text-[10px] font-medium tracking-normal text-muted-foreground">Refresh local and cloud records</span>
            </span>
          </Button>

          <Button
            variant="outline"
            className="h-14 justify-start rounded-[var(--app-radius-md)] border-[var(--app-border)] bg-[var(--app-surface)] px-4 text-left hover:bg-[var(--app-surface-muted)]"
            onClick={exportData}
          >
            <Download size={16} className="mr-3 text-muted-foreground" />
            <span className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-normal text-foreground">Export JSON Backup</span>
              <span className="text-[10px] font-medium tracking-normal text-muted-foreground">Download all browser-stored app data</span>
            </span>
          </Button>

          {notificationsEnabled && notifPermission === 'granted' && (
            <Button
              variant="outline"
              className="h-14 justify-start rounded-[var(--app-radius-md)] border-[var(--app-border)] bg-[var(--app-surface)] px-4 text-left hover:bg-[var(--app-surface-muted)]"
              onClick={testNotification}
            >
              <Bell size={16} className="mr-3 text-muted-foreground" />
              <span className="flex flex-col">
                <span className="text-[11px] font-semibold uppercase tracking-normal text-foreground">Send Test Reminder</span>
                <span className="text-[10px] font-medium tracking-normal text-muted-foreground">Preview the reminder notification</span>
              </span>
            </Button>
          )}

          <button
            type="button"
            onClick={() => setShowConsole(true)}
            className="group flex min-h-20 items-center justify-between gap-4 rounded-[var(--app-radius-lg)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4 text-left transition-colors hover:border-[var(--app-border-strong)]"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--app-radius-md)] bg-foreground text-background">
                <Database size={17} />
              </span>
              <span>
                <span className="mb-1 flex items-center gap-2">
                  <Badge className="rounded-[var(--app-radius-sm)] border-none bg-foreground px-2 py-0.5 text-[8px] font-semibold uppercase tracking-normal text-background shadow-none">Internal</Badge>
                  <span className="text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">Control Center</span>
                </span>
                <span className="block text-sm font-semibold tracking-normal text-foreground">Manage training data and exercise libraries.</span>
              </span>
            </span>
            <Settings className="h-4 w-4 shrink-0 text-[var(--app-accent)] transition-transform group-hover:rotate-45" />
          </button>
        </div>
      </Panel>
    </PageShell>
  );
}

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
  Zap
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

      <Panel className="flex flex-col items-center p-8 text-center md:p-10">
        <Avatar className="w-24 h-24 border-4 border-[var(--app-surface)] shadow-[var(--app-shadow-md)] ring-1 ring-[var(--app-border)] mb-4">
          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'guest'}`} />
          <AvatarFallback className="bg-foreground text-background font-semibold text-2xl">
            {user?.email?.[0].toUpperCase() || 'G'}
          </AvatarFallback>
        </Avatar>

        <div className="space-y-1 mb-6">
          <h2 className="text-3xl font-semibold text-foreground tracking-normal">
            {user?.email?.split('@')[0] || 'guest'}
          </h2>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-normal">
            {user ? 'Cloud Active' : 'Offline / Local'}
          </p>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-normal flex items-center justify-center gap-2">
            Active Session: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            <Zap size={10} className="text-[var(--app-accent)] fill-[var(--app-accent)]" />
          </p>
        </div>

        <div className="w-full max-w-xs">
          {user ? (
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              className="w-full h-12 rounded-[var(--app-radius-md)] border-[var(--app-border)] text-foreground font-semibold uppercase tracking-normal text-[11px] hover:bg-[var(--app-surface-muted)]"
            >
              <LogOut size={16} className="mr-2" /> Sign Out
            </Button>
          ) : (
            <Button 
              variant="outline" 
              onClick={() => onNavigateToLogin?.()}
              className="w-full h-12 rounded-[var(--app-radius-md)] border-[var(--app-border)] text-foreground font-semibold uppercase tracking-normal text-[11px] hover:bg-[var(--app-surface-muted)]"
            >
              Sign In to Sync
            </Button>
          )}
        </div>
      </Panel>

      {/* Settings Section */}
      <Panel className="p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground tracking-normal">App Settings</h2>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-normal">Personalize your experience</p>
        </div>

        <div className="space-y-4">
          {/* Appearance Toggle */}
          <div className="p-4 md:p-5 bg-[var(--app-surface-muted)] rounded-[var(--app-radius-lg)] border border-[var(--app-border)] transition-colors flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-xs font-semibold text-foreground uppercase tracking-normal">Dark Mode Appearance</p>
              <p className="text-[11px] text-muted-foreground font-medium tracking-normal">
                Current: {settings.theme === 'dark' ? 'Racing Orange & Charcoal' : 'Legacy Indigo & White'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Sun size={14} className={cn(settings.theme === 'light' ? "text-[var(--app-text-soft)]" : "text-muted-foreground/40")} />
              <Switch 
                checked={settings.theme === 'dark'} 
                onCheckedChange={handleToggleTheme}
                className="data-[state=checked]:bg-foreground"
              />
              <Moon size={14} className={cn(settings.theme === 'dark' ? "text-foreground" : "text-muted-foreground/40")} />
            </div>
          </div>

          {/* Weight Units Selector */}
          <div className="p-4 md:p-5 bg-[var(--app-surface-muted)] rounded-[var(--app-radius-lg)] border border-[var(--app-border)] transition-colors">
            <div className="flex items-center justify-between mb-2">
               <p className="text-xs font-semibold text-foreground uppercase tracking-normal">Weight Units</p>
               <div className="flex rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] p-1">
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
            <p className="text-[11px] text-muted-foreground font-medium tracking-normal">Currently: {settings.units === 'kg' ? 'Kilograms' : 'Pounds'}</p>
          </div>

          {/* Biometric Lock */}
          <div className="p-4 md:p-5 bg-[var(--app-surface-muted)] rounded-[var(--app-radius-lg)] border border-[var(--app-border)] transition-colors flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-foreground uppercase tracking-normal">Biometric Lock</p>
              <p className="text-[11px] text-muted-foreground/60 font-medium tracking-normal">Coming Soon</p>
            </div>
            <Switch disabled />
          </div>

          {/* Workout Reminders */}
          <div className="p-4 md:p-5 bg-[var(--app-surface-muted)] rounded-[var(--app-radius-lg)] border border-[var(--app-border)] transition-colors flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-foreground uppercase tracking-normal">Workout Reminders</p>
              <p className="text-[11px] text-muted-foreground font-medium tracking-normal">Get tomorrow's session summary</p>
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

      {/* Nutrition Goals Settings */}
      <Panel className="p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground tracking-normal flex items-center gap-2">
            Target Diet <Utensils size={20} className="text-[var(--app-accent)]" />
          </h2>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-normal">Manage your nutritional goals</p>
        </div>

        <div className="space-y-6">
          <div className="p-4 md:p-5 bg-[var(--app-accent-soft)] rounded-[var(--app-radius-lg)] border border-[var(--app-border)] flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-xs font-semibold text-foreground uppercase tracking-normal">Track Daily Targets</p>
              <p className="text-[11px] text-muted-foreground font-medium tracking-normal">Show goals on your Health Hub</p>
            </div>
            <Switch 
              checked={settings.nutritionGoals?.enabled} 
              onCheckedChange={(checked) => handleUpdateNutrition('enabled', checked)}
              className="data-[state=checked]:bg-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-normal px-1 flex items-center gap-1.5">
                Target Calories <Flame size={10} className="text-[var(--app-text-soft)] fill-foreground" />
              </label>
              <Input 
                type="number" 
                value={settings.nutritionGoals?.calories || ''}
                onChange={(e) => handleUpdateNutrition('calories', parseInt(e.target.value) || 0)}
                className="rounded-[var(--app-radius-md)] border-[var(--app-border)] h-12 font-semibold text-foreground bg-[var(--app-surface-muted)]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-normal px-1 flex items-center gap-1.5">
                Protein (Grams) <Zap size={10} className="text-destructive fill-destructive" />
              </label>
              <Input 
                type="number" 
                value={settings.nutritionGoals?.protein || ''}
                onChange={(e) => handleUpdateNutrition('protein', parseInt(e.target.value) || 0)}
                className="rounded-[var(--app-radius-md)] border-[var(--app-border)] h-12 font-semibold text-foreground bg-[var(--app-surface-muted)]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-normal px-1">Carbohydrates (Grams)</label>
              <Input 
                type="number" 
                value={settings.nutritionGoals?.carbs || ''}
                onChange={(e) => handleUpdateNutrition('carbs', parseInt(e.target.value) || 0)}
                className="rounded-[var(--app-radius-md)] border-[var(--app-border)] h-12 font-semibold text-foreground bg-[var(--app-surface-muted)]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-normal px-1">Fats (Grams)</label>
              <Input 
                type="number" 
                value={settings.nutritionGoals?.fats || ''}
                onChange={(e) => handleUpdateNutrition('fats', parseInt(e.target.value) || 0)}
                className="rounded-[var(--app-radius-md)] border-[var(--app-border)] h-12 font-semibold text-foreground bg-[var(--app-surface-muted)]"
              />
            </div>
          </div>
        </div>
      </Panel>

        <div className="pt-8 flex flex-col items-center gap-6">
          {notificationsEnabled && notifPermission === 'granted' && (
            <button 
              onClick={testNotification}
              className="text-xs font-semibold uppercase tracking-normal text-muted-foreground hover:text-foreground transition-colors"
            >
              Send Test Reminder
            </button>
          )}

          <div className="w-full flex flex-col gap-3">
             <Button 
                variant="ghost" 
                className="w-full h-12 rounded-[var(--app-radius-md)] text-muted-foreground hover:bg-[var(--app-surface-muted)] hover:text-foreground group transition-all"
                onClick={() => onDataRefreshed?.()}
              >
                <div className="flex items-center gap-3">
                  <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                  <span className="text-[10px] font-semibold uppercase tracking-normal">Manual Data Sync</span>
                </div>
              </Button>

              <Button 
                variant="ghost" 
                className="w-full h-12 rounded-[var(--app-radius-md)] text-muted-foreground hover:bg-[var(--app-surface-muted)] hover:text-foreground group transition-all"
                onClick={exportData}
              >
                <div className="flex items-center gap-3">
                  <Download size={14} />
                  <span className="text-[10px] font-semibold uppercase tracking-normal">Export JSON Backup</span>
                </div>
              </Button>
          </div>
        </div>

      <Panel className="group cursor-pointer p-8 transition-colors hover:border-[var(--app-border-strong)] md:p-10" onClick={() => setShowConsole(true)}>
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-2">
            <Badge className="rounded-[var(--app-radius-sm)] border-none bg-foreground px-3 py-1 text-[9px] font-semibold uppercase tracking-normal text-background">Internal</Badge>
            <h3 className="text-2xl font-semibold text-foreground tracking-normal">Data Control Center</h3>
            <p className="text-muted-foreground text-xs font-semibold max-w-[280px]">Manage training data, exercise libraries, and export all metrics.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowConsole(true)}
            className="rounded-[var(--app-radius-md)] border-[var(--app-border)] bg-[var(--app-surface)] hover:bg-[var(--app-surface-muted)] text-foreground font-semibold text-[10px] uppercase tracking-normal px-6 h-12 transition-all"
          >
            Enter Console <Settings className="ml-2 w-4 h-4 text-[var(--app-accent)]" />
          </Button>
        </div>
      </Panel>

      <div className="text-center pt-4">
        <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-normal mb-1">GymPlanner v1.2.0 - Premium Edition</p>
        <p className="text-[8px] font-medium text-muted-foreground/60 uppercase tracking-normal">Engineered for your progress</p>
      </div>
    </PageShell>
  );
}

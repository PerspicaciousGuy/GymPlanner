import { useState, useEffect } from 'react';
import { 
  User, 
  Settings, 
  Cloud, 
  RefreshCw, 
  LogOut, 
  ChevronRight, 
  Download, 
  Trash2, 
  Activity,
  Shield,
  Weight,
  Bell,
  BellOff,
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
  NOTIFICATION_SETTINGS_KEY
} from '../utils/notificationService';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { loadSettings, updateSetting } from '../utils/settings';
import { formatDateKey } from '../utils/dateUtils';
import LoginDialog from '../components/LoginDialog';
import DataConsolePage from './DataConsolePage';

export default function ProfilePage({ authState, onDataRefreshed, onSettingsChange }) {
  const [settings, setSettings] = useState(loadSettings());
  const [busy, setBusy] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
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
    
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, checked ? 'true' : 'false');
    setNotificationsEnabled(checked);
    
    if (checked) {
      showNotification("🔔 Reminders Enabled", "You will receive a summary of tomorrow's workout daily.");
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
      <div className="animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <Button 
            variant="ghost" 
            onClick={() => setShowConsole(false)}
            className="mb-8 text-slate-400 hover:text-indigo-600 font-black uppercase text-[10px] tracking-widest flex items-center gap-2 group"
          >
            <ChevronRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
            Back to Profile
          </Button>
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden min-h-[70vh]">
            <DataConsolePage hideSidebar />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 px-4">
      {/* Auth Modal */}
      <LoginDialog 
        open={loginOpen} 
        onOpenChange={setLoginOpen} 
        authState={authState} 
      />

      {/* Header Profile Section - Centered */}
      <div className="bg-white rounded-[2rem] border border-slate-100 p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/30 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
        
        <Avatar className="w-24 h-24 border-4 border-white shadow-xl ring-1 ring-slate-100 mb-4">
          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'guest'}`} />
          <AvatarFallback className="bg-indigo-600 text-white font-black text-2xl">
            {user?.email?.[0].toUpperCase() || 'G'}
          </AvatarFallback>
        </Avatar>

        <div className="space-y-1 mb-6">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            {user?.email?.split('@')[0] || 'guest'}
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            {user ? 'Cloud Active' : 'Offline / Local'}
          </p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center justify-center gap-2">
            Active Session: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            <Zap size={10} className="text-indigo-500 fill-indigo-500" />
          </p>
        </div>

        <div className="w-full max-w-xs">
          {user ? (
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              className="w-full rounded-full border-indigo-200 text-indigo-600 font-black uppercase tracking-widest text-[11px] h-12 hover:bg-indigo-50 border-2"
            >
              <LogOut size={16} className="mr-2" /> Sign Out
            </Button>
          ) : (
            <Button 
              variant="outline" 
              onClick={() => setLoginOpen(true)}
              className="w-full rounded-full border-indigo-200 text-indigo-600 font-black uppercase tracking-widest text-[11px] h-12 hover:bg-indigo-50 border-2"
            >
              Sign In to Sync
            </Button>
          )}
        </div>
      </div>

      {/* Settings Section */}
      <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter">App Settings</h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em]">Personalize your experience</p>
        </div>

        <div className="space-y-4">
          {/* Appearance Toggle */}
          <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-xs font-black text-slate-700 uppercase tracking-tight">Dark Mode Appearance</p>
              <p className="text-[11px] text-slate-400 font-bold tracking-tight">
                Current: {settings.theme === 'dark' ? 'Racing Orange & Charcoal' : 'Legacy Indigo & White'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Sun size={14} className={cn(settings.theme === 'light' ? "text-amber-500" : "text-slate-300")} />
              <Switch 
                checked={settings.theme === 'dark'} 
                onCheckedChange={handleToggleTheme}
                className="data-[state=checked]:bg-indigo-600"
              />
              <Moon size={14} className={cn(settings.theme === 'dark' ? "text-indigo-600" : "text-slate-300")} />
            </div>
          </div>

          {/* Weight Units Selector */}
          <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
               <p className="text-xs font-black text-slate-700 uppercase tracking-tight">Weight Units</p>
               <div className="flex bg-slate-100 p-1 rounded-full">
                 <button 
                   onClick={() => handleToggleUnits('kg')}
                   className={cn(
                     "px-3 py-1 rounded-full text-[10px] font-black transition-all",
                     settings.units === 'kg' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                   )}
                 >
                   KG
                 </button>
                 <button 
                   onClick={() => handleToggleUnits('lbs')}
                   className={cn(
                     "px-3 py-1 rounded-full text-[10px] font-black transition-all",
                     settings.units === 'lbs' ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
                   )}
                 >
                   LBS
                 </button>
               </div>
            </div>
            <p className="text-[11px] text-slate-400 font-bold tracking-tight">Currently: {settings.units === 'kg' ? 'Kilograms' : 'Pounds'}</p>
          </div>

          {/* Biometric Lock */}
          <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-slate-700 uppercase tracking-tight">Biometric Lock</p>
              <p className="text-[11px] text-slate-300 font-bold tracking-tight">Coming Soon</p>
            </div>
            <Switch disabled />
          </div>

          {/* Workout Reminders */}
          <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-slate-700 uppercase tracking-tight">Workout Reminders</p>
              <p className="text-[11px] text-slate-400 font-bold tracking-tight">Get tomorrow's session summary</p>
            </div>
            <Switch 
              checked={notificationsEnabled && notifPermission === 'granted'} 
              onCheckedChange={handleToggleNotifications}
              disabled={notifPermission === 'denied' || !isNotificationSupported()}
              className="data-[state=checked]:bg-indigo-600"
            />
          </div>
        </div>
      </div>

      {/* Nutrition Goals Settings */}
      <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-2">
            Target Diet <Utensils size={20} className="text-indigo-600" />
          </h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em]">Manage your nutritional goals</p>
        </div>

        <div className="space-y-6">
          <div className="p-5 bg-indigo-50/30 rounded-3xl border border-indigo-100/50 flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-xs font-black text-indigo-700 uppercase tracking-tight">Track Daily Targets</p>
              <p className="text-[11px] text-indigo-400 font-bold tracking-tight">Show goals on your Health Hub</p>
            </div>
            <Switch 
              checked={settings.nutritionGoals?.enabled} 
              onCheckedChange={(checked) => handleUpdateNutrition('enabled', checked)}
              className="data-[state=checked]:bg-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
                Target Calories <Flame size={10} className="text-amber-500 fill-amber-500" />
              </label>
              <Input 
                type="number" 
                value={settings.nutritionGoals?.calories || 2000}
                onChange={(e) => handleUpdateNutrition('calories', parseInt(e.target.value) || 0)}
                className="rounded-2xl border-slate-100 h-12 font-black text-slate-800 focus:ring-indigo-600"
                placeholder="2000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
                Protein (Grams) <Zap size={10} className="text-rose-500 fill-rose-500" />
              </label>
              <Input 
                type="number" 
                value={settings.nutritionGoals?.protein || 150}
                onChange={(e) => handleUpdateNutrition('protein', parseInt(e.target.value) || 0)}
                className="rounded-2xl border-slate-100 h-12 font-black text-slate-800 focus:ring-indigo-600"
                placeholder="150"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Carbohydrates (Grams)</label>
              <Input 
                type="number" 
                value={settings.nutritionGoals?.carbs || 250}
                onChange={(e) => handleUpdateNutrition('carbs', parseInt(e.target.value) || 0)}
                className="rounded-2xl border-slate-100 h-12 font-black text-slate-800 focus:ring-indigo-600"
                placeholder="250"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Fats (Grams)</label>
              <Input 
                type="number" 
                value={settings.nutritionGoals?.fats || 65}
                onChange={(e) => handleUpdateNutrition('fats', parseInt(e.target.value) || 0)}
                className="rounded-2xl border-slate-100 h-12 font-black text-slate-800 focus:ring-indigo-600"
                placeholder="65"
              />
            </div>
          </div>
        </div>
      </div>

        <div className="pt-8 flex flex-col items-center gap-6">
          {notificationsEnabled && notifPermission === 'granted' && (
            <button 
              onClick={testNotification}
              className="text-xs font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-600 transition-colors"
            >
              Send Test Reminder
            </button>
          )}

          <div className="w-full flex flex-col gap-3 px-4">
             <Button 
                variant="ghost" 
                className="w-full h-12 rounded-2xl text-slate-400 hover:bg-slate-50 hover:text-indigo-600 group transition-all"
                onClick={() => onDataRefreshed?.()}
              >
                <div className="flex items-center gap-3">
                  <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Manual Data Sync</span>
                </div>
              </Button>

              <Button 
                variant="ghost" 
                className="w-full h-12 rounded-2xl text-slate-400 hover:bg-slate-50 hover:text-indigo-600 group transition-all"
                onClick={exportData}
              >
                <div className="flex items-center gap-3">
                  <Download size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Export JSON Backup</span>
                </div>
              </Button>
          </div>
        </div>

      {/* Data Control Center Card */}
      <div className="bg-gradient-to-br from-card to-card/95 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group cursor-pointer border border-border/50" onClick={() => setShowConsole(true)}>
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all opacity-40" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <Badge className="bg-primary text-primary-foreground border-none font-black text-[9px] px-3 py-1 rounded-full uppercase tracking-widest">Internal</Badge>
            <h3 className="text-2xl font-black text-foreground tracking-tight">Data Control Center</h3>
            <p className="text-muted-foreground text-xs font-semibold max-w-[280px]">Manage and export your training data, exercise libraries, and session logs.</p>
          </div>
          <Button variant="outline" className="rounded-2xl border-border bg-card/50 hover:bg-muted text-foreground font-black text-[10px] uppercase tracking-[0.2em] px-6 h-12 border-2 group-hover:border-primary/50 transition-all">
            Enter Console <Settings className="ml-2 w-4 h-4 text-primary" />
          </Button>
        </div>
      </div>

      <div className="text-center pt-4">
        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">GymPlanner v1.2.0 • Premium Edition</p>
        <p className="text-[8px] font-bold text-muted-foreground/60 uppercase tracking-widest">Engineered for your progress</p>
      </div>
    </div>
  );
}


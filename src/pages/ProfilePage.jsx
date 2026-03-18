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
  Zap
} from 'lucide-react';
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

export default function ProfilePage({ authState, onDataRefreshed }) {
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

  if (showConsole) {
    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <Button 
            variant="ghost" 
            onClick={() => setShowConsole(false)}
            className="mb-8 text-slate-500 hover:text-primary font-black uppercase text-[11px] tracking-[0.3em] flex items-center gap-3 group transition-all"
          >
            <ChevronRight size={16} className="rotate-180 group-hover:-translate-x-2 transition-transform duration-300" />
            Return to Identity
          </Button>
          <div className="bg-card rounded-[3.5rem] border border-white/5 shadow-2xl overflow-hidden min-h-[70vh] relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-48 -mt-48 opacity-40 pointer-events-none" />
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
      <div className="bg-card rounded-[3.5rem] border border-white/5 p-12 shadow-2xl flex flex-col items-center text-center relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -mr-24 -mt-24 blur-3xl opacity-40 group-hover:bg-primary/10 transition-all duration-700" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full -ml-16 -mb-16 blur-2xl opacity-20" />
        
        <Avatar className="w-28 h-28 border-4 border-card shadow-2xl ring-2 ring-white/5 mb-6 scale-110">
          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'guest'}`} />
          <AvatarFallback className="bg-primary text-primary-foreground font-black text-3xl italic">
            {user?.email?.[0].toUpperCase() || 'G'}
          </AvatarFallback>
        </Avatar>

        <div className="space-y-2 mb-8 relative z-10">
          <h1 className="text-4xl font-black text-foreground tracking-tighter italic uppercase">
            {user?.email?.split('@')[0] || 'GUEST OPERATOR'}
          </h1>
          <p className="text-[11px] font-black text-primary uppercase tracking-[0.4em] animate-pulse">
            {user ? 'Cloud Finalized' : 'OFFLINE MODE'}
          </p>
          <div className="h-[1px] w-12 bg-white/10 mx-auto my-4" />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] flex items-center justify-center gap-3">
            ESTABLISHED: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_#d4ff00]" />
            ACTIVE
          </p>
        </div>

        <div className="w-full max-w-xs relative z-10">
          {user ? (
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              className="w-full rounded-2xl border-white/10 text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] h-14 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all border-2"
            >
              <LogOut size={16} className="mr-3" strokeWidth={3} /> Purge Session
            </Button>
          ) : (
            <Button 
              variant="outline" 
              onClick={() => setLoginOpen(true)}
              className="w-full rounded-2xl border-primary/20 bg-primary/5 text-primary font-black uppercase tracking-[0.3em] text-[10px] h-14 hover:bg-primary hover:text-primary-foreground transition-all border-2 shadow-[0_10px_30px_rgba(212,255,0,0.1)]"
            >
              Synchronize Data
            </Button>
          )}
        </div>
      </div>

      {/* Settings Section */}
      <div className="bg-card rounded-[3.5rem] border border-white/5 p-10 shadow-2xl space-y-8">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tighter uppercase italic">Infrastructure</h2>
          <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em]">Environmental Calibration</p>
        </div>

        <div className="space-y-4">
          {/* Weight Units Selector */}
          <div className="p-6 bg-white/2 rounded-[2.5rem] border border-white/5 shadow-inner hover:bg-white/5 transition-all group/setting">
            <div className="flex items-center justify-between mb-4">
               <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover/setting:text-slate-200 transition-colors">Unit Scaling</p>
               <div className="flex bg-black/20 p-1.5 rounded-2xl border border-white/5">
                 <button 
                   onClick={() => handleToggleUnits('kg')}
                   className={cn(
                     "px-5 py-2 rounded-xl text-[10px] font-black transition-all tracking-widest",
                     settings.units === 'kg' ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(212,255,0,0.3)]" : "text-slate-600 hover:text-slate-400"
                   )}
                 >
                   KG
                 </button>
                 <button 
                   onClick={() => handleToggleUnits('lbs')}
                   className={cn(
                     "px-5 py-2 rounded-xl text-[10px] font-black transition-all tracking-widest",
                     settings.units === 'lbs' ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(212,255,0,0.3)]" : "text-slate-600 hover:text-slate-400"
                   )}
                 >
                   LBS
                 </button>
               </div>
            </div>
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Currently calibrated to: <span className="text-primary italic">{settings.units === 'kg' ? 'KILOGRAMS' : 'POUNDS'}</span></p>
          </div>

          {/* Biometric Lock */}
          <div className="p-6 bg-white/2 rounded-[2.5rem] border border-white/5 shadow-inner flex items-center justify-between group/lock transition-all hover:bg-white/5">
            <div>
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover/lock:text-slate-300 transition-colors">Biometric Shield</p>
              <p className="text-[10px] text-slate-800 font-black uppercase italic tracking-widest flex items-center gap-2">
                <Shield size={12} className="text-primary/40" />
                LOCKED / ENCRYPTED
              </p>
            </div>
            <Switch disabled className="bg-white/5 opacity-10" />
          </div>

          {/* Workout Reminders */}
          <div className="p-6 bg-white/2 rounded-[2.5rem] border border-white/5 shadow-inner flex items-center justify-between group/remind">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                notificationsEnabled ? "bg-primary/20 text-primary shadow-[0_0_20px_rgba(212,255,0,0.1)]" : "bg-white/5 text-slate-700"
              )}>
                {notificationsEnabled ? <Bell size={20} className="animate-bounce" /> : <BellOff size={20} />}
              </div>
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover/remind:text-slate-200 transition-colors">Alert Protocols</p>
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Synchronized Intelligence</p>
              </div>
            </div>
            <Switch 
              checked={notificationsEnabled && notifPermission === 'granted'} 
              onCheckedChange={handleToggleNotifications}
              disabled={notifPermission === 'denied' || !isNotificationSupported()}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>

        <div className="pt-4 flex flex-col items-center gap-6">
          <div className="w-full flex flex-col gap-4">
             <Button 
                variant="ghost" 
                className="w-full h-14 rounded-3xl text-slate-500 hover:bg-white/5 hover:text-primary group transition-all border border-transparent hover:border-primary/10"
                onClick={() => onDataRefreshed?.()}
              >
                <div className="flex items-center gap-4">
                  <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-700 group-hover:text-primary" />
                  <span className="text-[11px] font-black uppercase tracking-[0.4em]">RESYNC ENGINE</span>
                </div>
              </Button>

              <Button 
                variant="ghost" 
                className="w-full h-14 rounded-3xl text-slate-500 hover:bg-white/5 hover:text-white group transition-all border border-transparent hover:border-white/10"
                onClick={exportData}
              >
                <div className="flex items-center gap-4">
                  <Download size={18} />
                  <span className="text-[11px] font-black uppercase tracking-[0.4em]">EXPORT DATABASE</span>
                </div>
              </Button>
          </div>
        </div>
      </div>

      {/* Advanced Infrastructure Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-black rounded-[4rem] p-12 shadow-[0_40px_80px_rgba(0,0,0,0.5)] relative overflow-hidden group cursor-pointer border border-white/5 hover:border-primary/20 transition-all duration-700" onClick={() => setShowConsole(true)}>
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-1000" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="space-y-4">
            <Badge className="bg-primary text-primary-foreground border-none font-black text-[10px] px-4 py-1.5 rounded-xl uppercase tracking-[0.3em] shadow-[0_0_15px_rgba(212,255,0,0.4)]">SYSTEM CONSOLE</Badge>
            <h3 className="text-4xl font-black text-white tracking-tighter uppercase italic group-hover:text-primary transition-colors duration-500">Core Infrastructure</h3>
            <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.3em] max-w-[320px] leading-relaxed opacity-60 group-hover:opacity-100 transition-opacity">Raw data manipulation & library synchronization protocols.</p>
          </div>
          <Button variant="outline" className="rounded-[2.5rem] border-white/5 bg-white/5 hover:bg-primary hover:text-primary-foreground text-primary font-black text-[11px] uppercase tracking-[0.4em] px-10 h-16 border-2 transition-all shadow-2xl group-hover:scale-105 duration-500">
            ACCESS TERMINAL <ChevronRight className="ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform duration-500" strokeWidth={4} />
          </Button>
        </div>
      </div>

      <div className="text-center pt-8 border-t border-white/5 mt-8 opacity-40 hover:opacity-100 transition-opacity duration-700 cursor-default">
        <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mb-1 italic">GymPlanner v1.2.0 • Ultra Performance Edition</p>
        <p className="text-[8px] font-bold text-slate-600 uppercase tracking-[0.4em]">Proprietary Training Infrastructure • Absolute Calibration</p>
      </div>
    </div>
  );
}


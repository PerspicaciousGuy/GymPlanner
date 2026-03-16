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
  Weight
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { loadSettings, updateSetting } from '../utils/settings';
import { formatDateKey } from '../utils/dateUtils';

export default function ProfilePage({ authState, onDataRefreshed }) {
  const [settings, setSettings] = useState(loadSettings());
  const [busy, setBusy] = useState(false);
  const user = authState?.user;

  const handleToggleUnits = (checked) => {
    const newUnits = checked ? 'lbs' : 'kg';
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

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header Profile Section */}
      <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm flex flex-col md:flex-row items-center gap-8 text-center md:text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 blur-3xl" />
        
        <Avatar className="w-24 h-24 border-4 border-white shadow-xl ring-1 ring-slate-100">
          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'guest'}`} />
          <AvatarFallback className="bg-indigo-600 text-white font-black text-2xl">
            {user?.email?.[0].toUpperCase() || 'G'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              {user?.email?.split('@')[0] || 'Guest Athlete'}
            </h1>
            <Badge variant={user ? 'indigo' : 'secondary'} className="rounded-full px-3 py-0.5 font-black uppercase text-[10px] tracking-widest">
              {user ? 'Cloud Active' : 'Offline / Local'}
            </Badge>
          </div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
            <Activity size={14} className="text-indigo-500" />
            Active Session: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
          {user ? (
            <Button onClick={handleLogout} variant="outline" className="rounded-2xl border-slate-200 text-slate-500 font-black uppercase tracking-widest text-[10px] h-11 hover:bg-slate-50">
              <LogOut size={16} className="mr-2" /> Sign Out
            </Button>
          ) : (
            <Button variant="outline" className="rounded-2xl border-slate-200 text-indigo-600 font-black uppercase tracking-widest text-[10px] h-11 hover:bg-indigo-50">
              Sign In to Sync
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings Area */}
        <section className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
              <Settings size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">App Settings</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Personalize your experience</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-500 border border-slate-100 shadow-sm">
                  <Weight size={18} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-700 uppercase tracking-tight">Weight Units</p>
                  <p className="text-[10px] text-slate-400 font-bold tracking-tight">Currently: {settings.units === 'kg' ? 'Kilograms' : 'Pounds'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                 <span className={cn("text-[10px] font-black uppercase", settings.units === 'kg' ? "text-indigo-600" : "text-slate-300")}>KG</span>
                 <Switch 
                   checked={settings.units === 'lbs'} 
                   onCheckedChange={handleToggleUnits}
                   className="data-[state=checked]:bg-indigo-600"
                 />
                 <span className={cn("text-[10px] font-black uppercase", settings.units === 'lbs' ? "text-indigo-600" : "text-slate-300")}>LBS</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 opacity-50 grayscale">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-500 border border-slate-100 shadow-sm">
                   <Shield size={18} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-700 uppercase tracking-tight">Biometric Lock</p>
                  <p className="text-[10px] text-slate-400 font-bold tracking-tight italic">Coming Soon</p>
                </div>
              </div>
              <Switch disabled />
            </div>
          </div>
        </section>

        {/* Data & Sync Area */}
        <section className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-8">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
              <Cloud size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Data & Synchronization</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Manage your information</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Button 
               variant="outline" 
               className="justify-between h-14 px-6 rounded-2xl border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30 group"
               onClick={() => onDataRefreshed?.()}
            >
              <div className="flex items-center gap-4">
                <RefreshCw size={18} className="text-emerald-500 group-hover:rotate-180 transition-transform duration-500" />
                <div className="text-left">
                  <p className="text-xs font-black text-slate-700 uppercase tracking-tight">Manual Refresh</p>
                  <p className="text-[10px] text-slate-400 font-bold">Sync local and cloud data now</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </Button>

            <Button 
               variant="outline" 
               className="justify-between h-14 px-6 rounded-2xl border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30"
               onClick={exportData}
            >
              <div className="flex items-center gap-4">
                <Download size={18} className="text-indigo-500" />
                <div className="text-left">
                  <p className="text-xs font-black text-slate-700 uppercase tracking-tight">Backup Data</p>
                  <p className="text-[10px] text-slate-400 font-bold">Export everything to JSON</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </Button>

            <Separator className="my-2 bg-slate-50" />

            <Button 
               variant="ghost" 
               className="justify-start h-12 px-2 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-700 group"
            >
              <Trash2 size={16} className="mr-3 text-red-300 group-hover:text-red-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.15em]">Reset Local Cache</span>
            </Button>
          </div>
        </section>
      </div>

      <div className="text-center space-y-2">
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">GymPlanner v1.2.0 • Premium Edition</p>
        <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Powered by shadcn/ui & Firebase Cloud Computing</p>
      </div>
    </div>
  );
}


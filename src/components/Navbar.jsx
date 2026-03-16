import { useState } from 'react';
import { 
  Cloud, 
  CloudOff, 
  LogOut, 
  LogIn, 
  Database, 
  User, 
  AlertCircle,
  ChevronDown,
  RefreshCw,
  Settings,
  Shield
} from 'lucide-react';

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  clearLocalDataAndRehydrateFromCloud,
  migrateLocalDataToCloud,
} from '../utils/storage';

export default function Navbar({ activePage, onNavigate, authState, onDataRefreshed, compact }) {
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [migrationNote, setMigrationNote] = useState('');
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const canCloud = !!authState?.isConfigured;
  const user = authState?.user;

  const handleLogin = async () => {
    if (!email || !password || !authState) return;
    try {
      setBusy(true);
      await authState.login(email.trim(), password);
      setShowLogin(false);
      setPassword('');
    } catch {
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    if (!authState) return;
    try {
      setBusy(true);
      await authState.logout();
      setShowUserMenu(false);
    } finally {
      setBusy(false);
    }
  };

  const handleMigrate = async () => {
    try {
      setBusy(true);
      const result = await migrateLocalDataToCloud();
      setMigrationNote(result.ok ? 'Data synced to cloud' : 'Sync failed');
    } finally {
      setBusy(false);
      setTimeout(() => setMigrationNote(''), 2500);
    }
  };

  const handleClearLocal = async () => {
    try {
      setBusy(true);
      const result = await clearLocalDataAndRehydrateFromCloud();
      if (result.ok) {
        setMigrationNote('Cache cleared');
        onDataRefreshed?.();
      }
    } finally {
      setBusy(false);
      setConfirmingClear(false);
      setTimeout(() => setMigrationNote(''), 3000);
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-14 md:h-16 shrink-0 z-40 sticky top-0">
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs md:text-sm font-bold text-slate-900 capitalize tracking-tight whitespace-nowrap">
              {activePage === 'workout' ? 'Training' : 'Console'}
            </span>
            <div className={`px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wider ${canCloud ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
              {canCloud ? 'Cloud' : 'Local'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {migrationNote && (
            <span className="hidden sm:inline-block text-xs font-semibold text-indigo-600 animate-fade-in pr-4 border-r border-slate-100">
              {migrationNote}
            </span>
          )}

          {canCloud && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="h-9 px-2 pl-1.5 rounded-full bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all hover:text-slate-900"
                >
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
                    <User size={12} />
                  </div>
                  <span className="hidden md:inline-block text-xs font-bold text-slate-700 max-w-[120px] truncate ml-2 mr-1">{user.email}</span>
                  <ChevronDown size={12} className="text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-1 rounded-xl shadow-xl border-slate-200">
                <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-3">Account & Cloud</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-50" />
                <DropdownMenuItem onClick={handleMigrate} className="gap-3 text-xs font-semibold text-slate-600 focus:text-indigo-600 focus:bg-indigo-50/50 cursor-pointer py-2.5">
                  <Cloud size={16} /> Sync Local and Cloud
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setConfirmingClear(true)} className="gap-3 text-xs font-semibold text-slate-600 focus:text-red-600 focus:bg-red-50/50 cursor-pointer py-2.5">
                  <RefreshCw size={16} /> Re-sync from Cloud
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-50" />
                <DropdownMenuItem onClick={handleLogout} className="gap-3 text-xs font-semibold text-slate-400 focus:text-slate-900 focus:bg-slate-50 cursor-pointer py-2.5">
                  <LogOut size={16} /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button 
                onClick={() => setShowLogin(true)}
                className="bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 rounded-xl px-4 py-2"
              >
                <LogIn size={15} className="mr-2" /> Sign In
              </Button>
              
              <Dialog open={showLogin} onOpenChange={setShowLogin}>
                <DialogContent className="max-w-sm rounded-2xl border-slate-200 p-6">
                  <DialogHeader className="space-y-1">
                    <DialogTitle className="text-xl font-bold text-slate-900">Welcome Back</DialogTitle>
                    <DialogDescription className="text-slate-500 text-sm font-medium">
                      Connect your local workout data to the cloud.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Email</Label>
                      <Input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-indigo-500/10 focus-visible:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Password</Label>
                      <Input 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-indigo-500/10 focus-visible:border-indigo-500"
                      />
                    </div>
                    <Button 
                      onClick={handleLogin}
                      disabled={busy}
                      className="w-full h-11 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 mt-2"
                    >
                      {busy ? 'Signing In...' : 'Sign In Now'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      <AlertDialog open={confirmingClear} onOpenChange={setConfirmingClear}>
        <AlertDialogContent className="rounded-2xl max-w-md border-red-50 p-8">
          <AlertDialogHeader className="items-center text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={32} />
            </div>
            <AlertDialogTitle className="text-2xl font-bold text-slate-900">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed mt-2">
              This will clear your local cached data and replace it with your cloud data. Make sure you've synced any local changes first!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-col gap-3 mt-6">
            <AlertDialogAction 
              onClick={handleClearLocal}
              className="w-full py-6 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 shadow-lg shadow-red-100"
            >
              Yes, Clear and Reload
            </AlertDialogAction>
            <AlertDialogCancel className="w-full py-6 text-slate-400 font-bold hover:text-slate-600 border-none hover:bg-transparent">
              No, Keep my data
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}

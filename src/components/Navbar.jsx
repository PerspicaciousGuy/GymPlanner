import { useState } from 'react';
import { 
  CloudOff, 
  AlertCircle,
  RefreshCw,
  Cloud
} from 'lucide-react';

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

import {
  clearLocalDataAndRehydrateFromCloud,
  syncPlannerData,
} from '../utils/storage';

export default function Navbar({ activePage, onNavigate, authState, onDataRefreshed, compact }) {
  const [busy, setBusy] = useState(false);
  const [migrationNote, setMigrationNote] = useState('');
  const [confirmingClear, setConfirmingClear] = useState(false);

  const canCloud = !!authState?.isConfigured;

  const handleSync = async () => {
    try {
      setBusy(true);
      setMigrationNote('Syncing...');
      const ok = await syncPlannerData();
      if (ok) {
        setMigrationNote('Cloud Synced');
        onDataRefreshed?.();
      } else {
        setMigrationNote('Offline - Local Only');
      }
    } finally {
      setBusy(false);
      setTimeout(() => setMigrationNote(''), 3000);
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
            {canCloud && (
              <button
                onClick={handleSync}
                disabled={busy}
                title="Force Sync with Cloud"
                className={`flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 transition-all shadow-sm ${busy ? 'opacity-50' : ''}`}
              >
                <RefreshCw size={10} className={busy ? 'animate-spin' : ''} />
                Sync Now
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {migrationNote && (
            <span className="hidden sm:inline-block text-xs font-semibold text-indigo-600 animate-fade-in pr-4 border-r border-slate-100">
              {migrationNote}
            </span>
          )}
          
          {/* User management moved to Profile Page */}
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

import { useMemo, useState } from 'react';
import { ChevronLeft, Calendar as CalendarIcon, Weight, Layers, Zap, List, LayoutGrid, Sun, Moon, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import WorkoutSection from '../components/WorkoutSection';
import WorkoutLogView from '../components/WorkoutLogView';
import { formatDateDisplay, formatDateKey, getDayOfWeek } from '../utils/dateUtils';
import { loadWorkoutByDate, isDayComplete, loadSessionTitles } from '../utils/storage';
import { calculateRecovery } from '../utils/recoveryLogic';
import InteractiveMuscleMap from '../components/InteractiveMuscleMap/InteractiveMuscleMap';
import { cn } from "@/lib/utils";

export default function DayDetailPage({ date, onBack, syncKey }) {
  const dateStr = formatDateKey(date);
  const dayName = getDayOfWeek(date);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [viewMode, setViewMode] = useState('activity'); // 'activity' | 'grid'
  const [activeSession, setActiveSession] = useState('am');

  // Load and process data for summary
  const dayData = useMemo(() => loadWorkoutByDate(dateStr), [dateStr, syncKey, refreshTrigger]);
  const titles = loadSessionTitles();
  
  const statusInfo = useMemo(() => {
    const amTitle = (titles.am?.[dayName] || '').trim().toLowerCase();
    const pmTitle = (titles.pm?.[dayName] || '').trim().toLowerCase();
    const isOff = (txt) => txt === '' || txt === 'off' || txt === 'rest' || txt.startsWith('off ');
    
    const plannedAm = !isOff(amTitle);
    const plannedPm = !isOff(pmTitle);
    
    const doneAm = isDayComplete(dateStr, 'am');
    const donePm = isDayComplete(dateStr, 'pm');
    
    const amOk = plannedAm ? doneAm : true;
    const pmOk = plannedPm ? donePm : true;
    
    if (amOk && pmOk) return { label: 'Completed', color: 'text-emerald-500 bg-emerald-500/10', icon: <CheckCircle2 size={12} /> };
    if ((plannedAm && doneAm) || (plannedPm && donePm)) return { label: 'Partial', color: 'text-amber-500 bg-amber-500/10', icon: <AlertCircle size={12} /> };
    return { label: 'Missed', color: 'text-rose-500 bg-rose-500/10', icon: <XCircle size={12} /> };
  }, [dateStr, dayName, titles]);

  const stats = useMemo(() => {
    let totalVolume = 0;
    let totalSets = 0;
    const musclesSet = new Set();
    let topExercise = { name: '-', volume: 0 };

    ['am', 'pm'].forEach(session => {
      const sessionData = dayData[session] || {};
      
      // Traditional Groups
      sessionData.groups?.forEach(group => {
        let groupVolume = 0;
        group.rows?.forEach(row => {
          if (row.muscle) musclesSet.add(row.muscle);
          const weight = parseFloat(row.weight) || 0;
          const reps = parseInt(row.reps) || 0;
          const sets = parseInt(row.sets) || 0;
          const vol = weight * reps * sets;
          totalVolume += vol;
          totalSets += sets;
          groupVolume += vol;
        });
        if (groupVolume > topExercise.volume && group.title) {
          topExercise = { name: group.title, volume: groupVolume };
        }
      });

      // Standalone Advanced Exercises
      sessionData.standaloneExercises?.forEach(ex => {
        if (ex.muscle) musclesSet.add(ex.muscle);
        let exVolume = 0;
        let exSets = 0;
        ex.sets?.forEach(set => {
          const weight = parseFloat(set.weight) || 0;
          const reps = parseInt(set.reps) || 0;
          exVolume += weight * reps;
          exSets += 1;
        });
        totalVolume += exVolume;
        totalSets += exSets;
        if (exVolume > topExercise.volume && ex.exercise) {
          topExercise = { name: ex.exercise, volume: exVolume };
        }
      });
    });

    return {
      totalVolume,
      totalSets,
      muscles: Array.from(musclesSet),
      topExerciseName: topExercise.name
    };
  }, [dayData]);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 pb-12">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2.5 bg-card hover:bg-muted text-muted-foreground hover:text-indigo-600 rounded-xl transition-all border border-border hover:border-indigo-200 hover:shadow-sm"
          >
            <ChevronLeft size={24} />
          </button>
          
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-black text-foreground tracking-tight">
                {dayName}
              </h1>
              <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-current/10", statusInfo.color)}>
                {statusInfo.icon}
                {statusInfo.label}
              </div>
            </div>
            <p className="text-[11px] md:text-sm text-muted-foreground font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
              <CalendarIcon size={14} />
              {formatDateDisplay(date)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Muscle Map & Stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card rounded-3xl border border-border p-6 shadow-sm overflow-hidden relative">
            <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Training Focus</h2>
            <div className="flex justify-center -mx-6">
              <InteractiveMuscleMap 
                muscleStats={calculateRecovery(['am', 'pm'].map(session => ({ date: dateStr, ...dayData[session], session })))} 
                size={140}
                noBackground={true}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StatBox 
              icon={<Weight size={18} className="text-indigo-600" />} 
              label="Total Volume" 
              value={`${stats.totalVolume.toLocaleString()} kg`} 
            />
            <StatBox 
              icon={<Layers size={18} className="text-emerald-600" />} 
              label="Total Sets" 
              value={stats.totalSets} 
            />
            <div className="col-span-2 bg-card rounded-2xl border border-border p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <Zap size={20} className="text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Main Movement</p>
                <p className="text-sm font-black text-foreground truncate">{stats.topExerciseName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Lists */}
        <div className="lg:col-span-2 bg-card rounded-3xl border border-border p-4 md:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-6">
              <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Activity Log</h2>
              
              {/* Session Switcher */}
              <div className="flex bg-muted p-1 rounded-xl border border-border/50">
                <button 
                  onClick={() => setActiveSession('am')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeSession === 'am' ? 'bg-card text-indigo-500 shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Sun size={12} /> AM
                </button>
                <button 
                  onClick={() => setActiveSession('pm')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeSession === 'pm' ? 'bg-card text-indigo-500 shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Moon size={12} /> PM
                </button>
              </div>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-2 bg-indigo-500/5 p-1 rounded-xl border border-indigo-500/10">
              <button 
                onClick={() => setViewMode('activity')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  viewMode === 'activity' ? 'bg-indigo-600 text-primary-foreground shadow-lg shadow-indigo-600/20' : 'text-indigo-400 hover:text-indigo-600'
                }`}
              >
                <List size={12} /> Summary
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  viewMode === 'grid' ? 'bg-indigo-600 text-primary-foreground shadow-lg shadow-indigo-600/20' : 'text-indigo-400 hover:text-indigo-600'
                }`}
              >
                <LayoutGrid size={12} /> Detailed Grid
              </button>
            </div>
          </div>

          <div className="animate-in fade-in zoom-in-95 duration-300 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            {viewMode === 'activity' ? (
              <WorkoutLogView 
                dayData={dayData} 
                sessionKey={activeSession}
                onEdit={() => setViewMode('grid')}
              />
            ) : (
              <WorkoutSection
                date={dateStr}
                dayName={dayName}
                syncToken={syncKey}
                onWorkoutChanged={() => setRefreshTrigger(prev => prev + 1)} 
                initialData={dayData}
                hideBadge
                initialSession={activeSession}
              />
            )}
          </div>
        </div>
      </div>
      
      <div className="flex justify-center pt-4">
        <button 
          onClick={onBack}
          className="px-8 py-3 bg-card hover:bg-muted text-foreground font-black rounded-xl text-[11px] uppercase tracking-widest transition-all border border-border"
        >
          Back to History
        </button>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 flex flex-col gap-2">
      <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center border border-border/50">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
        <p className="text-lg font-black text-foreground leading-tight">{value}</p>
      </div>
    </div>
  );
}


import { useMemo, useState } from 'react';
import { ChevronLeft, Calendar as CalendarIcon, Weight, Layers, Zap, List, LayoutGrid, Sun, Moon, CheckCircle2, AlertCircle, XCircle, Flame, Droplet, Cookie, Drumstick, Utensils } from 'lucide-react';
import WorkoutSection from '../components/WorkoutSection';
import WorkoutLogView from '../components/WorkoutLogView';
import { formatDateDisplay, formatDateKey, getDayOfWeek } from '../utils/dateUtils';
import { loadWorkoutByDate, isDayComplete, loadSessionTitles, getEffectiveSessionTitle } from '../utils/storage';
import { loadTrainingPlan } from '../utils/trainingPlan';
import { calculateRecovery, getDailyFocus } from '../utils/recoveryLogic';
import InteractiveMuscleMap from '../components/InteractiveMuscleMap/InteractiveMuscleMap';
import { getFoodLog, getDailyTotals } from '../utils/foodDatabase';
import { cn } from "@/lib/utils";

export default function DayDetailPage({ date, onBack, syncKey }) {
  const dateStr = formatDateKey(date);
  const dayName = getDayOfWeek(date);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [viewMode, setViewMode] = useState('activity'); // 'activity' | 'grid'
  const [activeSession, setActiveSession] = useState('am');

  // Load and process data for summary
  const dayData = useMemo(() => loadWorkoutByDate(dateStr), [dateStr, syncKey, refreshTrigger]);
  const foodLog = useMemo(() => getFoodLog(dateStr), [dateStr, syncKey, refreshTrigger]);
  const foodTotals = useMemo(() => getDailyTotals(dateStr), [dateStr, syncKey, refreshTrigger]);
  
  const amTitle = getEffectiveSessionTitle(date, 'am');
  const pmTitle = getEffectiveSessionTitle(date, 'pm');
  const isOff = (txt) => !txt || ['off', 'rest', ''].includes(txt.trim().toLowerCase()) || txt.trim().toLowerCase().startsWith('off ') || txt.trim().toLowerCase().startsWith('rest ');

  const plannedAm = !isOff(amTitle);
  const plannedPm = !isOff(pmTitle);
  
  const plan = useMemo(() => loadTrainingPlan(), [syncKey]);
  
  const hasDataInPm = useMemo(() => {
    const pm = dayData.pm || {};
    const hasGroups = pm.groups?.some(g => g.rows?.some(r => (r.exercise || '').trim() || (r.weight || '').trim() || (r.reps || '').trim()));
    const hasStandalone = (pm.standaloneExercises || []).length > 0;
    return !!(hasGroups || hasStandalone);
  }, [dayData]);

  const shouldShowSessionSwitcher = plannedPm || hasDataInPm;

  const statusInfo = useMemo(() => {
    const amOk = plannedAm ? isDayComplete(dateStr, 'am') : true;
    const pmOk = plannedPm ? isDayComplete(dateStr, 'pm') : true;
    
    const amDone = isDayComplete(dateStr, 'am');
    const pmDone = isDayComplete(dateStr, 'pm');

    if (amOk && pmOk) return { label: 'Completed', color: 'text-emerald-500 bg-emerald-500/10', icon: <CheckCircle2 size={12} /> };
    if (amDone || pmDone) return { label: 'Partial', color: 'text-amber-500 bg-amber-500/10', icon: <AlertCircle size={12} /> };
    return { label: 'Missed', color: 'text-rose-500 bg-rose-500/10', icon: <XCircle size={12} /> };
  }, [dateStr, dayName, plannedAm, plannedPm]);

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
          
          // Multi-drop support
          const drops = set.drops || (set.isDrop && (set.dropWeight || set.dropReps) ? [{ weight: set.dropWeight, reps: set.dropReps }] : []);
          drops.forEach(drop => {
            exVolume += (parseFloat(drop.weight) || 0) * (parseInt(drop.reps) || 0);
          });
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

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Left Column: Muscle Map & Stats */}
        <div className="lg:col-span-1 xl:col-span-1 space-y-6">
          <div className="bg-card rounded-3xl border border-border p-6 shadow-sm overflow-hidden relative">
            <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Training Focus</h2>
            <div className="flex justify-center -mx-6">
              <InteractiveMuscleMap 
                muscleStats={getDailyFocus(['am', 'pm'].map(session => ({ date: dateStr, ...dayData[session], session })))} 
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

        {/* Middle Column: Detailed Lists */}
        <div className="lg:col-span-2 xl:col-span-2 bg-card rounded-3xl border border-border p-4 md:p-8 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-6">
              <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Activity Log</h2>
              
              {/* Session Switcher */}
              {shouldShowSessionSwitcher && (
                <div className="flex bg-muted p-1 rounded-xl border border-border/50">
                  <button 
                    onClick={() => setActiveSession('am')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeSession === 'am' ? 'bg-card text-indigo-500 shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {plan.sessionLayout === 'split' ? <><Sun size={12} /> AM</> : "Session 1"}
                  </button>
                  <button 
                    onClick={() => setActiveSession('pm')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeSession === 'pm' ? 'bg-card text-indigo-500 shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {plan.sessionLayout === 'split' ? <><Moon size={12} /> PM</> : "Session 2"}
                  </button>
                </div>
              )}
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

        {/* Right Column: Nutrition/Food details */}
        <div className="lg:col-span-3 xl:col-span-1 space-y-6">
          <div className="bg-card rounded-3xl border border-border p-6 shadow-sm overflow-hidden flex flex-col h-full">
            <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Nutrition Summary</h2>
            
            {/* Calories Ring / Summary */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50 mb-6">
              <div>
                <p className="text-2xl font-black text-foreground">{foodTotals.calories}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 flex items-center gap-1"><Flame size={12} className="text-amber-500"/> Calories</p>
              </div>
              <div className="flex gap-4 text-left">
                <div>
                  <p className="text-sm font-black text-foreground">{foodTotals.protein}g</p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest text-rose-500">Pro</p>
                </div>
                <div>
                  <p className="text-sm font-black text-foreground">{foodTotals.carbs}g</p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest text-amber-500">Car</p>
                </div>
                <div>
                  <p className="text-sm font-black text-foreground">{foodTotals.fats}g</p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest text-blue-500">Fat</p>
                </div>
              </div>
            </div>

            {/* Food Log List */}
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3">Logged Food</h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-2 max-h-[400px] scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              {foodLog.length === 0 ? (
                <div className="text-center py-8">
                  <Utensils size={24} className="mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-xs font-bold text-muted-foreground">No food logged</p>
                </div>
              ) : (
                foodLog.map((entry) => (
                  <div key={entry.id} className="p-3 bg-muted/30 rounded-xl border border-border/50 flex items-center justify-between group">
                    <div className="min-w-0 pr-3">
                      <p className="text-xs font-bold text-foreground truncate">{entry.food.name}</p>
                      <div className="flex items-center gap-2 mt-1 w-full flex-wrap">
                        <span className="text-[9px] font-bold text-muted-foreground border border-border px-1.5 py-0.5 rounded-md flex-shrink-0">
                          {entry.servings}x {entry.food.servingSize || 'serving'}
                        </span>
                        {entry.food.brand && (
                          <span className="text-[9px] font-medium text-muted-foreground/80 truncate">
                            {entry.food.brand}
                          </span>
                        )}
                      </div>
                      {entry.food.ingredients && (
                        <p className="text-[9px] font-medium text-muted-foreground/60 mt-1 line-clamp-2">
                          Ing: {entry.food.ingredients}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs font-black text-foreground">{Math.round((entry.food.calories || 0) * entry.servings)} cal</p>
                    </div>
                  </div>
                ))
              )}
            </div>
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


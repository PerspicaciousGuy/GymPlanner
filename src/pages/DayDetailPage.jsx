import { useMemo, useState } from 'react';
import { ChevronLeft, Calendar as CalendarIcon, Weight, Layers, Zap, List, LayoutGrid, Sun, Moon } from 'lucide-react';
import WorkoutSection from '../components/WorkoutSection';
import WorkoutLogView from '../components/WorkoutLogView';
import MuscleMap from '../components/MuscleMap';
import { formatDateDisplay, formatDateKey } from '../utils/dateUtils';
import { loadWorkoutByDate } from '../utils/storage';

export default function DayDetailPage({ date, onBack, syncKey }) {
  const dateStr = formatDateKey(date);
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [viewMode, setViewMode] = useState('activity'); // 'activity' | 'grid'
  const [activeSession, setActiveSession] = useState('am');

  // Load and process data for summary
  const dayData = useMemo(() => loadWorkoutByDate(dateStr), [dateStr, syncKey, refreshTrigger]);
  
  const stats = useMemo(() => {
    let totalVolume = 0;
    let totalSets = 0;
    const musclesSet = new Set();
    let topExercise = { name: '-', volume: 0 };

    ['am', 'pm'].forEach(session => {
      dayData[session]?.groups?.forEach(group => {
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
            className="p-3 bg-white/5 hover:bg-white/10 text-slate-500 hover:text-primary rounded-2xl transition-all border border-white/5 hover:border-primary/20 shadow-2xl active:scale-90"
          >
            <ChevronLeft size={28} strokeWidth={3} />
          </button>
          
          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tighter leading-none italic uppercase">
                {dayName}
              </h1>
              <div className="px-5 py-2 rounded-2xl bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.3em] border border-primary/20 shadow-[0_0_20px_rgba(212,255,0,0.1)] italic animate-pulse">
                Vector Analysis
              </div>
            </div>
            <p className="text-[10px] md:text-xs text-slate-500 font-black uppercase tracking-[0.4em] mt-3 flex items-center gap-3 italic">
              <CalendarIcon size={14} className="text-primary/40" />
              {formatDateDisplay(date)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Muscle Map & Stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card/50 rounded-[3.5rem] border border-white/5 p-10 shadow-2xl backdrop-blur-2xl group/map relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover/map:opacity-100 transition-opacity" />
            <h2 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] mb-8 italic">Anatomical Focus Vector</h2>
            <MuscleMap muscles={stats.muscles} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StatBox 
              icon={<Weight size={20} className="text-primary" strokeWidth={3} />} 
              label="Gross Architecture Load" 
              value={`${stats.totalVolume.toLocaleString()} kg`} 
            />
            <StatBox 
              icon={<Layers size={20} className="text-primary" strokeWidth={3} />} 
              label="Execution Blocks" 
              value={stats.totalSets} 
            />
            <div className="col-span-2 bg-white/2 rounded-[2.5rem] border border-white/5 p-8 flex items-center gap-6 shadow-2xl group/main hover:bg-white/5 transition-all">
              <div className="w-16 h-16 rounded-[2rem] bg-primary text-primary-foreground flex items-center justify-center shadow-[0_10px_30px_rgba(212,255,0,0.3)] group-hover:scale-110 transition-transform">
                <Zap size={28} strokeWidth={3} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-1 italic">Primary Vector</p>
                <p className="text-xl font-black text-foreground uppercase tracking-tight italic">{stats.topExerciseName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Lists */}
        <div className="lg:col-span-2 bg-card/30 rounded-[3.5rem] border border-white/5 p-6 md:p-12 shadow-2xl backdrop-blur-3xl relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-20 -mr-32 -mb-32" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-12 relative z-10">
            <div className="flex items-center gap-10">
              <h2 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] italic">Intelligence Log</h2>
              
              {/* Session Switcher */}
              <div className="flex bg-white/5 p-1.5 rounded-[1.5rem] border border-white/5 shadow-inner">
                <button 
                  onClick={() => setActiveSession('am')}
                  className={`flex items-center gap-3 px-6 py-2.5 rounded-[1.1rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all italic ${
                    activeSession === 'am' ? 'bg-primary text-primary-foreground shadow-[0_10px_20px_rgba(212,255,0,0.2)]' : 'text-slate-500 hover:text-primary'
                  }`}
                >
                  <Sun size={14} strokeWidth={3} /> Alpha
                </button>
                <button 
                  onClick={() => setActiveSession('pm')}
                  className={`flex items-center gap-3 px-6 py-2.5 rounded-[1.1rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all italic ${
                    activeSession === 'pm' ? 'bg-primary text-primary-foreground shadow-[0_10px_20px_rgba(212,255,0,0.2)]' : 'text-slate-500 hover:text-primary'
                  }`}
                >
                  <Moon size={14} strokeWidth={3} /> Omega
                </button>
              </div>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-2 bg-white/2 p-1.5 rounded-[1.5rem] border border-white/5">
              <button 
                onClick={() => setViewMode('activity')}
                className={`flex items-center gap-3 px-6 py-2.5 rounded-[1.1rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all italic ${
                  viewMode === 'activity' ? 'bg-white/10 text-primary border border-primary/20 shadow-[0_0_20px_rgba(212,255,0,0.1)]' : 'text-slate-600 hover:text-primary'
                }`}
              >
                <List size={14} strokeWidth={3} /> Summation
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-3 px-6 py-2.5 rounded-[1.1rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all italic ${
                  viewMode === 'grid' ? 'bg-white/10 text-primary border border-primary/20 shadow-[0_0_20px_rgba(212,255,0,0.1)]' : 'text-slate-600 hover:text-primary'
                }`}
              >
                <LayoutGrid size={14} strokeWidth={3} /> Architecture
              </button>
            </div>
          </div>

          <div className="animate-in fade-in zoom-in-95 duration-300 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
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
      
      <div className="flex justify-center pt-8">
        <button 
          onClick={onBack}
          className="px-12 py-5 bg-white/2 hover:bg-white/5 text-slate-600 hover:text-primary font-black rounded-2xl text-[11px] uppercase tracking-[0.4em] transition-all border border-white/5 hover:border-primary/20 italic shadow-2xl active:scale-95"
        >
          RECALL ARCHIVE
        </button>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value }) {
  return (
    <div className="bg-white/2 rounded-[2.5rem] border border-white/5 p-8 flex flex-col gap-5 shadow-2xl group transition-all hover:bg-white/5">
      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-primary/20 transition-all">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] mb-2 italic">{label}</p>
        <p className="text-3xl font-black text-foreground tracking-tighter leading-none italic">{value}</p>
      </div>
    </div>
  );
}


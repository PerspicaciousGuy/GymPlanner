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
            className="p-2.5 hover:bg-white text-slate-400 hover:text-indigo-600 rounded-xl transition-all border border-transparent hover:border-slate-200 hover:shadow-sm"
          >
            <ChevronLeft size={24} />
          </button>
          
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
                {dayName}
              </h1>
              <div className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-bold uppercase tracking-widest border border-slate-200">
                Session Detail
              </div>
            </div>
            <p className="text-[11px] md:text-sm text-slate-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
              <CalendarIcon size={14} />
              {formatDateDisplay(date)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Muscle Map & Stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Training Focus</h2>
            <MuscleMap muscles={stats.muscles} />
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
            <div className="col-span-2 bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Zap size={20} className="text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Main Movement</p>
                <p className="text-sm font-black text-slate-700 truncate">{stats.topExerciseName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Lists */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-4 md:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-6">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Activity Log</h2>
              
              {/* Session Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setActiveSession('am')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeSession === 'am' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Sun size={12} /> AM
                </button>
                <button 
                  onClick={() => setActiveSession('pm')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeSession === 'pm' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Moon size={12} /> PM
                </button>
              </div>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-2 bg-indigo-50/50 p-1 rounded-xl border border-indigo-100/50">
              <button 
                onClick={() => setViewMode('activity')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  viewMode === 'activity' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-indigo-400 hover:text-indigo-600'
                }`}
              >
                <List size={12} /> Summary
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-indigo-400 hover:text-indigo-600'
                }`}
              >
                <LayoutGrid size={12} /> Detailed Grid
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
      
      <div className="flex justify-center pt-4">
        <button 
          onClick={onBack}
          className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-xl text-[11px] uppercase tracking-widest transition-all"
        >
          Back to History
        </button>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-2">
      <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-lg font-black text-slate-700 leading-tight">{value}</p>
      </div>
    </div>
  );
}


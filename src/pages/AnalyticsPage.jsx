import { useMemo, useState } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  BarChart3, 
  Activity, 
  Flame, 
  Trophy, 
  Dumbbell, 
  Target, 
  TrendingUp, 
  History,
  Calendar
} from 'lucide-react';
import { loadWorkouts, loadCompletion } from '../utils/storage';
import { formatDateDisplay } from '../utils/dateUtils';

const COLORS = ['#4f46e5', '#818cf8', '#c7d2fe', '#6366f1', '#4338ca', '#3730a3'];

export default function AnalyticsPage() {
  const [exerciseFilter, setExerciseFilter] = useState('All');

  const analyticsData = useMemo(() => {
    const workouts = loadWorkouts();
    const completion = loadCompletion();
    
    // Process Volume over time
    const dateKeys = Object.keys(workouts).sort();
    let totalVolume = 0;
    let completedSessions = 0;
    
    const volumeHistory = dateKeys.map(date => {
      let dayVolume = 0;
      const dayData = workouts[date];
      
      ['am', 'pm'].forEach(session => {
        const status = completion[`${date}_${session}`];
        if (status === true) {
          completedSessions++;
          const groups = dayData?.[session]?.groups || [];
          groups.forEach(group => {
            (group.rows || []).forEach(row => {
              const weight = parseFloat(row.weight) || 0;
              const sets = parseInt(row.sets) || 0;
              const reps = parseInt(row.reps) || 0;
              dayVolume += weight * sets * reps;
            });
          });
        }
      });
      
      totalVolume += dayVolume;
      return {
        date,
        displayDate: formatDateDisplay(date),
        volume: dayVolume
      };
    }).filter(d => d.volume > 0);

    // Process Muscle Distribution
    const muscleMap = {};
    Object.values(workouts).forEach(day => {
      ['am', 'pm'].forEach(session => {
        (day[session]?.groups || []).forEach(group => {
          (group.rows || []).forEach(row => {
            if (row.muscle) {
              muscleMap[row.muscle] = (muscleMap[row.muscle] || 0) + 1;
            }
          });
        });
      });
    });

    const muscleData = Object.entries(muscleMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Process Exercise PRs/Progress
    const exerciseList = new Set();
    const exerciseHistory = {};
    
    Object.entries(workouts).forEach(([date, day]) => {
      ['am', 'pm'].forEach(session => {
        const isDone = completion[`${date}_${session}`] === true;
        (day[session]?.groups || []).forEach(group => {
          (group.rows || []).forEach(row => {
            if (row.exercise && row.weight && isDone) {
              const name = row.exercise.trim();
              exerciseList.add(name);
              if (!exerciseHistory[name]) exerciseHistory[name] = [];
              exerciseHistory[name].push({
                date,
                weight: parseFloat(row.weight),
                reps: parseInt(row.reps)
              });
            }
          });
        });
      });
    });

    return {
      volumeHistory,
      muscleData,
      totalVolume,
      completedSessions,
      exerciseList: Array.from(exerciseList).sort(),
      exerciseHistory
    };
  }, []);

  const selectedExerciseData = useMemo(() => {
    if (exerciseFilter === 'All') return [];
    return (analyticsData.exerciseHistory[exerciseFilter] || [])
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [exerciseFilter, analyticsData]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Volume" 
          value={`${(analyticsData.totalVolume / 1000).toFixed(1)}t`} 
          subtitle="Tonnage lifted (lifetime)"
          icon={<BarChart3 className="text-indigo-600" size={20} />}
          color="bg-indigo-50"
        />
        <StatCard 
          title="Consistency" 
          value={`${analyticsData.completedSessions}`} 
          subtitle="Sessions completed"
          icon={<TrendingUp className="text-emerald-600" size={20} />}
          color="bg-emerald-50"
        />
        <StatCard 
          title="Intensity" 
          value="8.4" 
          subtitle="Avg RPE (Est.)"
          icon={<Flame className="text-orange-600" size={20} />}
          color="bg-orange-50"
        />
        <StatCard 
          title="Achievements" 
          value="12" 
          subtitle="Personal Records"
          icon={<Trophy className="text-amber-600" size={20} />}
          color="bg-amber-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Volume Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <Activity size={16} className="text-indigo-600" />
                Training Volume Trend
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Total load per session over time</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData.volumeHistory}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="displayDate" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 600, fill: '#94a3b8'}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 600, fill: '#94a3b8'}}
                />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px'}}
                  labelStyle={{fontSize: '11px', fontWeight: 800, color: '#1e293b', marginBottom: '4px'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#4f46e5" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorVolume)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Muscle Distribution */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <Target size={16} className="text-indigo-600" />
              Body Focus
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Muscle group distribution</p>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={analyticsData.muscleData.slice(0, 6)}>
                <PolarGrid stroke="#f1f5f9" />
                <PolarAngleAxis dataKey="name" tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} />
                <Radar
                  name="Focus"
                  dataKey="value"
                  stroke="#4f46e5"
                  fill="#4f46e5"
                  fillOpacity={0.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {analyticsData.muscleData.slice(0, 3).map((item, i) => (
              <div key={item.name} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i]}} />
                  <span className="text-[10px] font-bold text-slate-600 uppercase">{item.name}</span>
                </div>
                <span className="text-[10px] font-extrabold text-indigo-600">{item.value} Sets</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Exercise Evolution */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <Dumbbell size={16} className="text-indigo-600" />
              Strength Evolution
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Individual exercise progression</p>
          </div>
          
          <select 
            value={exerciseFilter}
            onChange={(e) => setExerciseFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
          >
            <option value="All">Select Exercise</option>
            {analyticsData.exerciseList.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {exerciseFilter === 'All' ? (
          <div className="h-[200px] flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <History size={32} className="mb-2 opacity-20" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Select an exercise to view history</p>
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={selectedExerciseData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 600, fill: '#94a3b8'}}
                  tickFormatter={(val) => formatDateDisplay(val)}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 600, fill: '#94a3b8'}}
                />
                <Tooltip 
                  labelFormatter={(val) => formatDateDisplay(val)}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px'}}
                />
                <Area 
                  type="stepAfter" 
                  dataKey="weight" 
                  stroke="#4338ca" 
                  strokeWidth={3}
                  fillOpacity={0.1} 
                  fill="#4338ca"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, color }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
      <div className={`absolute top-0 right-0 p-8 rotate-12 translate-x-4 -translate-y-4 opacity-5 bg-indigo-600 rounded-full group-hover:scale-110 transition-transform`} />
      <div className="flex items-start justify-between relative">
        <div className={`p-3 rounded-2xl ${color} transition-transform group-hover:scale-110`}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        <h2 className="text-2xl font-black text-slate-800 mt-1">{value}</h2>
        <p className="text-[10px] text-slate-400 font-medium mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

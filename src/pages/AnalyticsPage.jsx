import { useMemo, useState, useRef } from 'react';
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
  TrendingDown, 
  History,
  Calendar,
  Download,
  Share2,
  Award,
  Zap
} from 'lucide-react';
import { loadWorkouts, loadCompletion } from '../utils/storage';
import { formatDateDisplay } from '../utils/dateUtils';

const COLORS = ['#4f46e5', '#818cf8', '#c7d2fe', '#6366f1', '#4338ca', '#3730a3'];

export default function AnalyticsPage() {
  const [exerciseFilter, setExerciseFilter] = useState('All');
  const [timeRange, setTimeRange] = useState('30d');
  const dashboardRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

  const analyticsData = useMemo(() => {
    const workouts = loadWorkouts();
    const completion = loadCompletion();
    
    // Filter dates based on timeRange
    const today = new Date();
    let startDate = new Date(0); // All time default
    
    if (timeRange === '30d') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 30);
    } else if (timeRange === '90d') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 90);
    } else if (timeRange === '1y') {
      startDate = new Date(today);
      startDate.setFullYear(today.getFullYear() - 1);
    }
    
    const startDateString = startDate.toISOString().split('T')[0];
    
    // Previous period for trends
    let prevStartDate = new Date(startDate);
    
    if (timeRange === '30d') {
      prevStartDate.setDate(prevStartDate.getDate() - 30);
    } else if (timeRange === '90d') {
      prevStartDate.setDate(prevStartDate.getDate() - 90);
    } else if (timeRange === '1y') {
      prevStartDate.setFullYear(prevStartDate.getFullYear() - 1);
    } else {
      prevStartDate = new Date(0); // All time has no previous period
    }
    
    const prevStartStr = prevStartDate.toISOString().split('T')[0];
    const prevEndStr = startDateString;

    // Process Volume over time
    const dateKeys = Object.keys(workouts).sort();
    let totalVolume = 0;
    let completedSessions = 0;
    
    let prevTotalVolume = 0;
    let prevCompletedSessions = 0;
    
    const volumeHistory = [];

    dateKeys.forEach(date => {
      if (date < prevStartStr) return; // Skip too old
      
      const isCurrentPeriod = date >= startDateString;
      const isPrevPeriod = date >= prevStartStr && date < prevEndStr;

      let dayVolume = 0;
      let exerciseCount = 0;
      const dailyMuscles = new Set();
      const dayData = workouts[date];
      
      ['am', 'pm'].forEach(session => {
        const status = completion[`${date}_${session}`];
        if (status === true) {
          if (isCurrentPeriod) completedSessions++;
          if (isPrevPeriod) prevCompletedSessions++;

          const groups = dayData?.[session]?.groups || [];
          groups.forEach(group => {
            (group.rows || []).forEach(row => {
              const weight = parseFloat(row.weight) || 0;
              const sets = parseInt(row.sets) || 0;
              const reps = parseInt(row.reps) || 0;
              dayVolume += weight * sets * reps;
              
              if (isCurrentPeriod && row.exercise) {
                exerciseCount++;
                if (row.muscle) dailyMuscles.add(row.muscle);
              }
            });
          });
        }
      });
      
      if (isCurrentPeriod) {
        totalVolume += dayVolume;
        if (dayVolume > 0) {
          volumeHistory.push({
            date,
            displayDate: formatDateDisplay(date),
            volume: dayVolume,
            exerciseCount,
            muscles: Array.from(dailyMuscles)
          });
        }
      } else if (isPrevPeriod) {
        prevTotalVolume += dayVolume;
      }
    });

    // Process Muscle Distribution
    const muscleMap = {};
    Object.entries(workouts).forEach(([date, day]) => {
      if (date < startDateString) return;
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
      if (date < startDateString) return;
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
    
    const calculateTrend = (current, prev) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - prev) / prev) * 100);
    };

    // Extract Top 5 PRs
    const personalRecords = Object.entries(exerciseHistory).map(([name, history]) => {
      const best = [...history].sort((a, b) => b.weight - a.weight)[0];
      return { name, ...best };
    }).sort((a, b) => b.weight - a.weight).slice(0, 5);

    return {
      volumeHistory,
      muscleData,
      totalVolume,
      completedSessions,
      volumeTrend: timeRange === 'all' ? null : calculateTrend(totalVolume, prevTotalVolume),
      sessionsTrend: timeRange === 'all' ? null : calculateTrend(completedSessions, prevCompletedSessions),
      exerciseHistory,
      personalRecords,
      exerciseList: Array.from(exerciseList).sort(),
      insights: {
        highestVolumeDay: [...volumeHistory].sort((a, b) => b.volume - a.volume)[0],
        topMuscle: muscleData[0],
        topExercise: Object.entries(exerciseHistory)
          .map(([name, history]) => ({ name, count: history.length }))
          .sort((a, b) => b.count - a.count)[0]
      }
    };
  }, [timeRange]);

  const selectedExerciseData = useMemo(() => {
    if (exerciseFilter === 'All') return [];
    return (analyticsData.exerciseHistory[exerciseFilter] || [])
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [exerciseFilter, analyticsData]);

  const handleExportImage = () => {
    if (!dashboardRef.current) return;
    setIsExporting(true);
    
    // Add a slight delay to allow any UI states to settle
    setTimeout(async () => {
      try {
        const htmlToImage = await import('html-to-image');
        const dataUrl = await htmlToImage.toJpeg(dashboardRef.current, { 
          quality: 0.95,
          backgroundColor: '#f8fafc',
          style: {
            padding: '24px',
            margin: '0',
            borderRadius: '24px'
          }
        });
        const link = document.createElement('a');
        link.download = `GymPlanner-Insights-${timeRange}-${new Date().toISOString().split('T')[0]}.jpg`;
        link.href = dataUrl;
        link.click();
      } catch (error) {
        console.error('oops, something went wrong!', error);
      } finally {
        setIsExporting(false);
      }
    }, 100);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            Performance Insights
          </h1>
          <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Data-driven training analysis</p>
        </div>
        
        <div className="flex items-center gap-2">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 3 Months</option>
            <option value="1y">This Year</option>
            <option value="all">All Time</option>
          </select>
          <button 
            onClick={handleExportImage}
            disabled={isExporting}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50"
          >
            {isExporting ? <Activity size={14} className="animate-spin" /> : <Share2 size={14} />}
            <span className="hidden sm:inline">Snapshot</span>
          </button>
        </div>
      </div>

      <div ref={dashboardRef} className="space-y-6 bg-[#f8fafc] p-1 -m-1 rounded-3xl">
        {/* Header Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Volume" 
            value={`${(analyticsData.totalVolume / 1000).toFixed(1)}t`} 
            subtitle={timeRange === 'all' ? "Tonnage lifted (lifetime)" : "Tonnage this period"}
            trend={analyticsData.volumeTrend}
            icon={<BarChart3 className="text-indigo-600" size={20} />}
            color="bg-indigo-50"
          />
          <StatCard 
            title="Consistency" 
            value={`${analyticsData.completedSessions}`} 
            subtitle={timeRange === 'all' ? "Sessions completed (lifetime)" : "Sessions this period"}
            trend={analyticsData.sessionsTrend}
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
            value={analyticsData.volumeHistory.length ? "12" : "0"} 
            subtitle="Personal Records"
            icon={<Trophy className="text-amber-600" size={20} />}
            color="bg-amber-50"
          />
        </div>

        {/* Dynamic Insights Highlights */}
        {analyticsData.volumeHistory.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-indigo-600 text-white rounded-2xl p-4 shadow-md flex items-start gap-3 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-10 translate-x-10" />
              <div className="p-2 bg-white/20 rounded-xl shrink-0 backdrop-blur-sm">
                <Zap size={16} className="text-indigo-100" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1">Peak Performance</p>
                <p className="text-sm font-semibold leading-tight">
                  Your highest volume was <span className="text-white font-black">{(analyticsData.insights.highestVolumeDay?.volume / 1000).toFixed(1)}t</span> on <span className="text-indigo-200 font-bold">{analyticsData.insights.highestVolumeDay?.displayDate}</span>.
                </p>
              </div>
            </div>
            
            <div className="bg-emerald-600 text-white rounded-2xl p-4 shadow-md flex items-start gap-3 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-10 translate-x-10" />
              <div className="p-2 bg-white/20 rounded-xl shrink-0 backdrop-blur-sm">
                <Target size={16} className="text-emerald-100" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest mb-1">Primary Focus</p>
                <p className="text-sm font-semibold leading-tight">
                  <span className="text-white font-black">{analyticsData.insights.topMuscle?.name || 'Nothing'}</span> is your most trained muscle group with <span className="text-emerald-200 font-bold">{analyticsData.insights.topMuscle?.value || 0} sets</span>.
                </p>
              </div>
            </div>

            <div className="bg-amber-500 text-white rounded-2xl p-4 shadow-md flex items-start gap-3 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-10 translate-x-10" />
              <div className="p-2 bg-white/20 rounded-xl shrink-0 backdrop-blur-sm">
                <Award size={16} className="text-amber-100" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-amber-200 uppercase tracking-widest mb-1">Top Movement</p>
                <p className="text-sm font-semibold leading-tight">
                  You've performed <span className="text-white font-black">{analyticsData.insights.topExercise?.name || 'Nothing'}</span> the most, recording <span className="text-amber-200 font-bold">{analyticsData.insights.topExercise?.count || 0} sessions</span>.
                </p>
              </div>
            </div>
          </div>
        )}

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
            {analyticsData.volumeHistory.length === 0 ? (
              <div className="h-[300px] flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <Activity size={32} className="mb-2 opacity-20" />
                <p className="text-[10px] font-bold uppercase tracking-widest mt-2">No volume data for this period</p>
                <p className="text-[10px] text-slate-400 font-medium max-w-[200px] text-center mt-1">Log workouts and mark them as complete to see trends.</p>
              </div>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.volumeHistory} style={{ outline: 'none' }}>
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
                      tickFormatter={(val) => `${(val / 1000).toFixed(1)}t`}
                      tick={{fontSize: 10, fontWeight: 600, fill: '#94a3b8'}}
                    />
                    <Tooltip 
                      content={<CustomVolumeTooltip />}
                      cursor={{ stroke: '#c7d2fe', strokeWidth: 2, strokeDasharray: '5 5' }}
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
            )}
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
            {analyticsData.muscleData.length === 0 ? (
              <div className="h-[250px] flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <Target size={32} className="mb-2 opacity-20" />
                <p className="text-[10px] font-bold uppercase tracking-widest">No muscle data yet</p>
              </div>
            ) : (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={analyticsData.muscleData.slice(0, 6)} style={{ outline: 'none' }}>
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
            )}
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

        {/* PR Board */}
        {analyticsData.personalRecords.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                  <Trophy size={16} className="text-amber-500" />
                  Personal Records
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">All-time best lifts</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {analyticsData.personalRecords.map((pr, idx) => (
                <div key={idx} className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 p-4 relative overflow-hidden group hover:border-amber-200 hover:shadow-md transition-all">
                  <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-all">
                    <Trophy size={64} />
                  </div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 truncate pr-6" title={pr.name}>
                    {pr.name}
                  </p>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-2xl font-black text-slate-800 leading-none">{pr.weight}</span>
                    <span className="text-xs font-bold text-slate-400 mb-0.5">kg</span>
                  </div>
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    <History size={8} /> {pr.reps} Reps
                  </div>
                  <p className="text-[9px] font-semibold text-slate-400 mt-3">{formatDateDisplay(pr.date)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

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
                <AreaChart data={selectedExerciseData} style={{ outline: 'none' }}>
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
    </div>
  );
}





function StatCard({ title, value, subtitle, icon, color, trend }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
      <div className={`absolute top-0 right-0 p-8 rotate-12 translate-x-4 -translate-y-4 opacity-5 bg-indigo-600 rounded-full group-hover:scale-110 transition-transform`} />
      <div className="flex items-start justify-between relative">
        <div className={`p-3 rounded-2xl ${color} transition-transform group-hover:scale-110`}>
          {icon}
        </div>
        {trend !== undefined && trend !== null && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {trend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        <h2 className="text-2xl font-black text-slate-800 mt-1">{value}</h2>
        <p className="text-[10px] text-slate-400 font-medium mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

const CustomVolumeTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-4 max-w-[220px]">
        <p className="text-xs font-black text-slate-800 mb-1">{data.displayDate}</p>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-indigo-600" />
          <p className="text-sm font-bold text-indigo-600">
            {(data.volume / 1000).toFixed(1)} <span className="text-[10px] font-medium uppercase tracking-widest text-indigo-400">tons</span>
          </p>
        </div>
        
        {data.exerciseCount > 0 && (
          <div className="pt-3 border-t border-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Dumbbell size={10} /> Movements
              </span>
              <span className="text-xs font-black text-slate-700">{data.exerciseCount}</span>
            </div>
            {data.muscles && data.muscles.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {data.muscles.map((m, i) => (
                  <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold uppercase tracking-wider">
                    {m}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
  return null;
};



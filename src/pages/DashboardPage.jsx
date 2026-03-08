import { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie, Legend
} from 'recharts';
import { Activity, Target, Flame, TrendingUp } from 'lucide-react';
import { loadWorkouts, loadCompletion, getMuscleGroupKeys } from '../utils/storage';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#6366f1'];

export default function DashboardPage() {
    const workouts = useMemo(() => loadWorkouts(), []);
    const completion = useMemo(() => loadCompletion(), []);
    const allMuscles = useMemo(() => getMuscleGroupKeys(), []);

    // 1. Calculate Volume Per Muscle Group
    const volumeData = useMemo(() => {
        const stats = {};
        Object.values(workouts).forEach(day => {
            ['am', 'pm'].forEach(sessionKey => {
                const session = day[sessionKey];
                if (!session?.groups) return;
                session.groups.forEach(group => {
                    group.rows.forEach(row => {
                        if (!row.muscle || !row.sets) return;
                        const sets = parseInt(row.sets) || 0;
                        const reps = parseInt(row.reps) || 0;
                        const weight = parseFloat(row.weight) || 0;
                        const totalVolume = sets * reps * weight; // simplified volume

                        if (!stats[row.muscle]) stats[row.muscle] = 0;
                        stats[row.muscle] += sets; // Let's track total sets as "Volume" for a clearer chart
                    });
                });
            });
        });

        return Object.entries(stats)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [workouts]);

    // 2. Weekly Completion Rate
    const completionStats = useMemo(() => {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        let totalPlanned = 0;
        let completed = 0;

        days.forEach(day => {
            ['am', 'pm'].forEach(session => {
                const key = `${day}_${session}`;
                // If there's a workout planned (more than just empty rows)
                const hasWorkout = workouts[day]?.[session]?.groups?.some(g => g.rows.some(r => r.exercise));
                if (hasWorkout) {
                    totalPlanned++;
                    if (completion[key] === true) completed++;
                }
            });
        });

        const rate = totalPlanned > 0 ? Math.round((completed / totalPlanned) * 100) : 0;
        return { totalPlanned, completed, rate };
    }, [workouts, completion]);

    return (
        <div className="max-w-7xl mx-auto px-6 py-10 space-y-10 min-h-screen bg-white">
            <div className="animate-apple">
                <h1 className="text-4xl font-bold text-[#1C1C1E] tracking-tight">Activity</h1>
                <p className="text-[#8E8E93] mt-2 font-medium">Insights into your training progression.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-apple">
                <StatCard
                    title="Adherence"
                    value={`${completionStats.rate}%`}
                    icon={<Activity className="text-[#007AFF] w-5 h-5" />}
                    subtitle="Weekly completion"
                />
                <StatCard
                    title="Volume"
                    value={completionStats.completed}
                    icon={<Target className="text-[#5856D6] w-5 h-5" />}
                    subtitle={`Sessions performed`}
                />
                <StatCard
                    title="Core Focus"
                    value={volumeData[0]?.name || 'N/A'}
                    icon={<Flame className="text-[#AF52DE] w-5 h-5" />}
                    subtitle="Top priority AREA"
                />
                <StatCard
                    title="Workload"
                    value={volumeData.reduce((acc, curr) => acc + curr.value, 0)}
                    icon={<TrendingUp className="text-[#34C759] w-5 h-5" />}
                    subtitle="Cumulative sets"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-apple">
                {/* Muscle Distribution Chart */}
                <div className="premium-card p-8 bg-white/50 backdrop-blur-sm">
                    <h3 className="text-lg font-bold text-[#1C1C1E] mb-8 tracking-tight uppercase text-[11px]">Training Distribution</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={volumeData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f2f2f7" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    width={100}
                                    tick={{ fill: '#8E8E93', fontSize: 11, fontWeight: 700 }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#F2F2F7' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', padding: '12px' }}
                                />
                                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                                    {volumeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Volume share pie chart */}
                <div className="premium-card p-8 bg-white/50 backdrop-blur-sm">
                    <h3 className="text-lg font-bold text-[#1C1C1E] mb-8 tracking-tight uppercase text-[11px]">Muscle Emphasis</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={volumeData}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {volumeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, subtitle }) {
    return (
        <div className="premium-card p-6 border-none bg-white shadow-sm hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-gray-50/50 rounded-xl">
                    {icon}
                </div>
            </div>
            <div className="flex flex-col">
                <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-widest">{title}</span>
                <span className="text-4xl font-bold text-[#1C1C1E] mt-1 tracking-tight">{value}</span>
                <p className="text-[11px] text-[#AEAEC0] font-medium mt-1">{subtitle}</p>
            </div>
        </div>
    );
}

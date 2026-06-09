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
} from 'recharts';
import { Activity, Award, BarChart3, Flame, History, Target, Trophy, TrendingUp, Zap } from 'lucide-react';
import { TabsContent } from "@/components/ui/tabs";
import { Panel } from "@/components/layout/Panel";
import { cn } from "@/lib/utils";
import { formatDateDisplay } from '../../utils/dateUtils';
import { AnalyticsStatCard } from './AnalyticsStatCard';
import { CustomVolumeTooltip } from './AnalyticsTooltips';

const analyticsPanelTitleClass =
  "flex items-center gap-2 text-sm font-semibold uppercase tracking-normal text-foreground";

const analyticsPanelMetaClass =
  "mt-1 text-[10px] font-medium uppercase tracking-normal text-muted-foreground";

const analyticsEmptyStateClass =
  "flex h-[300px] flex-col items-center justify-center rounded-[var(--app-radius-md)] border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] text-center text-muted-foreground";

const metricToggleButtonClass =
  "rounded-[var(--app-radius-sm)] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-normal transition-all";

export function OverviewTabContent({ analyticsData, timeRange, muscleMetric, setMuscleMetric }) {
  return (
    <TabsContent value="overview" className="space-y-6 outline-none">
            <div className="flex flex-col gap-4">
              <AnalyticsStatCard
                title="Total Volume"
                value={analyticsData.totalVolume / 1000}
                suffix="t"
                subtitle={timeRange === 'all' ? "Tonnage lifted (lifetime)" : "Tonnage this period"}
                trend={analyticsData.volumeTrend}
                icon={<BarChart3 size={24} />}
                iconColor="text-primary"
                bgColor="bg-primary/10"
                className="stat-card"
              />

              {/* Micro Metrics Row - 3 Side-by-side Cards */}
              <div className="grid grid-cols-3 gap-3 md:gap-4 overflow-x-auto pb-4 md:pb-0 no-scrollbar snap-x">
                <AnalyticsStatCard
                  isMicro
                  title="Consistency"
                  value={analyticsData.compliance}
                  suffix="%"
                  subtitle={`${analyticsData.completedSessions} Days`}
                  trend={analyticsData.complianceTrend}
                  icon={<TrendingUp size={16} />}
                  iconColor="text-emerald-500"
                  bgColor="bg-emerald-500/10"
                  className="stat-center snap-center"
                />
                <AnalyticsStatCard
                  isMicro
                  title="Intensity"
                  value={8.4}
                  subtitle="Avg RPE"
                  icon={<Flame size={16} />}
                  iconColor="text-orange-500"
                  bgColor="bg-orange-500/10"
                  className="stat-center snap-center"
                />
                <AnalyticsStatCard
                  isMicro
                  title="Records"
                  value={analyticsData.volumeHistory.length ? 12 : 0}
                  subtitle="New PRs"
                  icon={<Trophy size={16} />}
                  iconColor="text-amber-500"
                  bgColor="bg-amber-500/10"
                  className="stat-center snap-center"
                />
              </div>
            </div>

            {analyticsData.volumeHistory.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Panel className="relative flex items-start gap-4 overflow-hidden border-primary/15 bg-primary/5 p-4">
                  <div className="shrink-0 rounded-[var(--app-radius-md)] bg-primary/15 p-2.5">
                    <Zap size={18} className="text-primary-foreground fill-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-normal text-primary">Peak Performance</p>
                    <p className="text-sm font-medium leading-snug text-foreground">
                      Your highest volume was <span className="font-semibold text-primary">{(analyticsData.insights.highestVolumeDay?.volume / 1000).toFixed(1)}t</span> on <span className="font-semibold underline decoration-primary/30 decoration-2 underline-offset-2">{analyticsData.insights.highestVolumeDay?.displayDate}</span>.
                    </p>
                  </div>
                </Panel>

                <Panel className="relative flex items-start gap-4 overflow-hidden border-emerald-500/15 bg-emerald-500/5 p-4">
                  <div className="shrink-0 rounded-[var(--app-radius-md)] bg-emerald-500/15 p-2.5">
                    <Target size={18} className="text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-normal text-emerald-600">Primary Focus</p>
                    <p className="text-sm font-medium leading-snug text-foreground">
                      <span className="font-semibold text-emerald-700">{analyticsData.insights.topMuscle?.name || 'Nothing'}</span> is your most trained muscle group with <span className="font-semibold text-emerald-600">{analyticsData.insights.topMuscle?.sets || 0} sets</span>.
                    </p>
                  </div>
                </Panel>

                <Panel className="relative flex items-start gap-4 overflow-hidden border-amber-500/15 bg-amber-500/5 p-4">
                  <div className="shrink-0 rounded-[var(--app-radius-md)] bg-amber-500/15 p-2.5">
                    <Award size={18} className="text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-normal text-amber-600">Top Movement</p>
                    <p className="text-sm font-medium leading-snug text-foreground">
                      You've performed <span className="font-semibold text-amber-700">{analyticsData.insights.topExercise?.name || 'Nothing'}</span> the most, recording <span className="font-semibold text-amber-600">{analyticsData.insights.topExercise?.count || 0} sessions</span>.
                    </p>
                  </div>
                </Panel>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Panel className="lg:col-span-2 p-5 md:p-6 transition-all chart-container">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className={analyticsPanelTitleClass}>
                      <Activity size={16} className="text-primary" />
                      Training Volume Trend
                    </h3>
                    <p className={analyticsPanelMetaClass}>Total load per session over time</p>
                  </div>
                </div>
                {analyticsData.volumeHistory.length === 0 ? (
                  <div className={analyticsEmptyStateClass}>
                    <Activity size={32} className="mb-2 opacity-20" />
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-normal">No volume data for this period</p>
                    <p className="text-[10px] text-muted-foreground font-medium max-w-[200px] text-center mt-1">Log workouts and mark them as complete to see trends.</p>
                  </div>
                ) : (
                  <div className="h-[300px] w-full min-w-0" style={{ minHeight: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analyticsData.volumeHistory} style={{ outline: 'none' }}>
                        <defs>
                          <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--app-border)" strokeOpacity={0.7} />
                        <XAxis
                          dataKey="displayDate"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fontWeight: 600, fill: 'var(--app-text-soft)' }}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(val) => `${(val / 1000).toFixed(1)}t`}
                          tick={{ fontSize: 10, fontWeight: 600, fill: 'var(--app-text-soft)' }}
                        />
                        <Tooltip
                          content={<CustomVolumeTooltip />}
                          cursor={{ stroke: 'var(--app-accent)', strokeWidth: 2, strokeDasharray: '5 5', opacity: 0.3 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="volume"
                          stroke="var(--app-accent)"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorVolume)"
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Panel>

              <Panel className="p-5 md:p-6 transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className={analyticsPanelTitleClass}>
                      <Target size={16} className="text-primary" />
                      Body Focus
                    </h3>
                    <p className={analyticsPanelMetaClass}>Muscle group distribution</p>
                  </div>
                  <div className="flex rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-1">
                    <button
                      onClick={() => setMuscleMetric('sets')}
                      className={cn(
                        metricToggleButtonClass,
                        muscleMetric === 'sets' ? "bg-[var(--app-surface)] text-foreground shadow-sm" : "text-muted-foreground"
                      )}
                    >
                      Sets
                    </button>
                    <button
                      onClick={() => setMuscleMetric('volume')}
                      className={cn(
                        metricToggleButtonClass,
                        muscleMetric === 'volume' ? "bg-[var(--app-surface)] text-foreground shadow-sm" : "text-muted-foreground"
                      )}
                    >
                      Volume
                    </button>
                  </div>
                </div>

                {analyticsData.muscleData.length === 0 ? (
                  <div className="flex h-[250px] flex-col items-center justify-center rounded-[var(--app-radius-md)] border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] text-center text-muted-foreground">
                    <Target size={32} className="mb-2 opacity-20" />
                    <p className="text-[10px] font-semibold uppercase tracking-normal">No muscle data yet</p>
                  </div>
                ) : (() => {
                  const currentMap = analyticsData.muscleData;
                  const prevMap = analyticsData.prevMuscleData;
                  const allMuscles = Array.from(new Set([...currentMap.map(m => m.name), ...prevMap.map(m => m.name)]));

                  const combinedData = allMuscles.map(name => {
                    const curr = currentMap.find(m => m.name === name);
                    const past = prevMap.find(m => m.name === name);
                    return {
                      name,
                      current: curr ? curr[muscleMetric] : 0,
                      previous: past ? past[muscleMetric] : 0
                    };
                  }).sort((a, b) => b.current - a.current).slice(0, 6);

                  return (
                    <div className="h-[250px] w-full min-w-0" style={{ minHeight: '250px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={combinedData} style={{ outline: 'none' }}>
                          <PolarGrid stroke="var(--app-border)" strokeOpacity={1} strokeWidth={1} />
                          <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--app-text-soft)' }} />

                          <Radar
                            name="Previous"
                            dataKey="previous"
                            stroke="var(--app-border-strong)"
                            strokeWidth={1}
                            strokeDasharray="4 4"
                            fill="var(--app-surface-muted)"
                            fillOpacity={0.2}
                          />

                          <Radar
                            name="Current"
                            dataKey="current"
                            stroke="var(--app-accent)"
                            strokeWidth={2}
                            fill="url(#colorRadar)"
                            fillOpacity={0.5}
                          />

                          <defs>
                            <radialGradient id="colorRadar" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                              <stop offset="0%" stopColor="var(--app-accent)" stopOpacity={0.8} />
                              <stop offset="100%" stopColor="var(--app-border-strong)" stopOpacity={0.3} />
                            </radialGradient>
                          </defs>
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })()}

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1 w-2.5 rounded-[var(--app-radius-sm)] bg-foreground" />
                      <span className="text-[9px] font-semibold uppercase tracking-normal text-muted-foreground">Current</span>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-50">
                      <div className="h-1 w-2.5 rounded-[var(--app-radius-sm)] border border-[var(--app-border-strong)] border-dashed" />
                      <span className="text-[9px] font-semibold uppercase tracking-normal text-muted-foreground">Previous</span>
                    </div>
                  </div>

                  {analyticsData.muscleData.slice(0, 3).map((item) => {
                    const pastItem = analyticsData.prevMuscleData.find(m => m.name === item.name);
                    const pastVal = pastItem ? pastItem[muscleMetric] : 0;
                    const currVal = item[muscleMetric];
                    const diff = pastVal > 0 ? Math.round(((currVal - pastVal) / pastVal) * 100) : 0;

                    return (
                      <div key={item.name} className="group relative flex items-center justify-between overflow-hidden rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 transition-all hover:border-[var(--app-border-strong)]">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-[var(--app-radius-sm)] bg-foreground" />
                          <span className="text-[10px] font-semibold uppercase tracking-normal text-foreground">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {diff !== 0 && (
                            <span className={cn(
                              "text-[9px] font-semibold tracking-normal",
                              diff > 0 ? "text-emerald-500" : "text-rose-500"
                            )}>
                              {diff > 0 ? '+' : ''}{diff}%
                            </span>
                          )}
                          <span className="text-[10px] font-semibold text-primary">
                            {currVal.toLocaleString()} {muscleMetric === 'sets' ? 'Sets' : 'kg'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            </div>

            {analyticsData.personalRecords.length > 0 && (
              <Panel className="p-5 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className={analyticsPanelTitleClass}>
                      <Trophy size={16} className="text-amber-500" />
                      Personal Records
                    </h3>
                    <p className={analyticsPanelMetaClass}>All-time best lifts</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {analyticsData.personalRecords.map((pr, idx) => (
                    <div key={idx} className="group relative overflow-hidden rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4 transition-all hover:border-amber-500/30">
                      <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-all">
                        <Trophy size={64} className="text-foreground" />
                      </div>
                      <p className="mb-2 truncate pr-6 text-[11px] font-semibold uppercase tracking-normal text-muted-foreground" title={pr.name}>
                        {pr.name}
                      </p>
                      <div className="flex items-end gap-1 mb-1">
                        <span className="text-2xl font-semibold text-foreground leading-none">{pr.weight}</span>
                        <span className="text-xs font-bold text-muted-foreground mb-0.5">kg</span>
                      </div>
                      <div className="inline-flex items-center gap-1 rounded-[var(--app-radius-sm)] bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-normal text-muted-foreground">
                        <History size={8} /> {pr.reps} Reps
                      </div>
                      <p className="text-[9px] font-semibold text-muted-foreground mt-3">{formatDateDisplay(pr.date)}</p>
                    </div>
                  ))}
                </div>
              </Panel>
            )}
          </TabsContent>
  );
}

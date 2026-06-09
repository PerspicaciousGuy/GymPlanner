import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Activity, Dumbbell, History, TrendingDown, TrendingUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";
import { Panel } from "@/components/layout/Panel";
import { cn } from "@/lib/utils";
import { formatDateDisplay } from '../../utils/dateUtils';
import { CustomExerciseTooltip } from './AnalyticsTooltips';

const focusPanelTitleClass =
  "flex items-center gap-2 text-sm font-semibold uppercase tracking-normal text-foreground";

const focusPanelMetaClass =
  "mt-1 text-[10px] font-medium uppercase tracking-normal text-muted-foreground";

const focusEmptyStateClass =
  "flex h-[300px] flex-col items-center justify-center rounded-[var(--app-radius-md)] border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] text-center text-muted-foreground";

const focusStatTileClass =
  "rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3";

export function EvolutionTabContent({ exerciseFilter, setExerciseFilter, analyticsData, selectedExerciseData }) {
  return (
    <TabsContent value="evolution" className="outline-none">
            <Panel className="p-5 md:p-6 chart-container">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className={focusPanelTitleClass}>
                    <Dumbbell size={16} className="text-primary" />
                    Strength Evolution
                  </h3>
                  <p className={focusPanelMetaClass}>Individual exercise progression</p>
                </div>

                <Select value={exerciseFilter} onValueChange={setExerciseFilter}>
                  <SelectTrigger className="h-9 w-full rounded-[var(--app-radius-md)] border-[var(--app-border)] bg-[var(--app-surface-muted)] text-xs font-semibold text-foreground md:w-[220px]">
                    <SelectValue placeholder="Select Exercise" />
                  </SelectTrigger>
                  <SelectContent className="rounded-[var(--app-radius-md)] border-border">
                    <SelectItem value="All" className="text-xs font-semibold">Select Exercise</SelectItem>
                    {analyticsData.exerciseList.map(name => (
                      <SelectItem key={name} value={name} className="text-xs font-semibold">{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!exerciseFilter || exerciseFilter === 'All' ? (
                <div className={focusEmptyStateClass}>
                  <div className="mb-4 rounded-full bg-[var(--app-surface)] p-4">
                    <History size={32} className="opacity-20 translate-x-[1px]" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-normal">Select an exercise</p>
                  <p className="mt-1 text-[10px] font-medium uppercase tracking-normal text-muted-foreground">to view your progression history</p>
                </div>
              ) : selectedExerciseData.length === 0 ? (
                <div className={focusEmptyStateClass}>
                  <Activity size={32} className="mb-2 opacity-20" />
                  <p className="text-[10px] font-semibold uppercase tracking-normal">No history recorded yet</p>
                  <p className="mt-1 max-w-[280px] text-[10px] font-medium text-muted-foreground">Check back once this exercise appears in a completed session.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className={focusStatTileClass}>
                      <p className="mb-1 text-[9px] font-semibold uppercase tracking-normal text-muted-foreground">Max Weight</p>
                      <p className="text-xl font-semibold text-foreground">{Math.max(...selectedExerciseData.map(d => d.weight))}kg</p>
                    </div>
                    <div className={focusStatTileClass}>
                      <p className="mb-1 text-[9px] font-semibold uppercase tracking-normal text-muted-foreground">Peak 1RM (Est)</p>
                      <p className="text-xl font-semibold text-primary">{Math.max(...selectedExerciseData.map(d => d.est1RM))}kg</p>
                    </div>
                    <div className={focusStatTileClass}>
                      <p className="mb-1 text-[9px] font-semibold uppercase tracking-normal text-muted-foreground">Sessions</p>
                      <p className="text-xl font-semibold text-foreground">{selectedExerciseData.length}</p>
                    </div>
                    <div className={focusStatTileClass}>
                      <p className="mb-1 text-[9px] font-semibold uppercase tracking-normal text-muted-foreground">Growth</p>
                      <div className="flex items-center gap-1">
                        {selectedExerciseData.length > 1 ? (
                          (() => {
                            const first = selectedExerciseData[0].weight;
                            const last = selectedExerciseData[selectedExerciseData.length - 1].weight;
                            const diff = last - first;
                            return (
                              <>
                                {diff >= 0 ? <TrendingUp size={14} className="text-emerald-500" /> : <TrendingDown size={14} className="text-rose-500" />}
                                <p className={cn("text-xl font-semibold", diff >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                  {Math.abs(diff)}kg
                                </p>
                              </>
                            );
                          })()
                        ) : (
                          <p className="text-xl font-semibold text-muted-foreground">-</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="h-[300px] w-full min-w-0" style={{ minHeight: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={selectedExerciseData} style={{ outline: 'none' }}>
                        <defs>
                          <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="color1RM" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="oklch(0.58 0.23 268)" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="oklch(0.58 0.23 268)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-slate-100)" strokeOpacity={0.5} />
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--color-slate-400)' }}
                          tickFormatter={(val) => formatDateDisplay(val).split(',')[0]}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--color-slate-400)' }}
                          domain={['auto', 'auto']}
                        />
                        <Tooltip
                          content={<CustomExerciseTooltip />}
                          cursor={{ stroke: 'var(--color-primary)', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="est1RM"
                          stroke="oklch(0.58 0.23 268)"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          fillOpacity={1}
                          fill="url(#color1RM)"
                          animationDuration={1500}
                        />
                        <Area
                          type="monotone"
                          dataKey="weight"
                          stroke="var(--primary)"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorWeight)"
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </Panel>
          </TabsContent>
  );
}

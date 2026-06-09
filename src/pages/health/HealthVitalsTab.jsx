import { Activity, ChevronRight, Scale } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { TabsContent } from "@/components/ui/tabs";
import { Panel } from "@/components/layout/Panel";
import { getWeightForDate, getWeightHistory } from '../../utils/vitalsDatabase';

export function HealthVitalsTab({ dateKey }) {
  const weightHistory = getWeightHistory(14);
  const recentWeights = getWeightHistory(10);
  const todaysWeight = getWeightForDate(dateKey);

  return (
    <TabsContent value="vitals" className="space-y-6 pt-4 outline-none">
      <div className="grid grid-cols-2 gap-4">
        <Panel className="p-5">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">Today's Weight</p>
          <h3 className="text-2xl font-semibold text-foreground">
            {todaysWeight ? `${todaysWeight} kg` : '--'}
          </h3>
        </Panel>
        <Panel className="p-5">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">7D Trend</p>
          <h3 className="text-2xl font-semibold text-foreground">Stable</h3>
        </Panel>
      </div>

      <Panel className="p-5 md:p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-normal text-foreground">Weight Trend</h3>
            <p className="mt-1 text-[10px] font-semibold text-muted-foreground">Last 14 days</p>
          </div>
          <Activity className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weightHistory}>
              <defs>
                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--app-accent)" stopOpacity={0.16} />
                  <stop offset="95%" stopColor="var(--app-accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--app-border)" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fontWeight: 700, fill: 'var(--app-text-soft)' }}
                tickFormatter={(str) => {
                  const d = new Date(str);
                  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                }}
              />
              <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;

                  return (
                    <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-[10px] font-semibold text-foreground shadow-[var(--app-shadow-md)]">
                      <p>{new Date(payload[0].payload.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      <p className="mt-0.5 text-muted-foreground">{payload[0].value} kg</p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="weight"
                stroke="var(--app-accent)"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorWeight)"
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="space-y-3">
        <h3 className="mb-4 px-2 text-sm font-semibold uppercase tracking-normal text-foreground">Weight History</h3>
        {recentWeights.length === 0 ? (
          <p className="py-8 text-center text-xs font-semibold italic text-muted-foreground">No weight data available.</p>
        ) : (
          recentWeights.map((entry) => (
            <div
              key={`${entry.date}-${entry.weight}`}
              className="flex items-center justify-between rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-[var(--app-shadow-sm)]"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-[var(--app-radius-sm)] bg-[var(--app-surface-muted)] text-muted-foreground">
                  <Scale size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{entry.weight} kg</p>
                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">
                    {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-muted-foreground/40" />
            </div>
          ))
        )}
      </div>
    </TabsContent>
  );
}

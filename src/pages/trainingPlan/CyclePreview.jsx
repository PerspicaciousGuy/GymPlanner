import { Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/layout/Panel";
import { cn } from "@/lib/utils";
import { getDayOfWeek } from '../../utils/dateUtils';
import { getCycleSlotForDate } from '../../utils/trainingPlan';
import { planSectionTitleClass } from './trainingPlanStyles';
export function CyclePreview({ plan }) {
  if (plan.mode !== 'dynamic' || !plan.cycle?.length) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const previewDays = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const info = getCycleSlotForDate(d, plan);
    previewDays.push({
      date: d,
      dayName: getDayOfWeek(d).slice(0, 3),
      dateNum: d.getDate(),
      slot: info?.slot,
      position: info?.position,
      isToday: i === 0,
    });
  }

  return (
    <Panel className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className={planSectionTitleClass}>
          <Calendar size={12} /> 14-Day Preview
        </h3>
        <Badge variant="outline" className="rounded-[var(--app-radius-sm)] border-[var(--app-border)] bg-[var(--app-surface-muted)] px-2 py-0.5 text-[8px] font-semibold uppercase tracking-normal text-muted-foreground">
          {plan.cycle.length}-Day Cycle
        </Badge>
      </div>

      <div className="grid grid-cols-7 gap-1.5 md:gap-2">
        {previewDays.map((day, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className={cn(
              "flex flex-col items-center gap-1 rounded-[var(--app-radius-md)] py-2 transition-colors md:py-3",
              day.isToday
                ? "bg-foreground text-background shadow-[var(--app-shadow-sm)]"
                : day.slot?.type === 'rest'
                ? "bg-[var(--app-surface-muted)] text-muted-foreground"
                : "bg-[var(--app-surface)] border border-[var(--app-border)] text-foreground hover:border-[var(--app-border-strong)]"
            )}
          >
            <span className={cn(
              "text-[8px] font-semibold uppercase tracking-normal",
              day.isToday ? "text-background/70" : "text-muted-foreground/60"
            )}>
              {day.dayName}
            </span>
            <span className={cn(
              "text-sm font-semibold",
              day.isToday ? "text-background" : ""
            )}>
              {day.dateNum}
            </span>
            <span className={cn(
              "max-w-full truncate px-1 text-[7px] font-semibold uppercase tracking-normal",
              day.isToday ? "text-background/70" : day.slot?.type === 'rest' ? "text-muted-foreground/60" : "text-foreground"
            )}>
              {day.slot?.type === 'rest' ? 'REST' : (day.slot?.name || '').slice(0, 6)}
            </span>
          </motion.div>
        ))}
      </div>
    </Panel>
  );
}
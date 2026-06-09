import { Dumbbell } from 'lucide-react';
import { formatDateDisplay } from '../../utils/dateUtils';

const tooltipClass =
  "rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-[var(--app-shadow-sm)]";

const tooltipLabelClass =
  "text-[10px] font-semibold uppercase tracking-normal text-muted-foreground";

export function CustomVolumeTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className={`${tooltipClass} max-w-[220px]`}>
      <p className="mb-1 text-xs font-semibold text-foreground">{data.displayDate}</p>
      <div className="flex items-center gap-2 mb-3">
        <div className="h-2 w-2 rounded-[var(--app-radius-sm)] bg-foreground" />
        <p className="text-sm font-semibold text-foreground">
          {(data.volume / 1000).toFixed(1)} <span className={tooltipLabelClass}>tons</span>
        </p>
      </div>

      {data.exerciseCount > 0 && (
        <div className="pt-3 border-t border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className={`${tooltipLabelClass} flex items-center gap-1`}>
              <Dumbbell size={10} /> MOVEMENTS
            </span>
            <span className="text-xs font-semibold text-foreground">{data.exerciseCount}</span>
          </div>
          {data.muscles && data.muscles.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {data.muscles.map((muscle, index) => (
                <span key={`${muscle}-${index}`} className="rounded-[var(--app-radius-sm)] bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-normal text-foreground/80">
                  {muscle}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CustomExerciseTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[1]?.payload || payload[0]?.payload;

  return (
    <div className={`${tooltipClass} min-w-[180px]`}>
      <p className="mb-3 border-b border-border pb-2 text-xs font-semibold text-foreground">
        {formatDateDisplay(data.date)}
      </p>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className={tooltipLabelClass}>Max Lift</span>
            </div>
            <p className="text-sm font-semibold text-foreground">{data.weight}kg</p>
          </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-[var(--app-radius-sm)] border border-[var(--app-border-strong)] border-dashed" />
              <span className={tooltipLabelClass}>Est. 1RM</span>
            </div>
            <p className="text-sm font-semibold text-primary">{data.est1RM}kg</p>
          </div>

        <div className="pt-2 border-t border-border mt-2">
            <div className="flex items-center justify-between opacity-60">
              <span className="text-[9px] font-semibold uppercase tracking-normal text-muted-foreground">Reps Performed</span>
              <span className="text-xs font-semibold text-foreground">{data.reps}</span>
            </div>
        </div>
      </div>
    </div>
  );
}

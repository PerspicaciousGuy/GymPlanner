import { CheckCircle2 } from 'lucide-react';

export default function WorkoutCompleteBanner({ bothDone, hasPlannedPm, amDone, pmDone }) {
  if (!bothDone) return null;

  return (
    <div className="mb-2 flex items-center gap-3 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-accent-soft)] px-3 py-2.5 md:mb-4 md:px-4 md:py-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background shadow-[var(--app-shadow-sm)]">
        <CheckCircle2 size={16} />
      </div>
      <div>
        <p className="text-[11px] font-semibold text-foreground md:text-xs">Training session finalized!</p>
        <p className="mt-0.5 text-[9px] font-medium uppercase tracking-normal text-muted-foreground md:text-[10px]">
          {!hasPlannedPm
            ? `SESSION ${amDone ? 'COMPLETED' : 'SKIPPED'}`
            : `SESSION 1 ${amDone ? 'COMPLETED' : 'SKIPPED'}  -  SESSION 2 ${pmDone ? 'COMPLETED' : 'SKIPPED'}`
          }
        </p>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronDown, Clock, RefreshCw, Repeat } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import WorkoutSection from '../../components/WorkoutSection';
import { Panel } from '../../components/layout/Panel';
import { formatDateDisplay } from '../../utils/dateUtils';
import { cn } from "@/lib/utils";

const statusBadgeClass = "flex items-center gap-1.5 rounded-[var(--app-radius-sm)] border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-normal";
const contextBadgeClasses = {
  missed: "border-destructive/20 bg-destructive/10 text-destructive",
  upcoming: "border-[var(--app-border)] bg-[var(--app-surface-muted)] text-muted-foreground",
  today: "border-[var(--app-border)] bg-[var(--app-accent-soft)] text-foreground",
  shifted: "border-[var(--app-border-strong)] bg-[var(--app-surface-muted)] text-[var(--app-text-soft)]",
  rest: "border-[var(--app-border)] bg-[var(--app-surface-muted)] text-muted-foreground",
  cycle: "border-[var(--app-border)] bg-[var(--app-accent-soft)] text-foreground",
};

const dayBadgeBaseClass = "flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full border text-center shadow-[var(--app-shadow-sm)] md:h-16 md:w-16";
const dayBadgeStateClasses = {
  missed: "border-destructive/15 bg-destructive/10 text-destructive",
  today: "border-[var(--app-border)] bg-[var(--app-accent-soft)] text-foreground",
  upcoming: "border-[var(--app-border)] bg-[var(--app-surface-muted)] text-foreground",
  default: "border-[var(--app-border)] bg-[var(--app-surface-muted)] text-foreground",
};

export { contextBadgeClasses, statusBadgeClass };

export function AccordionSection({ section, defaultOpen, syncToken, onWorkoutChanged }) {
  const [open, setOpen] = useState(defaultOpen && !section.isFullyComplete);

  useEffect(() => {
    if (defaultOpen && !section.isFullyComplete) {
      setOpen(true);
    }
  }, [defaultOpen, section.isFullyComplete]);

  useEffect(() => {
    if (section.isFullyComplete && open) {
      setOpen(false);
    }
  }, [section.isFullyComplete, open]);

  const badgeEl = section.showContextBadge ? (
    section.isMissed ? (
      <div className={cn(statusBadgeClass, contextBadgeClasses.missed, "animate-pulse")}>
        <AlertCircle size={10} strokeWidth={3} />
        <span>Missed</span>
      </div>
    ) : section.isTomorrow ? (
      <div className={cn(statusBadgeClass, contextBadgeClasses.upcoming)}>
        <Clock size={10} strokeWidth={3} />
        <span>Upcoming</span>
      </div>
    ) : (
      <div className={cn(statusBadgeClass, contextBadgeClasses.today)}>
        <CheckCircle2 size={10} strokeWidth={3} />
        <span>Today</span>
      </div>
    )
  ) : null;

  const shiftedBadge = (section.isShifted || section.isShiftedFrom) ? (
    <div className={cn(statusBadgeClass, contextBadgeClasses.shifted)}>
      <RefreshCw size={10} strokeWidth={3} className="animate-spin-slow" />
      <span>
        {section.isShiftedFrom
          ? (section.shiftedToLabel ? `To ${section.shiftedToLabel}` : 'Shifted Out')
          : (section.shiftedFromLabel ? `From ${section.shiftedFromLabel}` : 'Shifted In')}
      </span>
    </div>
  ) : null;

  const dayBadgeState = section.isMissed ? 'missed' : section.isTomorrow ? 'upcoming' : section.showContextBadge ? 'today' : 'default';
  const dayAbbreviation = section.dayName.slice(0, 3).toUpperCase();
  const dayNumber = section.date.getDate();

  return (
    <Panel
      className={cn(
        "mb-3 overflow-hidden transition-colors group/card",
        open ? "border-[var(--app-border-strong)]" : "bg-[var(--app-surface)]/80"
      )}
      interactive={!open}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center justify-between gap-4 bg-transparent px-4 py-4 text-left transition-colors md:px-5 md:py-4",
          open && "border-b border-[var(--app-border)]"
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
          <div className={cn(dayBadgeBaseClass, dayBadgeStateClasses[dayBadgeState])}>
            <span className="text-[9px] font-semibold uppercase leading-none tracking-normal text-[var(--app-text-soft)]">
              {dayAbbreviation}
            </span>
            <span className="mt-0.5 text-xl font-semibold leading-none tracking-normal text-foreground md:text-2xl">
              {dayNumber}
            </span>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
              <div className="min-w-0">
                <span className="block truncate text-sm font-semibold tracking-normal text-foreground md:text-base">
                  {section.dayName}
                </span>
                <span className="mt-0.5 block text-[10px] font-medium text-muted-foreground md:text-xs">{formatDateDisplay(section.date)}</span>
              </div>

              <div className="flex origin-left scale-95 flex-wrap items-center gap-2 md:scale-100">
                {badgeEl}
                {shiftedBadge}
                {section.cycleInfo && (
                  <div className={cn(
                    statusBadgeClass,
                    section.cycleInfo.slot?.type === 'rest'
                      ? contextBadgeClasses.rest
                      : contextBadgeClasses.cycle
                  )}>
                    <Repeat size={10} strokeWidth={3} />
                    <span>
                      Day {section.cycleInfo.position + 1}/{section.cycleInfo.cycleLength}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {section.muscleGroup && (
              <span className="hidden max-w-[220px] truncate text-[10px] font-semibold text-muted-foreground md:text-[11px] sm:block">
                {section.muscleGroup}
              </span>
            )}
          </div>
        </div>

        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="p-1.5 rounded-[var(--app-radius-sm)] bg-[var(--app-surface-muted)] text-muted-foreground group-hover:text-foreground transition-colors"
        >
          <ChevronDown size={14} strokeWidth={3} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-transparent overflow-hidden"
          >
            <div className="px-3 md:px-4 py-4">
              <WorkoutSection
                date={section.date}
                dayName={section.dayName}
                muscleGroup={section.muscleGroup}
                isMissed={section.isMissed}
                isTomorrow={section.isTomorrow}
                initialData={section.data}
                syncToken={syncToken}
                onWorkoutChanged={onWorkoutChanged}
                hideBadge
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Panel>
  );
}

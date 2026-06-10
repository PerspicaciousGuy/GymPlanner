import { CheckCircle, FastForward } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

export default function WorkoutSessionTabs({
  hasPlannedPm,
  activeSession,
  setActiveSession,
  amDone,
  amSkipped,
  pmDone,
  pmSkipped,
}) {
  if (!hasPlannedPm) return null;

  const tabClass = (session, done, skipped) => {
    const isActive = activeSession === session;
    const isLocked = done || skipped;

    return cn(
      "relative flex shrink-0 items-center gap-2 px-3 py-2 text-[10px] font-semibold uppercase tracking-normal outline-none transition-colors md:px-4 md:text-[11px]",
      isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
      isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
    );
  };

  const renderIndicator = (session) => (
    activeSession === session && (
      <motion.div
        layoutId="activeSessionIndicator"
        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-foreground"
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    )
  );

  return (
    <div className="mb-1 flex items-center gap-1 overflow-x-auto border-b border-[var(--app-border)] md:gap-2 scrollbar-none">
      <button className={tabClass('am', amDone, amSkipped)} onClick={() => setActiveSession('am')}>
        <span>Session 1</span>
        {amDone && <CheckCircle size={10} className="ml-1 text-foreground" />}
        {amSkipped && <FastForward size={10} className="ml-1 text-muted-foreground" />}
        {renderIndicator('am')}
      </button>
      <button className={tabClass('pm', pmDone, pmSkipped)} onClick={() => setActiveSession('pm')}>
        <span>Session 2</span>
        {pmDone && <CheckCircle size={10} className="ml-1 text-foreground" />}
        {pmSkipped && <FastForward size={10} className="ml-1 text-muted-foreground" />}
        {renderIndicator('pm')}
      </button>
    </div>
  );
}

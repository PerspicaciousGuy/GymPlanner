import { Calendar, CheckCircle2, Copy, Repeat, Trash2, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  planDangerIconButtonClass,
  planSoftIconButtonClass,
  planSuccessIconButtonClass,
} from './trainingPlanStyles';
export function SavedPlanCard({ plan, isActive, isSelected, onSelect, onSetActive, onDelete, onDuplicate }) {
  const slotSummary = plan.mode === 'dynamic'
    ? `${plan.cycle.length}-Day Cycle`
    : 'Fixed Week';

  const workoutCount = plan.cycle.filter(s => s.type === 'workout').length;
  const restCount = plan.cycle.filter(s => s.type === 'rest').length;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={cn(
        "relative w-40 shrink-0 cursor-pointer select-none rounded-[var(--app-radius-lg)] border p-3 shadow-[var(--app-shadow-sm)] transition-colors sm:w-44",
        isActive
          ? "border-[var(--app-border-strong)] bg-[var(--app-surface)]"
          : isSelected
          ? "border-[var(--app-border-strong)] bg-[var(--app-accent-soft)]"
          : "border-[var(--app-border)] bg-[var(--app-surface)] hover:border-[var(--app-border-strong)]",
        isSelected && isActive && "bg-[var(--app-accent-soft)]"
      )}
    >
      {/* Plan Name */}
      <h4 className={cn(
        "text-xs font-semibold tracking-normal truncate mt-1 pr-14",
        isSelected ? "text-foreground" : "text-foreground"
      )}>
        {plan.name}
      </h4>

      {/* Meta */}
      <div className="flex items-center gap-1.5 mt-1.5">
        <Badge variant="outline" className={cn(
          "text-[7px] font-semibold uppercase tracking-normal px-1.5 py-0 rounded-md border",
          plan.mode === 'dynamic'
            ? "bg-[var(--app-accent-soft)] text-foreground border-[var(--app-border)]"
            : "bg-[var(--app-surface-muted)] text-muted-foreground border-[var(--app-border)]"
        )}>
          {plan.mode === 'dynamic' ? <Repeat size={8} className="mr-0.5" /> : <Calendar size={8} className="mr-0.5" />}
          {slotSummary}
        </Badge>
      </div>

      {/* Slot breakdown for dynamic */}
      {plan.mode === 'dynamic' && plan.cycle.length > 0 && (
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[9px] font-semibold text-muted-foreground">
            <span className="text-foreground">{workoutCount}</span> train
          </span>
          <span className="text-[9px] font-semibold text-muted-foreground">
            <span className="text-foreground/70">{restCount}</span> rest
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="absolute top-2.5 right-2 flex items-center gap-1 transition-opacity">
        {!isActive && (
          <button
            onClick={(e) => { e.stopPropagation(); onSetActive(); }}
            className={planSuccessIconButtonClass}
            title="Set as active"
          >
            <Zap size={11} strokeWidth={2.5} />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          className={planSoftIconButtonClass}
          title="Duplicate"
        >
          <Copy size={11} strokeWidth={2.5} />
        </button>
        {!isActive && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className={planDangerIconButtonClass}
            title="Delete"
          >
            <Trash2 size={11} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Mode Selector Card ──────────────────────────────────────
export function ModeCard({ icon, title, description, active, onClick }) {
  const Icon = icon;

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "group relative flex w-full flex-col items-start gap-2.5 overflow-hidden rounded-[var(--app-radius-lg)] border p-4 text-left shadow-[var(--app-shadow-sm)] transition-colors",
        active
          ? "border-[var(--app-border-strong)] bg-[var(--app-accent-soft)]"
          : "border-[var(--app-border)] bg-[var(--app-surface)] hover:border-[var(--app-border-strong)]"
      )}
    >
      <div className={cn(
        "flex h-9 w-9 items-center justify-center rounded-[var(--app-radius-md)] transition-colors",
        active
          ? "bg-foreground text-background shadow-[var(--app-shadow-sm)]"
          : "bg-[var(--app-surface-muted)] text-muted-foreground group-hover:bg-[var(--app-surface-raised)]"
      )}>
        <Icon size={18} strokeWidth={2.5} />
      </div>

      <div className="relative z-10">
        <h3 className={cn(
          "font-semibold text-xs uppercase tracking-normal",
          active ? "text-foreground" : "text-foreground"
        )}>{title}</h3>
        <p className={cn(
          "text-[10px] font-medium mt-0.5 leading-tight",
          active ? "text-muted-foreground" : "text-muted-foreground"
        )}>{description}</p>
      </div>

      {active && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 right-3"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-[var(--app-radius-sm)] bg-foreground">
            <CheckCircle2 size={12} className="text-background" />
          </div>
        </motion.div>
      )}
    </motion.button>
  );
}

// ─── Cycle Slot Card ─────────────────────────────────────────

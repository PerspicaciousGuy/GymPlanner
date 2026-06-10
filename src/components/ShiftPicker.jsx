import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  getEffectiveSessionTitle
} from '../utils/storage';
import {
  getDayOfWeek, 
  formatDateKey, 
  formatDateDisplay 
} from '../utils/dateUtils';
import { Calendar, ArrowRight } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function ShiftPicker({ open, onOpenChange, sourceDate, onShift }) {
  const nextDays = React.useMemo(() => {
    const start = new Date(sourceDate);
    const days = [];
    for (let i = 1; i <= 7; i++) {
      const next = new Date(start);
      next.setDate(start.getDate() + i);
      const dateKey = formatDateKey(next);
      const dayName = getDayOfWeek(next);
      
      const amTitle = getEffectiveSessionTitle(next, 'am');
      const pmTitle = getEffectiveSessionTitle(next, 'pm');
      
      const isAmRest = !amTitle || amTitle.toLowerCase() === 'rest' || amTitle.toLowerCase() === 'off';
      const isPmRest = !pmTitle || pmTitle.toLowerCase() === 'rest' || pmTitle.toLowerCase() === 'off';
      
      // Detection for PM session: Only show if it has a specific title or is part of a split
      const hasPmPlanned = pmTitle && !isPmRest;

      days.push({
        date: next,
        dateKey,
        dayName,
        am: { title: amTitle, isRest: isAmRest },
        pm: { title: pmTitle, isRest: isPmRest, hasPlanned: hasPmPlanned }
      });
    }
    return days;
  }, [sourceDate]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[var(--app-radius-lg)] border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-[var(--app-shadow-md)]">
        <DialogHeader>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--app-radius-md)] bg-[var(--app-accent-soft)] text-foreground">
            <Calendar size={24} />
          </div>
          <DialogTitle className="text-xl font-semibold tracking-normal text-foreground">Shift Workout</DialogTitle>
          <DialogDescription className="font-medium text-muted-foreground">
            Where would you like to move this session?
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 max-h-[450px] space-y-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[var(--app-border)]">
          {nextDays.map((day) => (
            <div key={day.dateKey} className="rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex flex-col">
                  <span className="mb-1 text-[10px] font-semibold uppercase leading-none tracking-normal text-foreground">{day.dayName}</span>
                  <span className="text-[11px] font-medium leading-none text-muted-foreground">{formatDateDisplay(day.date)}</span>
                </div>
              </div>
              
              <div className={cn("grid gap-2", day.pm.hasPlanned ? "grid-cols-2" : "grid-cols-1")}>
                <Button
                  variant="ghost"
                  className={cn(
                    "flex h-auto flex-col items-start rounded-[var(--app-radius-md)] border px-4 py-3 transition-colors",
                    day.am.isRest 
                      ? "border-dashed border-emerald-500/20 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15"
                      : "border-[var(--app-border)] bg-[var(--app-surface)] text-foreground shadow-[var(--app-shadow-sm)] hover:bg-[var(--app-surface-raised)]"
                  )}
                  onClick={() => onShift(day.date, 'am')}
                >
                  <div className="mb-1.5 flex w-full items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">
                      {day.pm.hasPlanned ? "AM Session" : "Session"}
                    </span>
                    {day.am.isRest && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                  </div>
                  <span className="w-full truncate text-left text-[12px] font-semibold text-foreground">
                    {day.am.isRest ? "Add to Rest Slot" : (day.am.title || "Untitled")}
                  </span>
                </Button>

                {day.pm.hasPlanned && (
                  <Button
                    variant="ghost"
                    className={cn(
                      "flex h-auto flex-col items-start rounded-[var(--app-radius-md)] border px-4 py-3 transition-colors",
                      day.pm.isRest 
                        ? "border-dashed border-emerald-500/20 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15"
                        : "border-[var(--app-border)] bg-[var(--app-surface)] text-foreground shadow-[var(--app-shadow-sm)] hover:bg-[var(--app-surface-raised)]"
                    )}
                    onClick={() => onShift(day.date, 'pm')}
                  >
                    <div className="mb-1.5 flex w-full items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">PM Session</span>
                      {day.pm.isRest && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      )}
                    </div>
                    <span className="w-full truncate text-left text-[12px] font-semibold text-foreground">
                      {day.pm.isRest ? "Add to Rest Slot" : (day.pm.title || "Untitled")}
                    </span>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="mt-6">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="w-full rounded-[var(--app-radius-md)] text-xs font-semibold uppercase tracking-normal text-muted-foreground hover:bg-[var(--app-surface-muted)] hover:text-foreground"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

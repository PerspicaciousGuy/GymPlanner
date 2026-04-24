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

export default function ShiftPicker({ open, onOpenChange, sourceDate, onShift, plan }) {
  const sourceDateKey = formatDateKey(sourceDate);
  
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
  }, [sourceDateKey, plan]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[2.5rem] p-6 border-slate-100 shadow-2xl">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
            <Calendar size={24} />
          </div>
          <DialogTitle className="text-xl font-black text-slate-800 tracking-tight">Shift Workout</DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            Where would you like to move this session?
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3 max-h-[450px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-100">
          {nextDays.map((day) => (
            <div key={day.dateKey} className="p-4 rounded-[2rem] bg-slate-50 border border-slate-100/50">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest leading-none mb-1">{day.dayName}</span>
                  <span className="text-[11px] font-bold text-slate-400 leading-none">{formatDateDisplay(day.date)}</span>
                </div>
              </div>
              
              <div className={cn("grid gap-2", day.pm.hasPlanned ? "grid-cols-2" : "grid-cols-1")}>
                <Button
                  variant="ghost"
                  className={cn(
                    "flex flex-col items-start h-auto py-3 px-4 rounded-[1.25rem] border transition-all",
                    day.am.isRest 
                      ? "bg-white border-dashed border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300" 
                      : "bg-white border-slate-100 text-slate-700 hover:bg-slate-50 hover:border-indigo-100 shadow-sm"
                  )}
                  onClick={() => onShift(day.date, 'am')}
                >
                  <div className="flex items-center gap-2 mb-1.5 w-full">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      {day.pm.hasPlanned ? "AM Session" : "Session"}
                    </span>
                    {day.am.isRest && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                  </div>
                  <span className="text-[12px] font-black text-slate-800 truncate w-full text-left">
                    {day.am.isRest ? "Add to Rest Slot" : (day.am.title || "Untitled")}
                  </span>
                </Button>

                {day.pm.hasPlanned && (
                  <Button
                    variant="ghost"
                    className={cn(
                      "flex flex-col items-start h-auto py-3 px-4 rounded-[1.25rem] border transition-all",
                      day.pm.isRest 
                        ? "bg-white border-dashed border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300" 
                        : "bg-white border-slate-100 text-slate-700 hover:bg-slate-50 hover:border-indigo-100 shadow-sm"
                    )}
                    onClick={() => onShift(day.date, 'pm')}
                  >
                    <div className="flex items-center gap-2 mb-1.5 w-full">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">PM Session</span>
                      {day.pm.isRest && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      )}
                    </div>
                    <span className="text-[12px] font-black text-slate-800 truncate w-full text-left">
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
            className="w-full rounded-xl text-slate-400 font-bold text-xs uppercase"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

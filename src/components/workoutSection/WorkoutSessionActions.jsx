import { CheckCircle, CheckCircle2, FastForward, RefreshCw, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function WorkoutSessionActions({
  isDirty,
  saveFlash,
  sessionDone,
  sessionSkipped,
  isConfirmingFinish,
  setIsConfirmingFinish,
  setTemplateDialogMode,
  setShowTemplateDialog,
  onComplete,
  onSkip,
  onSave,
}) {
  return (
    <div className="flex items-center justify-between border-t border-[var(--app-border)] pt-4">
      {sessionDone ? (
        <div className="flex items-center gap-2 text-foreground">
          <CheckCircle size={14} />
          <span className="text-[10px] font-semibold uppercase tracking-normal">Session Completed</span>
        </div>
      ) : sessionSkipped ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <FastForward size={14} />
          <span className="text-[10px] font-semibold uppercase tracking-normal">Session Skipped</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap w-full">
          {isConfirmingFinish ? (
            <Button
              onClick={() => {
                onComplete();
                setIsConfirmingFinish(false);
              }}
              className="h-9 gap-2 rounded-[var(--app-radius-md)] bg-foreground px-4 text-[10px] font-semibold uppercase tracking-normal text-background shadow-[var(--app-shadow-sm)] transition-colors hover:bg-foreground/90 animate-in fade-in zoom-in-95 duration-200"
            >
              <CheckCircle2 size={14} /> Confirm Finish
            </Button>
          ) : (
            <Button
              onClick={() => {
                setIsConfirmingFinish(true);
                setTimeout(() => setIsConfirmingFinish(false), 3000);
              }}
              className="h-9 gap-2 rounded-[var(--app-radius-md)] bg-foreground px-4 text-[10px] font-semibold uppercase tracking-normal text-background shadow-[var(--app-shadow-sm)] transition-colors hover:bg-foreground/90"
            >
              <CheckCircle size={14} /> Finish Session
            </Button>
          )}

          <Button
            onClick={() => {
              setTemplateDialogMode('save');
              setShowTemplateDialog(true);
            }}
            variant="outline"
            className="h-9 gap-2 rounded-[var(--app-radius-md)] border-[var(--app-border)] px-4 text-[10px] font-semibold uppercase tracking-normal text-foreground shadow-[var(--app-shadow-sm)] transition-colors hover:bg-[var(--app-surface-muted)]"
          >
            <Sparkles size={14} /> Save as Routine
          </Button>

          <Button
            variant="ghost"
            onClick={onSkip}
            className="h-9 rounded-[var(--app-radius-md)] px-4 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground transition-colors hover:bg-[var(--app-surface-muted)] hover:text-foreground"
          >
            Skip
          </Button>

          <div className="ml-auto flex h-7 items-center gap-2">
            <AnimatePresence mode="wait">
              {isDirty ? (
                <motion.div
                  key="saving"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center gap-2 text-muted-foreground"
                >
                  <RefreshCw size={10} className="animate-spin" />
                  <span className="text-[9px] font-semibold uppercase tracking-normal">Saving...</span>
                </motion.div>
              ) : (
                <motion.div
                  key="saved"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className={cn(
                    "flex items-center gap-1.5 transition-all duration-500",
                    saveFlash ? "text-foreground opacity-100" : "text-muted-foreground opacity-40"
                  )}
                >
                  <CheckCircle2 size={10} />
                  <span className="text-[9px] font-semibold uppercase tracking-normal">
                    {saveFlash ? "Changes Saved" : "Auto-saved"}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              variant="ghost"
              onClick={onSave}
              className="h-7 px-2 text-[8px] font-semibold uppercase tracking-normal text-muted-foreground transition-colors hover:bg-[var(--app-surface-muted)] hover:text-foreground"
            >
              Force Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

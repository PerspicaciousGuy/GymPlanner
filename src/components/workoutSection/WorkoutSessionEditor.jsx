import { ArrowRight, FileText, FolderOpen, Sparkles, Tag } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ShiftPicker from '../ShiftPicker';
import TemplateDialog from '../TemplateDialog';

export default function WorkoutSessionEditor({
  activeSession,
  amTitleRef,
  pmTitleRef,
  amTitleState,
  pmTitleState,
  amNotesState,
  pmNotesState,
  showNotes,
  setShowNotes,
  sessionDone,
  sessionSkipped,
  titleSaveFlash,
  sessionSubtitle,
  showTemplateDialog,
  setShowTemplateDialog,
  templateDialogMode,
  setTemplateDialogMode,
  showShiftPicker,
  setShowShiftPicker,
  sourceDate,
  trainingPlan,
  currentGroups,
  currentStandaloneExercises,
  onTitleChange,
  onNotesChange,
  onTitleSave,
  onApplyTemplate,
  onShift,
}) {
  return (
    <div className="relative flex flex-col gap-2">
      <div className="flex items-center gap-4 group/session">
        <div className="flex-1 relative flex items-center">
          <div className="pointer-events-none absolute left-4 top-4 z-20 text-muted-foreground transition-colors group-focus-within/session:text-foreground">
            <Tag size={14} strokeWidth={2.5} />
          </div>
          <Textarea
            ref={activeSession === 'am' ? amTitleRef : pmTitleRef}
            value={activeSession === 'am' ? amTitleState : pmTitleState}
            onChange={(event) => {
              onTitleChange(activeSession, event.target.value);
              event.target.style.height = 'auto';
              event.target.style.height = `${event.target.scrollHeight}px`;
            }}
            onBlur={onTitleSave}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && event.ctrlKey) {
                event.preventDefault();
                event.currentTarget.blur();
              }
            }}
            placeholder="Designate Training Protocol..."
            className="h-auto min-h-[3rem] w-full resize-none overflow-hidden rounded-[var(--app-radius-lg)] border-[var(--app-border)] bg-[var(--app-surface-muted)] py-3 pl-11 pr-36 text-[13px] font-semibold italic text-foreground shadow-[var(--app-shadow-sm)] transition-colors placeholder:text-muted-foreground focus-visible:border-[var(--app-border-strong)] focus-visible:bg-[var(--app-surface)] focus-visible:ring-0"
          />
          <div className="absolute right-2 top-2 z-20 flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-[var(--app-radius-md)] border text-muted-foreground outline-none transition-colors hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface)] hover:text-foreground",
                showNotes ? "border-[var(--app-border-strong)] bg-[var(--app-accent-soft)] text-foreground shadow-[var(--app-shadow-sm)]" : "border-[var(--app-border)] bg-[var(--app-surface)]/80"
              )}
              onClick={() => setShowNotes(!showNotes)}
              title="Toggle Session Notes"
            >
              <FileText size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)]/80 text-muted-foreground transition-colors hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface)] hover:text-foreground",
                (sessionDone || sessionSkipped) && "hidden"
              )}
              onClick={() => setShowShiftPicker(true)}
              title="Shift Workout"
            >
              <ArrowRight size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)]/80 text-muted-foreground transition-colors hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface)] hover:text-foreground",
                (sessionDone || sessionSkipped) && "hidden"
              )}
              onClick={() => {
                setTemplateDialogMode('load');
                setShowTemplateDialog(true);
              }}
              title="Load Routine"
            >
              <FolderOpen size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)]/80 text-muted-foreground transition-colors hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface)] hover:text-foreground",
                (sessionDone || sessionSkipped) && "hidden"
              )}
              onClick={() => {
                setTemplateDialogMode('save');
                setShowTemplateDialog(true);
              }}
              title="Save Protocol"
            >
              <Sparkles size={16} />
            </Button>
          </div>
        </div>
        {titleSaveFlash && (
          <Badge variant="outline" className="h-6 shrink-0 animate-in border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[9px] font-semibold uppercase tracking-normal text-foreground fade-in zoom-in-95 duration-300">
            Synchronized
          </Badge>
        )}
      </div>

      {sessionSubtitle && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="px-6 py-1 -mt-1">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-foreground" />
            <span className="text-[10px] font-semibold italic text-muted-foreground md:text-xs">
              {sessionSubtitle}
            </span>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {showNotes && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="overflow-hidden"
          >
            <textarea
              value={activeSession === 'am' ? amNotesState : pmNotesState}
              onChange={(event) => onNotesChange(activeSession, event.target.value)}
              onBlur={onTitleSave}
              placeholder="Add session notes, warm-ups, or bodyweight here..."
              className="min-h-[80px] w-full resize-none rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4 text-xs font-medium text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-[var(--app-border-strong)] focus-visible:bg-[var(--app-surface)]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <TemplateDialog
        open={showTemplateDialog}
        onOpenChange={setShowTemplateDialog}
        mode={templateDialogMode}
        currentGroups={currentGroups}
        currentStandaloneExercises={currentStandaloneExercises}
        onSelect={onApplyTemplate}
      />

      <ShiftPicker
        open={showShiftPicker}
        onOpenChange={setShowShiftPicker}
        sourceDate={sourceDate}
        sourceSession={activeSession}
        onShift={onShift}
        plan={trainingPlan}
      />
    </div>
  );
}

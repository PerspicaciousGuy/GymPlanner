import { CheckCircle2, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function DataConsoleFooter({
  activeTab,
  completionSaved,
  exercisePage,
  exerciseSaved,
  exercisesPerPage,
  filteredExerciseRows,
  onSaveExerciseGrid,
  onSaveWorkoutGrid,
  onSetExercisePage,
  totalExercisePages,
  visibleWorkoutRows,
  workoutsSaved,
}) {
  return (
    <>
      <footer className="flex items-center justify-between border-t border-[var(--app-border)] bg-[var(--app-surface-muted)]/60 px-4 py-3">
        <div className="text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">
          {activeTab === 'exerciseDb' ? (
            <>Showing {Math.min(exercisesPerPage, filteredExerciseRows.length)} of {filteredExerciseRows.length} Exercises</>
          ) : activeTab === 'workouts' ? (
            <>Displaying {visibleWorkoutRows.length} training entries</>
          ) : (
            <>Training completion status</>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSetExercisePage(page => Math.max(1, page - 1))}
            disabled={activeTab !== 'exerciseDb' || exercisePage === 1}
            className="rounded-[var(--app-radius-sm)] border border-[var(--app-border)] bg-[var(--app-surface)] p-1.5 text-muted-foreground shadow-[var(--app-shadow-sm)] transition-colors hover:bg-[var(--app-surface-muted)] hover:text-foreground disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-1.5 rounded-[var(--app-radius-sm)] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1 text-[10px] font-semibold text-foreground shadow-[var(--app-shadow-sm)]">
            {activeTab === 'exerciseDb' ? (
              <>
                <span>{exercisePage}</span>
                <span className="text-muted-foreground/40">/</span>
                <span>{totalExercisePages}</span>
              </>
            ) : (
              <span>1</span>
            )}
          </div>
          <button
            onClick={() => onSetExercisePage(page => Math.min(totalExercisePages, page + 1))}
            disabled={activeTab !== 'exerciseDb' || exercisePage === totalExercisePages}
            className="rounded-[var(--app-radius-sm)] border border-[var(--app-border)] bg-[var(--app-surface)] p-1.5 text-muted-foreground shadow-[var(--app-shadow-sm)] transition-colors hover:bg-[var(--app-surface-muted)] hover:text-foreground disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </footer>

      <div className="mt-6 flex items-center gap-4 px-4 pb-6">
        {activeTab === 'workouts' && (
          <Button
            onClick={onSaveWorkoutGrid}
            className="rounded-[var(--app-radius-md)] bg-foreground px-8 font-semibold text-background shadow-[var(--app-shadow-sm)] hover:bg-foreground/90"
          >
            <Save size={16} className="mr-2" />
            Save Workouts
          </Button>
        )}
        {activeTab === 'exerciseDb' && (
          <Button
            onClick={onSaveExerciseGrid}
            className="rounded-[var(--app-radius-md)] bg-foreground px-8 font-semibold text-background shadow-[var(--app-shadow-sm)] hover:bg-foreground/90"
          >
            <Save size={16} className="mr-2" />
            Save Changes
          </Button>
        )}

        {(workoutsSaved || exerciseSaved || completionSaved) && (
          <Badge variant="outline" className="inline-flex items-center gap-1.5 border-emerald-500/20 bg-emerald-500/10 px-3 py-1 font-semibold text-emerald-600">
            <CheckCircle2 size={12} />
            Saved to cloud
          </Badge>
        )}
      </div>
    </>
  );
}

import { Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import AdvancedExerciseCard from '../AdvancedExerciseCard';
import ExerciseGroup from '../ExerciseGroup';

export default function WorkoutExerciseList({
  standaloneExercises,
  groups,
  sourceDate,
  activeSession,
  loggingStyle,
  sessionDone,
  sessionSkipped,
  onAdvancedExerciseChange,
  onDeleteAdvancedExercise,
  onGroupChange,
  onDeleteGroup,
  onAddGroup,
  onAddExercise,
}) {
  return (
    <div className="space-y-4">
      {standaloneExercises.map((exercise, index) => (
        <AdvancedExerciseCard
          key={exercise.id || index}
          index={index}
          exerciseData={exercise}
          workoutDate={sourceDate}
          onChange={(updated) => onAdvancedExerciseChange(index, updated)}
          onDelete={() => onDeleteAdvancedExercise(index)}
        />
      ))}

      {groups.map((group, index) => (
        <ExerciseGroup
          key={index}
          groupIndex={index}
          group={group}
          groupCount={groups.length}
          workoutDate={sourceDate}
          sessionKey={activeSession}
          onChange={(updated) => onGroupChange(index, updated)}
          onDeleteGroup={() => onDeleteGroup(index)}
        />
      ))}

      {!sessionDone && !sessionSkipped && (
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {loggingStyle === 'legacy' && (
            <Button
              variant="ghost"
              onClick={onAddGroup}
              className="group h-10 overflow-hidden rounded-[var(--app-radius-md)] border border-dashed border-[var(--app-border)] p-0 pr-4 text-xs font-semibold text-foreground transition-colors hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface-muted)]"
            >
              <div className="flex h-full w-10 items-center justify-center bg-[var(--app-surface-muted)] transition-colors group-hover:bg-foreground group-hover:text-background">
                <Plus size={14} strokeWidth={3} />
              </div>
              <span className="ml-3">New Exercise Group</span>
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={onAddExercise}
            className="group h-10 overflow-hidden rounded-[var(--app-radius-md)] border border-dashed border-[var(--app-border)] p-0 pr-4 text-xs font-semibold text-foreground transition-colors hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface-muted)]"
          >
            <div className="flex h-full w-10 items-center justify-center bg-[var(--app-surface-muted)] transition-colors group-hover:bg-foreground group-hover:text-background">
              <div className="rounded-[var(--app-radius-sm)] bg-[var(--app-surface)] p-1 transition-colors group-hover:bg-background/15">
                <Plus size={12} strokeWidth={3} />
              </div>
            </div>
            <span className="ml-3">Add Exercise</span>
          </Button>
        </div>
      )}
    </div>
  );
}

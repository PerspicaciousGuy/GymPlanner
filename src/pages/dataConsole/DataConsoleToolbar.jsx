import { Calendar, Filter, Plus, Search, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import WeekPicker from '../../components/WeekPicker';
import { DAYS } from '../../data/exerciseDatabase';
import { compactControlClass } from './dataConsoleStyles';

export function DataConsoleToolbar({
  activeTab,
  onAddExerciseRow,
  onAddWorkoutGridRow,
  onSetSearchQuery,
  onSetSelectedWeek,
  onSetWorkoutFilterDate,
  onSetWorkoutFilterDay,
  onSetWorkoutFilterSession,
  s1Label,
  s2Label,
  searchQuery,
  selectedWeek,
  workoutFilterDate,
  workoutFilterDay,
  workoutFilterSession,
}) {
  return (
    <div className="flex flex-col justify-between gap-3 border-b border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-3 sm:flex-row sm:items-center md:px-4">
      <div className="relative w-full flex-1 sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={14} />
        <Input
          placeholder="Search data..."
          value={searchQuery}
          onChange={(event) => onSetSearchQuery(event.target.value)}
          className="h-9 rounded-[var(--app-radius-md)] border-[var(--app-border)] bg-[var(--app-surface-muted)] pl-9 text-[11px] font-medium transition-colors focus-visible:border-[var(--app-border-strong)] focus-visible:ring-0 md:text-xs"
        />
      </div>

      <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
        {activeTab === 'workouts' && (
          <div className="flex flex-1 items-center gap-2 sm:flex-initial">
            <div
              onClick={(event) => event.currentTarget.querySelector('input').showPicker?.()}
              className="flex cursor-pointer items-center gap-1.5 rounded-[var(--app-radius-sm)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-2 transition-colors hover:border-[var(--app-border-strong)] focus-within:border-[var(--app-border-strong)]"
            >
              <Calendar size={12} className="shrink-0 text-muted-foreground" />
              <input
                type="date"
                value={workoutFilterDate}
                onFocus={(event) => event.target.showPicker?.()}
                onChange={(event) => onSetWorkoutFilterDate(event.target.value)}
                className="h-7 w-24 cursor-pointer bg-transparent py-1.5 text-[10px] font-semibold text-foreground focus:outline-none md:w-28 md:text-xs"
              />
              {workoutFilterDate && (
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onSetWorkoutFilterDate('');
                  }}
                  className="shrink-0 rounded-[var(--app-radius-sm)] p-0.5 text-muted-foreground transition-colors hover:bg-[var(--app-surface)] hover:text-foreground"
                  title="Clear Date"
                >
                  <X size={12} strokeWidth={3} />
                </button>
              )}
            </div>
            <select
              value={workoutFilterDay}
              onChange={(event) => onSetWorkoutFilterDay(event.target.value)}
              className={`${compactControlClass} flex-1 sm:flex-initial`}
            >
              <option value="all">Day</option>
              {DAYS.map((day) => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
            <select
              value={workoutFilterSession}
              onChange={(event) => onSetWorkoutFilterSession(event.target.value)}
              className={`${compactControlClass} flex-1 sm:flex-initial`}
            >
              <option value="all">Ses</option>
              <option value="am">{s1Label}</option>
              <option value="pm">{s2Label}</option>
            </select>
            <button
              onClick={onAddWorkoutGridRow}
              className="shrink-0 rounded-[var(--app-radius-sm)] border border-dashed border-[var(--app-border)] p-1.5 text-muted-foreground transition-colors hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface-muted)] hover:text-foreground"
              title="Add Row"
            >
              <Plus size={16} />
            </button>
          </div>
        )}

        {activeTab === 'completion' && (
          <WeekPicker
            currentWeekStart={selectedWeek}
            onWeekChange={onSetSelectedWeek}
            compact
          />
        )}
        {activeTab === 'exerciseDb' && (
          <button
            onClick={onAddExerciseRow}
            className="flex items-center gap-1.5 rounded-[var(--app-radius-sm)] border border-dashed border-[var(--app-border)] px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface-muted)] hover:text-foreground"
          >
            <Plus size={14} />
            New Exercise
          </button>
        )}
        <button className="flex items-center gap-2 rounded-[var(--app-radius-sm)] border border-[var(--app-border)] px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-[var(--app-surface-muted)] hover:text-foreground">
          <Filter size={14} />
          Filter
        </button>
      </div>
    </div>
  );
}

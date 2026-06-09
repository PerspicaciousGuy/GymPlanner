import { Calendar, Check, Dumbbell, LayoutGrid, List, Pencil, Plus, Repeat, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion, Reorder } from 'framer-motion';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/layout/Panel";
import { createCycleSlot } from '../../utils/trainingPlan';
import { CyclePreview } from './CyclePreview';
import { CycleSlotCard } from './CycleSlotCard';
import { FixedDayRow } from './FixedDayRow';
import { ModeCard } from './PlanCards';
import {
  planSectionTitleClass,
  planSoftIconButtonClass,
  planSuccessIconButtonClass,
} from './trainingPlanStyles';

export function TrainingPlanEditor({
  editingName,
  handleAddRest,
  handleAddWorkout,
  handleDeleteSlot,
  handleNameSave,
  handleSetMode,
  handleUpdateSlot,
  nameInput,
  nameRef,
  plan,
  setEditingName,
  setNameInput,
  templates,
  updatePlan,
}) {
  if (!plan) return null;

  return (<Panel className="space-y-6 p-4 md:p-5">
          {/* Plan Name + Active Status */}
          <div className="flex items-center gap-3">
            {editingName ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  ref={nameRef}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                  className="h-8 flex-1 rounded-[var(--app-radius-sm)] border-[var(--app-border)] bg-[var(--app-surface-muted)] text-sm font-semibold"
                  placeholder="Plan name..."
                />
                <Button
                  variant="ghost" size="icon"
                  onClick={handleNameSave}
                  className={`${planSuccessIconButtonClass} h-7 w-7`}
                >
                  <Check size={12} strokeWidth={3} />
                </Button>
                <Button
                  variant="ghost" size="icon"
                  onClick={() => setEditingName(false)}
                  className={`${planSoftIconButtonClass} h-7 w-7`}
                >
                  <X size={12} strokeWidth={3} />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <h2 className="text-base font-semibold text-foreground tracking-normal truncate">
                  {plan.name}
                </h2>
                <button
                  onClick={() => { setNameInput(plan.name); setEditingName(true); }}
                  className={`${planSoftIconButtonClass} shrink-0`}
                >
                  <Pencil size={10} strokeWidth={3} />
                </button>
              {/* Active state indicated by card border above */}
              </div>
            )}
          </div>

          {/* Mode Selector */}
          <div className="space-y-3">
            <h2 className={`${planSectionTitleClass} px-1`}>
              <Repeat size={11} /> Training Mode
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <ModeCard
                icon={Calendar}
                title="Fixed Week"
                description="Traditional Mon–Sun schedule."
                active={plan.mode === 'fixed'}
                onClick={() => handleSetMode('fixed')}
              />
              <ModeCard
                icon={Repeat}
                title="Dynamic Split"
                description="Rotating N-day cycle that loops forever."
                active={plan.mode === 'dynamic'}
                onClick={() => handleSetMode('dynamic')}
              />
            </div>
          </div>

          {/* Logging Style Selector */}
          <div className="space-y-3">
            <h2 className={`${planSectionTitleClass} px-1`}>
              <Sparkles size={11} /> Logging Experience
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <ModeCard
                icon={List}
                title="Advanced Logging"
                description="Streamlined. Best for individual exercises."
                active={plan.loggingStyle === 'advanced'}
                onClick={() => updatePlan({ loggingStyle: 'advanced' })}
              />
              <ModeCard
                icon={LayoutGrid}
                title="Legacy Groups"
                description="Complex. Support for manual exercise groups."
                active={plan.loggingStyle === 'legacy'}
                onClick={() => updatePlan({ loggingStyle: 'legacy' })}
              />
            </div>
          </div>

          {/* Dynamic Mode: Cycle Builder */}
          <AnimatePresence mode="wait">
            {plan.mode === 'dynamic' && (
              <motion.div
                key="dynamic"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="space-y-6"
              >
                {/* Start Date */}
                <Panel className="p-4 space-y-2">
                  <h3 className={planSectionTitleClass}>
                    <Calendar size={12} /> Cycle Start Date
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    When did your Day 1 begin? The cycle loops from this point.
                  </p>
                  <Input
                    type="date"
                    value={plan.startDate}
                    onChange={(e) => updatePlan({ startDate: e.target.value })}
                    className="h-9 w-40 rounded-[var(--app-radius-sm)] border-[var(--app-border)] bg-[var(--app-surface-muted)] text-xs font-semibold"
                  />
                </Panel>

                {/* Cycle Slots */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className={planSectionTitleClass}>
                      <Dumbbell size={12} /> Cycle Sequence
                    </h3>
                    <Badge variant="outline" className="rounded-[var(--app-radius-sm)] border-[var(--app-border)] bg-[var(--app-surface-muted)] px-2.5 py-1 text-[8px] font-semibold uppercase tracking-normal text-muted-foreground">
                      {plan.cycle.length} Day{plan.cycle.length !== 1 ? 's' : ''} Total
                    </Badge>
                  </div>

                  {plan.cycle.length === 0 ? (
                    <div className="rounded-[var(--app-radius-lg)] border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] py-10 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--app-shadow-sm)]">
                        <Plus size={18} className="text-muted-foreground/40" />
                      </div>
                      <h3 className="text-xs font-semibold text-foreground uppercase tracking-normal">No Days Defined</h3>
                      <p className="text-[10px] text-muted-foreground font-medium mt-1">
                        Add workout or rest days to build your cycle.
                      </p>
                    </div>
                  ) : (
                    <Reorder.Group 
                      axis="y" 
                      values={plan.cycle} 
                      onReorder={(newCycle) => updatePlan({ cycle: newCycle })}
                      className="space-y-2"
                    >
                      {plan.cycle.map((slot, index) => (
                        <CycleSlotCard
                          key={slot.id}
                          slot={slot}
                          index={index}
                          onUpdate={(updates) => handleUpdateSlot(index, updates)}
                          onDelete={() => handleDeleteSlot(index)}
                          templates={templates}
                        />
                      ))}
                    </Reorder.Group>
                  )}

                  {/* Add Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={handleAddWorkout}
                      className="h-10 rounded-[var(--app-radius-md)] border-dashed border-[var(--app-border)] bg-[var(--app-accent-soft)] px-5 text-[9px] font-semibold uppercase tracking-normal text-foreground shadow-[var(--app-shadow-sm)] transition-colors hover:bg-[var(--app-surface-muted)]"
                    >
                      <Plus size={14} className="mr-2" strokeWidth={3} /> Add Workout Day
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleAddRest}
                      className="h-10 rounded-[var(--app-radius-md)] border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] px-5 text-[9px] font-semibold uppercase tracking-normal text-muted-foreground shadow-[var(--app-shadow-sm)] transition-colors hover:bg-[var(--app-surface-raised)]"
                    >
                      <Plus size={14} className="mr-2" strokeWidth={3} /> Add Rest Day
                    </Button>
                  </div>

                  {/* Quick Presets */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-normal self-center mr-1">
                      Quick:
                    </span>
                    {[
                      { label: 'PPL + Rest', slots: [
                        { n: 'Push', t: 'workout' },
                        { n: 'Pull', t: 'workout' },
                        { n: 'Legs', t: 'workout' },
                        { n: 'Rest', t: 'rest' },
                      ]},
                      { label: 'Upper/Lower', slots: [
                        { n: 'Upper', t: 'workout' },
                        { n: 'Lower', t: 'workout' },
                        { n: 'Rest', t: 'rest' },
                      ]},
                      { label: '5-Day Split', slots: [
                        { n: 'Chest', t: 'workout' },
                        { n: 'Back', t: 'workout' },
                        { n: 'Shoulders', t: 'workout' },
                        { n: 'Legs', t: 'workout' },
                        { n: 'Arms', t: 'workout' },
                        { n: 'Rest', t: 'rest' },
                        { n: 'Rest', t: 'rest' },
                      ]},
                    ].map(preset => (
                      <Button
                        key={preset.label}
                        variant="outline"
                        onClick={() => {
                          const newCycle = preset.slots.map(s => createCycleSlot(s.n, s.t));
                          updatePlan({ cycle: newCycle });
                        }}
                        className="h-8 rounded-[var(--app-radius-sm)] border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 text-[8px] font-semibold uppercase tracking-normal text-muted-foreground shadow-[var(--app-shadow-sm)] transition-colors hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface)] hover:text-foreground"
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Calendar Preview */}
                <CyclePreview plan={plan} />

                {/* Cycle Loop Indicator */}
                {plan.cycle.length > 0 && (
                  <div className="flex items-center justify-center gap-3 py-4">
                    <div className="h-px flex-1 bg-[var(--app-border)]" />
                    <div className="flex items-center gap-2 rounded-[var(--app-radius-sm)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-2">
                      <Repeat size={12} className="text-muted-foreground" />
                      <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-normal">
                        Cycle repeats every {plan.cycle.length} days
                      </span>
                    </div>
                    <div className="h-px flex-1 bg-[var(--app-border)]" />
                  </div>
                )}
              </motion.div>
            )}

            {plan.mode === 'fixed' && (
              <motion.div
                key="fixed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="space-y-4"
              >
                <Panel className="p-4 space-y-4">
                  <h3 className={planSectionTitleClass}>
                    <Calendar size={12} /> Weekly Schedule
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    Define titles for each day. These repeat weekly.
                  </p>

                  <div className="space-y-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <FixedDayRow key={day} day={day} plan={plan} updatePlan={updatePlan} />
                    ))}
                  </div>
                </Panel>
              </motion.div>
            )}
          </AnimatePresence>
        </Panel>
  );
}
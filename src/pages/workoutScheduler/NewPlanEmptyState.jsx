import { useState } from 'react';
import { Plus, Repeat } from 'lucide-react';
import { motion } from 'framer-motion';
import { Panel } from '../../components/layout/Panel';
import { QuickStartTemplatePicker } from '../trainingPlan/QuickStartTemplatePicker';

export function NewPlanEmptyState({ onCreatePlan, onUseQuickStart }) {
  const [showTemplates, setShowTemplates] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2"
    >
      <Panel className="overflow-hidden p-0">
        <div className="grid gap-0 md:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-center gap-6 p-6 md:p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-[var(--app-radius-lg)] border border-[var(--app-border)] bg-[var(--app-accent-soft)] text-foreground shadow-[var(--app-shadow-sm)]">
              <Repeat size={28} strokeWidth={1.8} />
            </div>

            <div className="space-y-3">
              <h2 className="max-w-lg text-2xl font-semibold leading-tight tracking-normal text-foreground md:text-3xl">
                Create your training split.
              </h2>
              <p className="max-w-lg text-sm font-medium leading-6 text-muted-foreground">
                Choose a fixed week or rotating cycle, name your days, then this hub becomes your daily workout log.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onCreatePlan}
                className="inline-flex h-11 items-center justify-center rounded-[var(--app-radius-md)] bg-foreground px-5 text-[11px] font-semibold uppercase tracking-normal text-background shadow-[var(--app-shadow-sm)] transition-colors hover:bg-foreground/90"
              >
                <Plus size={15} className="mr-2" strokeWidth={3} />
                Build Training Plan
              </button>
              <button
                type="button"
                onClick={() => setShowTemplates((value) => !value)}
                className="inline-flex h-11 items-center justify-center rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] px-5 text-[11px] font-semibold uppercase tracking-normal text-foreground shadow-[var(--app-shadow-sm)] transition-colors hover:bg-[var(--app-surface-muted)]"
              >
                Use Quick Start
              </button>
            </div>

            {showTemplates && (
              <div className="pt-1">
                <QuickStartTemplatePicker onSelect={onUseQuickStart} />
              </div>
            )}
          </div>

          <div className="border-t border-[var(--app-border)] bg-[var(--app-surface-muted)] p-5 md:border-l md:border-t-0 md:p-6">
            <div className="space-y-3">
              {[
                ['1', 'Choose fixed week or dynamic cycle'],
                ['2', 'Name each training day'],
                ['3', 'Start logging from the Training Hub'],
              ].map(([step, label]) => (
                <div key={step} className="flex items-center gap-3 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] p-3 shadow-[var(--app-shadow-sm)]">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--app-radius-sm)] bg-foreground text-xs font-semibold text-background">
                    {step}
                  </div>
                  <p className="text-xs font-semibold tracking-normal text-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Panel>
    </motion.div>
  );
}

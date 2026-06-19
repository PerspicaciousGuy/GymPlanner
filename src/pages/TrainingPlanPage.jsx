import { useState, useEffect, useRef } from 'react';
import {
  Plus,
  ArrowLeft,
  CheckCircle2,
  Save,
  Zap,
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/layout/Panel";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';
import {
  loadSavedPlans,
  saveTrainingPlan,
  getActivePlanId,
  setActivePlanId,
  deleteSavedPlan,
  createCycleSlot,
  defaultTrainingPlan,
  loadTrainingPlan,
} from '../utils/trainingPlan';
import { loadTemplates, freezeHistoryUnderPlan } from '../utils/storage';

import { SavedPlanCard } from './trainingPlan/PlanCards';
import { QuickStartTemplatePicker } from './trainingPlan/QuickStartTemplatePicker';
import { TrainingPlanEditor } from './trainingPlan/TrainingPlanEditor';
import { createPlanFromQuickStartTemplate } from './trainingPlan/quickStartTemplates';
import {
  planActionButtonClass,
  planPrimaryButtonClass,
  planSectionTitleClass,
  planSuccessButtonClass,
} from './trainingPlan/trainingPlanStyles';

export default function TrainingPlanPage({ onBack, syncKey, initialQuickStartTemplate, onQuickStartTemplateConsumed }) {
  const [savedPlans, setSavedPlans] = useState(() => loadSavedPlans());
  const [activePlanId, setActiveId] = useState(() => getActivePlanId());
  const [selectedPlanId, setSelectedPlanId] = useState(() => getActivePlanId());
  const [plan, setPlan] = useState(null); // The plan currently being edited
  const [templates, setTemplates] = useState(() => loadTemplates());
  const [saveFlash, setSaveFlash] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const nameRef = useRef(null);

  // Load the selected plan into the editor
  useEffect(() => {
    if (!selectedPlanId) {
      setPlan(null);
      return;
    }
    const found = savedPlans.find(p => p.id === selectedPlanId);
    if (found) {
      setPlan({ ...found });
      setHasChanges(false);
    }
  }, [selectedPlanId]);

  // Focus name input when editing
  useEffect(() => {
    if (editingName && nameRef.current) {
      nameRef.current.focus();
      nameRef.current.select();
    }
  }, [editingName]);

  function refreshPlans() {
    const fresh = loadSavedPlans();
    setSavedPlans(fresh);
  }

  // Refresh plans when sync key changes or sync event completes
  useEffect(() => {
    refreshPlans();
    setActiveId(getActivePlanId());
    setTemplates(loadTemplates());
  }, [syncKey]);

  useEffect(() => {
    const handleSync = () => {
      refreshPlans();
      setActiveId(getActivePlanId());
      setTemplates(loadTemplates());
    };
    window.addEventListener('gymplanner_sync_completed', handleSync);
    return () => window.removeEventListener('gymplanner_sync_completed', handleSync);
  }, []);

  const updatePlan = (updates) => {
    setPlan(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleUseQuickStartTemplate = (template) => {
    const templatePlan = createPlanFromQuickStartTemplate(template);
    setSelectedPlanId(null);
    setPlan(templatePlan);
    setHasChanges(true);
    setEditingName(false);
  };

  useEffect(() => {
    if (!initialQuickStartTemplate) return;
    handleUseQuickStartTemplate(initialQuickStartTemplate);
    onQuickStartTemplateConsumed?.();
  }, [initialQuickStartTemplate]);

  const handleSave = () => {
    if (!plan) return;
    const shouldSetActive = savedPlans.length === 0;
    
    // Freeze all current logged/completed past history using the OLD plan before we overwrite it
    freezeHistoryUnderPlan(loadTrainingPlan());

    saveTrainingPlan(plan);
    if (shouldSetActive) {
      setActivePlanId(plan.id);
      setActiveId(plan.id);
    }
    refreshPlans();
    setSelectedPlanId(plan.id);
    setHasChanges(false);
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 2000);
  };

  const handleCreateNew = () => {
    const newPlan = defaultTrainingPlan();
    newPlan.name = `Plan ${savedPlans.length + 1}`;
    saveTrainingPlan(newPlan);

    // If it's the first plan, make it active
    if (savedPlans.length === 0) {
      setActivePlanId(newPlan.id);
      setActiveId(newPlan.id);
    }

    refreshPlans();
    setSelectedPlanId(newPlan.id);
    setPlan({ ...newPlan });
    setHasChanges(false);
  };

  const handleDuplicate = (sourcePlan) => {
    const dup = {
      ...sourcePlan,
      id: crypto.randomUUID(),
      name: `${sourcePlan.name} (Copy)`,
      createdAt: new Date().toISOString(),
      cycle: sourcePlan.cycle.map(s => ({ ...s, id: crypto.randomUUID() })),
    };
    saveTrainingPlan(dup);
    refreshPlans();
    setSelectedPlanId(dup.id);
    setPlan({ ...dup });
    setHasChanges(false);
  };

  const handleDelete = (planId) => {
    if (planId === activePlanId) return; // can't delete the active plan
    deleteSavedPlan(planId);
    refreshPlans();
    if (selectedPlanId === planId) {
      const remaining = loadSavedPlans();
      setSelectedPlanId(remaining[0]?.id || null);
    }
  };

  const handleSetActive = (planId) => {
    setActivePlanId(planId);
    setActiveId(planId);
  };

  const handleAddWorkout = () => {
    const slot = createCycleSlot('Workout', 'workout');
    updatePlan({ cycle: [...plan.cycle, slot] });
  };

  const handleAddRest = () => {
    const slot = createCycleSlot('Rest', 'rest');
    updatePlan({ cycle: [...plan.cycle, slot] });
  };

  const handleUpdateSlot = (index, updates) => {
    const cycle = [...plan.cycle];
    cycle[index] = { ...cycle[index], ...updates };
    updatePlan({ cycle });
  };

  const handleDeleteSlot = (index) => {
    updatePlan({ cycle: plan.cycle.filter((_, i) => i !== index) });
  };

  const handleSetMode = (mode) => {
    updatePlan({ mode });
  };

  const handleNameSave = () => {
    if (nameInput.trim()) {
      updatePlan({ name: nameInput.trim() });
    }
    setEditingName(false);
  };

  const isActive = plan?.id === activePlanId;

  return (
    <PageShell size="narrow" className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <PageHeader
        title="Training Plan"
        meta={(
          <span className="text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
            Schedule builder
          </span>
        )}
        actions={(
          <>
        <Button
          variant="ghost"
          onClick={onBack}
          className={planActionButtonClass}
        >
          <ArrowLeft size={14} className="mr-2" strokeWidth={3} />
          Back
        </Button>

          {plan && (
            <>
              {!isActive && (
                <Button
                  variant="outline"
                  onClick={() => handleSetActive(plan.id)}
                  className={planSuccessButtonClass}
                >
                  <Zap size={11} className="mr-1.5" strokeWidth={3} /> Set Active
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={!hasChanges}
                className={cn(
                  planPrimaryButtonClass,
                  saveFlash
                    ? "bg-foreground text-background"
                    : hasChanges
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : ""
                )}
              >
                {saveFlash ? (
                  <><CheckCircle2 size={12} className="mr-1.5" strokeWidth={3} /> Saved!</>
                ) : (
                  <><Save size={12} className="mr-1.5" strokeWidth={3} /> Save</>
                )}
              </Button>
            </>
          )}
          </>
        )}
      />

      {/* -- Saved Plans Carousel -------------------------------- */}
      <Panel className="space-y-4 p-4 md:p-5">
        <div className="flex items-center justify-between px-1">
          <h2 className={planSectionTitleClass}>
            <Save size={11} /> My Plans
          </h2>
          <Button
            variant="outline"
            onClick={handleCreateNew}
            className="h-8 rounded-[var(--app-radius-md)] border-dashed border-[var(--app-border)] px-3 text-[8px] font-semibold uppercase tracking-normal text-foreground transition-colors hover:bg-[var(--app-surface-muted)]"
          >
            <Plus size={10} className="mr-1.5" strokeWidth={3} /> New Plan
          </Button>
        </div>

        {savedPlans.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-[var(--app-radius-lg)] border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] py-8 text-center"
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--app-shadow-sm)]">
              <Plus size={18} className="text-muted-foreground/40" />
            </div>
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-normal">No Plans Yet</h3>
            <p className="text-[10px] text-muted-foreground font-medium mt-1">
              Create your first training plan to get started.
            </p>
            <div className="mx-auto mt-5 max-w-3xl px-4">
              <QuickStartTemplatePicker onSelect={handleUseQuickStartTemplate} />
            </div>
          </motion.div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            <AnimatePresence mode="popLayout">
              {savedPlans.map(p => (
                <SavedPlanCard
                  key={p.id}
                  plan={p}
                  isActive={p.id === activePlanId}
                  isSelected={p.id === selectedPlanId}
                  onSelect={() => {
                    if (hasChanges && plan) {
                      // Auto-save before switching
                      saveTrainingPlan(plan);
                      refreshPlans();
                    }
                    setSelectedPlanId(p.id);
                    setHasChanges(false);
                  }}
                  onSetActive={() => handleSetActive(p.id)}
                  onDelete={() => handleDelete(p.id)}
                  onDuplicate={() => handleDuplicate(p)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </Panel>

      <TrainingPlanEditor
        editingName={editingName}
        handleAddRest={handleAddRest}
        handleAddWorkout={handleAddWorkout}
        handleDeleteSlot={handleDeleteSlot}
        handleNameSave={handleNameSave}
        handleSetMode={handleSetMode}
        handleUpdateSlot={handleUpdateSlot}
        nameInput={nameInput}
        nameRef={nameRef}
        plan={plan}
        setEditingName={setEditingName}
        setNameInput={setNameInput}
        templates={templates}
        updatePlan={updatePlan}
      />    </PageShell>
  );
}

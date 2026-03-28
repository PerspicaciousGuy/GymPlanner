import { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  GripVertical,
  ArrowLeft,
  Repeat,
  Calendar,
  Moon,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  BedDouble,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  Save,
  Info,
  ArrowRight,
  Sun,
  Zap,
  Copy,
  Pencil,
  X,
  Check,
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';
import {
  loadSavedPlans,
  saveSavedPlans,
  saveTrainingPlan,
  getActivePlanId,
  setActivePlanId,
  deleteSavedPlan,
  createCycleSlot,
  defaultTrainingPlan,
  getCycleSlotForDate,
} from '../utils/trainingPlan';
import { loadTemplates } from '../utils/storage';
import { formatDateKey, formatDateDisplay, getDayOfWeek } from '../utils/dateUtils';

// ─── Saved Plan Card ─────────────────────────────────────────
function SavedPlanCard({ plan, isActive, isSelected, onSelect, onSetActive, onDelete, onDuplicate }) {
  const slotSummary = plan.mode === 'dynamic'
    ? `${plan.cycle.length}-Day Cycle`
    : 'Fixed Week';

  const workoutCount = plan.cycle.filter(s => s.type === 'workout').length;
  const restCount = plan.cycle.filter(s => s.type === 'rest').length;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={cn(
        "relative shrink-0 w-40 sm:w-44 p-3 rounded-[1.2rem] border-2 cursor-pointer transition-all group select-none",
        isActive
          ? "border-emerald-500 bg-white shadow-md shadow-emerald-50"
          : isSelected
          ? "border-indigo-500 bg-indigo-50/60 shadow-md shadow-indigo-100"
          : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm",
        isSelected && isActive && "bg-indigo-50/30"
      )}
    >
      {/* Plan Name */}
      <h4 className={cn(
        "text-xs font-black tracking-tight truncate mt-1",
        isSelected ? "text-indigo-900" : "text-slate-700"
      )}>
        {plan.name}
      </h4>

      {/* Meta */}
      <div className="flex items-center gap-1.5 mt-1.5">
        <Badge variant="outline" className={cn(
          "text-[7px] font-black uppercase tracking-widest px-1.5 py-0 rounded-md border",
          plan.mode === 'dynamic'
            ? "bg-violet-50 text-violet-500 border-violet-200"
            : "bg-slate-50 text-slate-400 border-slate-200"
        )}>
          {plan.mode === 'dynamic' ? <Repeat size={8} className="mr-0.5" /> : <Calendar size={8} className="mr-0.5" />}
          {slotSummary}
        </Badge>
      </div>

      {/* Slot breakdown for dynamic */}
      {plan.mode === 'dynamic' && plan.cycle.length > 0 && (
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[9px] font-bold text-slate-400">
            <span className="text-indigo-500">{workoutCount}</span> train
          </span>
          <span className="text-[9px] font-bold text-slate-400">
            <span className="text-slate-500">{restCount}</span> rest
          </span>
        </div>
      )}

      {/* Hover actions */}
      <div className="absolute top-2.5 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {!isActive && (
          <button
            onClick={(e) => { e.stopPropagation(); onSetActive(); }}
            className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-500 hover:bg-emerald-100 flex items-center justify-center transition-all"
            title="Set as active"
          >
            <Zap size={9} strokeWidth={3} />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          className="h-5 w-5 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 flex items-center justify-center transition-all"
          title="Duplicate"
        >
          <Copy size={9} strokeWidth={3} />
        </button>
        {!isActive && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="h-5 w-5 rounded-full bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center transition-all"
            title="Delete"
          >
            <Trash2 size={9} strokeWidth={3} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Mode Selector Card ──────────────────────────────────────
function ModeCard({ icon: Icon, title, description, active, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-start gap-2.5 p-4 rounded-[1.5rem] border-2 transition-all text-left w-full overflow-hidden group",
        active
          ? "border-indigo-500 bg-indigo-50/80 shadow-lg shadow-indigo-100"
          : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-md"
      )}
    >
      <div className={cn(
        "absolute top-0 right-0 -mr-12 -mt-12 w-32 h-32 rounded-full blur-3xl transition-opacity",
        active ? "bg-indigo-200/40 opacity-100" : "bg-slate-100/50 opacity-0 group-hover:opacity-100"
      )} />

      <div className={cn(
        "h-9 w-9 rounded-xl flex items-center justify-center transition-all",
        active
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
          : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
      )}>
        <Icon size={18} strokeWidth={2.5} />
      </div>

      <div className="relative z-10">
        <h3 className={cn(
          "font-black text-xs uppercase tracking-tight",
          active ? "text-indigo-900" : "text-slate-700"
        )}>{title}</h3>
        <p className={cn(
          "text-[10px] font-medium mt-0.5 leading-tight",
          active ? "text-indigo-600" : "text-slate-400"
        )}>{description}</p>
      </div>

      {active && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 right-3"
        >
          <div className="h-5 w-5 rounded-full bg-indigo-600 flex items-center justify-center">
            <CheckCircle2 size={12} className="text-white" />
          </div>
        </motion.div>
      )}
    </motion.button>
  );
}

// ─── Cycle Slot Card ─────────────────────────────────────────
function CycleSlotCard({ slot, index, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast, templates }) {
  const [expanded, setExpanded] = useState(false);
  const isRest = slot.type === 'rest';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
      transition={{ type: "spring", stiffness: 450, damping: 30 }}
      className={cn(
        "rounded-[1.4rem] border overflow-hidden transition-all group",
        isRest
          ? "bg-slate-50/50 border-slate-100 hover:border-slate-200"
          : "bg-white border-slate-100 hover:border-indigo-200 shadow-sm hover:shadow-md"
      )}
    >
      {/* Main Row */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Drag Handle + Day Number */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-slate-200 cursor-grab active:cursor-grabbing hover:text-slate-400 transition-colors">
            <GripVertical size={14} />
          </div>
          <div className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0",
            isRest
              ? "bg-slate-100 text-slate-400"
              : "bg-indigo-600 text-white shadow-md shadow-indigo-100"
          )}>
            {index + 1}
          </div>
        </div>

        {/* Slot Name */}
        <div className="flex-1 min-w-0">
          <input
            value={slot.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className={cn(
              "bg-transparent border-none outline-none text-sm font-black tracking-tight w-full",
              isRest ? "text-slate-400 italic" : "text-slate-800"
            )}
            placeholder={isRest ? "Rest Day" : "Workout Name..."}
          />
        </div>

        {/* Type Badge */}
        <Badge
          variant="outline"
          className={cn(
            "text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg shrink-0",
            isRest
              ? "bg-slate-50 text-slate-400 border-slate-200"
              : "bg-indigo-50 text-indigo-600 border-indigo-200"
          )}
        >
          {isRest ? (
            <><BedDouble size={10} className="mr-1" /> REST</>
          ) : (
            <><Dumbbell size={10} className="mr-1" /> TRAIN</>
          )}
        </Badge>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {!isFirst && (
            <Button
              variant="ghost" size="icon"
              onClick={onMoveUp}
              className="h-7 w-7 text-slate-400 hover:text-slate-700 hover:bg-slate-100 bg-slate-50/50 rounded-full transition-all"
            >
              <ChevronUp size={12} strokeWidth={2.5} />
            </Button>
          )}
          {!isLast && (
            <Button
              variant="ghost" size="icon"
              onClick={onMoveDown}
              className="h-7 w-7 text-slate-400 hover:text-slate-700 hover:bg-slate-100 bg-slate-50/50 rounded-full transition-all"
            >
              <ChevronDown size={12} strokeWidth={2.5} />
            </Button>
          )}

          {!isRest && (
            <Button
              variant="ghost" size="icon"
              onClick={() => setExpanded(!expanded)}
              className={cn(
                "h-7 w-7 rounded-full transition-all",
                expanded 
                  ? "text-indigo-600 bg-indigo-100 shadow-sm" 
                  : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 bg-slate-50/50"
              )}
            >
              <Info size={12} strokeWidth={2.5} />
            </Button>
          )}

          <Button
            variant="ghost" size="icon"
            onClick={onDelete}
            className="h-7 w-7 text-slate-400 hover:text-rose-500 hover:bg-rose-50 bg-slate-50/50 rounded-full transition-all"
          >
            <Trash2 size={12} strokeWidth={2.5} />
          </Button>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && !isRest && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 border-t border-slate-50 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 pl-1">
                    <Sun size={10} /> AM Session Title
                  </label>
                  <Input
                    value={slot.amTitle || ''}
                    onChange={(e) => onUpdate({ amTitle: e.target.value })}
                    placeholder="e.g., Glutes + Calves · Abs"
                    className="h-9 rounded-xl text-xs font-bold bg-slate-50 border-slate-100 focus-visible:border-indigo-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 pl-1">
                    <Moon size={10} /> PM Session Title
                  </label>
                  <Input
                    value={slot.pmTitle || ''}
                    onChange={(e) => onUpdate({ pmTitle: e.target.value })}
                    placeholder="e.g., Chest + Biceps"
                    className="h-9 rounded-xl text-xs font-bold bg-slate-50 border-slate-100 focus-visible:border-indigo-200"
                  />
                </div>
              </div>

              {templates.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 pl-1">
                    <Sparkles size={10} /> Link Routine Template
                  </label>
                  <select
                    value={slot.templateId || ''}
                    onChange={(e) => onUpdate({ templateId: e.target.value || null })}
                    className="w-full h-9 rounded-xl border border-slate-100 bg-slate-50 text-xs font-bold text-slate-700 px-3 outline-none focus:border-indigo-200 appearance-none cursor-pointer"
                  >
                    <option value="">No template linked</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Calendar Preview ────────────────────────────────────────
function CyclePreview({ plan }) {
  if (plan.mode !== 'dynamic' || !plan.cycle?.length) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const previewDays = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const info = getCycleSlotForDate(d, plan);
    previewDays.push({
      date: d,
      dayName: getDayOfWeek(d).slice(0, 3),
      dateNum: d.getDate(),
      slot: info?.slot,
      position: info?.position,
      isToday: i === 0,
    });
  }

  return (
    <div className="bg-white rounded-[1.5rem] border border-slate-100 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
          <Calendar size={12} /> 14-Day Preview
        </h3>
        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest bg-slate-50 text-slate-500 border-slate-200 px-2 py-0.5 rounded-lg">
          {plan.cycle.length}-Day Cycle
        </Badge>
      </div>

      <div className="grid grid-cols-7 gap-1.5 md:gap-2">
        {previewDays.map((day, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className={cn(
              "flex flex-col items-center gap-1 py-2 md:py-3 rounded-xl transition-all",
              day.isToday
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                : day.slot?.type === 'rest'
                ? "bg-slate-50 text-slate-400"
                : "bg-white border border-slate-100 text-slate-700 hover:border-indigo-200"
            )}
          >
            <span className={cn(
              "text-[8px] font-black uppercase tracking-wider",
              day.isToday ? "text-indigo-100" : "text-slate-300"
            )}>
              {day.dayName}
            </span>
            <span className={cn(
              "text-sm font-black",
              day.isToday ? "text-white" : ""
            )}>
              {day.dateNum}
            </span>
            <span className={cn(
              "text-[7px] font-bold uppercase tracking-wider truncate max-w-full px-1",
              day.isToday ? "text-indigo-200" : day.slot?.type === 'rest' ? "text-slate-300" : "text-indigo-500"
            )}>
              {day.slot?.type === 'rest' ? 'REST' : (day.slot?.name || '').slice(0, 6)}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}


// ─── Main Page ───────────────────────────────────────────────
export default function TrainingPlanPage({ onBack }) {
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

  const refreshPlans = () => {
    const fresh = loadSavedPlans();
    setSavedPlans(fresh);
  };

  const updatePlan = (updates) => {
    setPlan(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!plan) return;
    saveTrainingPlan(plan);
    refreshPlans();
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

  const handleMoveSlot = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= plan.cycle.length) return;
    const cycle = [...plan.cycle];
    const [moved] = cycle.splice(index, 1);
    cycle.splice(newIndex, 0, moved);
    updatePlan({ cycle });
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
    <div className="max-w-2xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="rounded-full h-9 px-4 text-slate-500 hover:text-slate-900 hover:bg-slate-100 bg-slate-50 font-black text-[10px] uppercase tracking-widest transition-all"
        >
          <ArrowLeft size={14} className="mr-2" strokeWidth={3} />
          Back
        </Button>

        <div className="flex items-center gap-2">
          {plan && (
            <>
              {!isActive && (
                <Button
                  variant="outline"
                  onClick={() => handleSetActive(plan.id)}
                  className="h-9 px-4 rounded-full text-emerald-600 hover:bg-emerald-50 border-emerald-200 text-[9px] font-black uppercase tracking-widest shadow-sm transition-all"
                >
                  <Zap size={11} className="mr-1.5" strokeWidth={3} /> Set Active
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={!hasChanges}
                className={cn(
                  "h-9 px-5 rounded-full font-black uppercase text-[9px] tracking-widest transition-all shadow-lg",
                  saveFlash
                    ? "bg-emerald-500 text-white shadow-emerald-100"
                    : hasChanges
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100"
                    : "bg-slate-100 text-slate-400 shadow-none cursor-not-allowed"
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
        </div>
      </div>

      {/* ── Saved Plans Carousel ──────────────────────────────── */}
      <div className="space-y-3 mb-8">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2">
            <Save size={11} /> My Plans
          </h2>
          <Button
            variant="outline"
            onClick={handleCreateNew}
            className="h-7 px-3 rounded-full border-dashed border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-[8px] font-black uppercase tracking-widest transition-all"
          >
            <Plus size={10} className="mr-1.5" strokeWidth={3} /> New Plan
          </Button>
        </div>

        {savedPlans.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-8 text-center bg-slate-50/50 rounded-[1.5rem] border border-dashed border-slate-200"
          >
            <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Plus size={18} className="text-slate-300" />
            </div>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-tight">No Plans Yet</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-1">
              Create your first training plan to get started.
            </p>
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
      </div>

      {/* ── Plan Editor ───────────────────────────────────────── */}
      {plan && (
        <div className="space-y-6">
          {/* Plan Name + Active Status */}
          <div className="flex items-center gap-3">
            {editingName ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  ref={nameRef}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                  className="h-8 rounded-lg text-sm font-black bg-slate-50 border-slate-200 focus-visible:border-indigo-300 flex-1"
                  placeholder="Plan name..."
                />
                <Button
                  variant="ghost" size="icon"
                  onClick={handleNameSave}
                  className="h-7 w-7 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                >
                  <Check size={12} strokeWidth={3} />
                </Button>
                <Button
                  variant="ghost" size="icon"
                  onClick={() => setEditingName(false)}
                  className="h-7 w-7 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100"
                >
                  <X size={12} strokeWidth={3} />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <h2 className="text-base font-black text-slate-800 tracking-tight truncate">
                  {plan.name}
                </h2>
                <button
                  onClick={() => { setNameInput(plan.name); setEditingName(true); }}
                  className="h-6 w-6 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 flex items-center justify-center transition-all shrink-0"
                >
                  <Pencil size={10} strokeWidth={3} />
                </button>
              {/* Active state indicated by card border above */}
              </div>
            )}
          </div>

          {/* Mode Selector */}
          <div className="space-y-3">
            <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2 px-1">
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
                <div className="bg-white rounded-[1.5rem] border border-slate-100 p-4 shadow-sm space-y-2">
                  <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Calendar size={12} /> Cycle Start Date
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    When did your Day 1 begin? The cycle loops from this point.
                  </p>
                  <Input
                    type="date"
                    value={plan.startDate}
                    onChange={(e) => updatePlan({ startDate: e.target.value })}
                    className="h-9 w-40 rounded-xl text-xs font-bold bg-slate-50 border-slate-100 focus-visible:border-indigo-200"
                  />
                </div>

                {/* Cycle Slots */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Dumbbell size={12} /> Cycle Sequence
                    </h3>
                    <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest bg-slate-50 text-slate-500 border-slate-200 px-2.5 py-1 rounded-lg">
                      {plan.cycle.length} Day{plan.cycle.length !== 1 ? 's' : ''} Total
                    </Badge>
                  </div>

                  {plan.cycle.length === 0 ? (
                    <div className="py-10 text-center bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center mx-auto mb-3 shadow-sm">
                        <Plus size={18} className="text-slate-300" />
                      </div>
                      <h3 className="text-xs font-black text-slate-500 uppercase tracking-tight">No Days Defined</h3>
                      <p className="text-[10px] text-slate-400 font-medium mt-1">
                        Add workout or rest days to build your cycle.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <AnimatePresence mode="popLayout">
                        {plan.cycle.map((slot, index) => (
                          <CycleSlotCard
                            key={slot.id}
                            slot={slot}
                            index={index}
                            onUpdate={(updates) => handleUpdateSlot(index, updates)}
                            onDelete={() => handleDeleteSlot(index)}
                            onMoveUp={() => handleMoveSlot(index, -1)}
                            onMoveDown={() => handleMoveSlot(index, 1)}
                            isFirst={index === 0}
                            isLast={index === plan.cycle.length - 1}
                            templates={templates}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Add Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={handleAddWorkout}
                      className="h-10 rounded-full border-dashed border-indigo-200 bg-indigo-50/30 text-indigo-600 hover:bg-indigo-50 text-[9px] font-black uppercase tracking-widest px-5 shadow-sm transition-all"
                    >
                      <Plus size={14} className="mr-2" strokeWidth={3} /> Add Workout Day
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleAddRest}
                      className="h-10 rounded-full border-dashed border-slate-200 bg-slate-50/30 text-slate-500 hover:bg-slate-50 text-[9px] font-black uppercase tracking-widest px-5 shadow-sm transition-all"
                    >
                      <Plus size={14} className="mr-2" strokeWidth={3} /> Add Rest Day
                    </Button>
                  </div>

                  {/* Quick Presets */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest self-center mr-1">
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
                        className="h-8 rounded-full border-slate-100 bg-slate-50 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-white text-[8px] font-black uppercase tracking-widest px-4 shadow-sm transition-all"
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
                    <div className="h-px flex-1 bg-slate-100" />
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-100">
                      <Repeat size={12} className="text-indigo-400" />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Cycle repeats every {plan.cycle.length} days
                      </span>
                    </div>
                    <div className="h-px flex-1 bg-slate-100" />
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
                <div className="bg-white rounded-[1.5rem] border border-slate-100 p-4 shadow-sm space-y-4">
                  <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Calendar size={12} /> Weekly Schedule
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Define titles for each day. These repeat weekly.
                  </p>

                  <div className="space-y-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <div
                        key={day}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-xl bg-slate-50/50 border border-slate-50 hover:border-slate-200 transition-all"
                      >
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest w-20 shrink-0">
                          {day.slice(0, 3)}
                        </span>
                        <div className="flex-1 flex flex-col sm:flex-row gap-2">
                          <div className="flex-1 flex items-center gap-1.5">
                            <Sun size={10} className="text-slate-300 shrink-0" />
                            <Input
                              value={plan.fixedWeek?.am?.[day] || ''}
                              onChange={(e) => {
                                const fw = { ...plan.fixedWeek };
                                fw.am = { ...fw.am, [day]: e.target.value };
                                updatePlan({ fixedWeek: fw });
                              }}
                              placeholder="AM Session..."
                              className="h-8 rounded-lg text-[10px] font-bold bg-white border-slate-100 focus-visible:border-indigo-200 shadow-none"
                            />
                          </div>
                          <div className="flex-1 flex items-center gap-1.5">
                            <Moon size={10} className="text-slate-300 shrink-0" />
                            <Input
                              value={plan.fixedWeek?.pm?.[day] || ''}
                              onChange={(e) => {
                                const fw = { ...plan.fixedWeek };
                                fw.pm = { ...fw.pm, [day]: e.target.value };
                                updatePlan({ fixedWeek: fw });
                              }}
                              placeholder="PM Session..."
                              className="h-8 rounded-lg text-[10px] font-bold bg-white border-slate-100 focus-visible:border-indigo-200 shadow-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

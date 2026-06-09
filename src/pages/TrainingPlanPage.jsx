import { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  GripVertical,
  ArrowLeft,
  Repeat,
  Calendar,
  Moon,
  Dumbbell,
  BedDouble,
  Sparkles,
  CheckCircle2,
  Save,
  Info,
  Sun,
  Zap,
  Copy,
  Pencil,
  X,
  Check,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/layout/Panel";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import {
  loadSavedPlans,
  saveTrainingPlan,
  getActivePlanId,
  setActivePlanId,
  deleteSavedPlan,
  createCycleSlot,
  defaultTrainingPlan,
  getCycleSlotForDate,
  loadTrainingPlan,
} from '../utils/trainingPlan';
import { loadTemplates, freezeHistoryUnderPlan } from '../utils/storage';
import { getDayOfWeek } from '../utils/dateUtils';

const planActionButtonClass =
  "h-10 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground shadow-[var(--app-shadow-sm)] transition-colors hover:bg-[var(--app-surface-muted)] hover:text-foreground";

const planPrimaryButtonClass =
  "h-10 rounded-[var(--app-radius-md)] bg-foreground px-5 text-[10px] font-semibold uppercase tracking-normal text-background shadow-[var(--app-shadow-sm)] transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-100";

const planSuccessButtonClass =
  "h-10 rounded-[var(--app-radius-md)] border border-emerald-200 bg-emerald-50 px-4 text-[10px] font-semibold uppercase tracking-normal text-emerald-700 shadow-[var(--app-shadow-sm)] transition-colors hover:bg-emerald-100";

const planSectionTitleClass =
  "flex items-center gap-2 text-[9px] font-semibold uppercase tracking-normal text-muted-foreground";

const planSoftIconButtonClass =
  "flex h-6 w-6 items-center justify-center rounded-[var(--app-radius-sm)] bg-[var(--app-surface-muted)] text-muted-foreground transition-colors hover:bg-[var(--app-surface-raised)] hover:text-foreground";

const planSuccessIconButtonClass =
  "flex h-6 w-6 items-center justify-center rounded-[var(--app-radius-sm)] bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100";

const planDangerIconButtonClass =
  "flex h-6 w-6 items-center justify-center rounded-[var(--app-radius-sm)] bg-red-500/10 text-red-500 transition-colors hover:bg-red-500/15";

const planFieldLabelClass =
  "flex items-center gap-1.5 text-[8px] font-semibold uppercase tracking-normal text-muted-foreground";

const planSmallLabelClass =
  "text-[7px] font-semibold uppercase tracking-normal text-muted-foreground/60";

const planInlineTextButtonClass =
  "px-2 text-[8px] font-semibold uppercase tracking-normal text-muted-foreground transition-colors hover:text-foreground";

const planDangerTextButtonClass =
  "px-2 text-[7px] font-semibold uppercase tracking-normal text-red-500 transition-colors hover:text-red-600";

const planTextareaClass =
  "h-auto min-h-[2.25rem] w-full resize-none overflow-hidden rounded-[var(--app-radius-sm)] border-[var(--app-border)] bg-[var(--app-surface)] py-2 text-xs font-semibold shadow-none transition-colors focus-visible:border-[var(--app-border-strong)] focus-visible:ring-0";

const planCompactTextareaClass =
  "h-auto min-h-[1.75rem] w-full resize-none overflow-hidden rounded-[var(--app-radius-sm)] border-transparent bg-transparent px-2 py-1 text-[9px] font-medium italic shadow-none transition-colors hover:border-[var(--app-border)] focus-visible:border-[var(--app-border-strong)] focus-visible:ring-0";

const planSelectClass =
  "h-9 w-full cursor-pointer appearance-none rounded-[var(--app-radius-sm)] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 text-xs font-semibold text-foreground outline-none transition-colors focus:border-[var(--app-border-strong)]";

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
        "relative w-40 shrink-0 cursor-pointer select-none rounded-[var(--app-radius-lg)] border p-3 shadow-[var(--app-shadow-sm)] transition-colors sm:w-44",
        isActive
          ? "border-emerald-500 bg-[var(--app-surface)]"
          : isSelected
          ? "border-[var(--app-border-strong)] bg-[var(--app-accent-soft)]"
          : "border-[var(--app-border)] bg-[var(--app-surface)] hover:border-[var(--app-border-strong)]",
        isSelected && isActive && "bg-[var(--app-accent-soft)]"
      )}
    >
      {/* Plan Name */}
      <h4 className={cn(
        "text-xs font-semibold tracking-normal truncate mt-1 pr-14",
        isSelected ? "text-foreground" : "text-foreground"
      )}>
        {plan.name}
      </h4>

      {/* Meta */}
      <div className="flex items-center gap-1.5 mt-1.5">
        <Badge variant="outline" className={cn(
          "text-[7px] font-semibold uppercase tracking-normal px-1.5 py-0 rounded-md border",
          plan.mode === 'dynamic'
            ? "bg-[var(--app-accent-soft)] text-foreground border-[var(--app-border)]"
            : "bg-[var(--app-surface-muted)] text-muted-foreground border-[var(--app-border)]"
        )}>
          {plan.mode === 'dynamic' ? <Repeat size={8} className="mr-0.5" /> : <Calendar size={8} className="mr-0.5" />}
          {slotSummary}
        </Badge>
      </div>

      {/* Slot breakdown for dynamic */}
      {plan.mode === 'dynamic' && plan.cycle.length > 0 && (
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[9px] font-semibold text-muted-foreground">
            <span className="text-foreground">{workoutCount}</span> train
          </span>
          <span className="text-[9px] font-semibold text-muted-foreground">
            <span className="text-foreground/70">{restCount}</span> rest
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="absolute top-2.5 right-2 flex items-center gap-1 transition-opacity">
        {!isActive && (
          <button
            onClick={(e) => { e.stopPropagation(); onSetActive(); }}
            className={planSuccessIconButtonClass}
            title="Set as active"
          >
            <Zap size={11} strokeWidth={2.5} />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          className={planSoftIconButtonClass}
          title="Duplicate"
        >
          <Copy size={11} strokeWidth={2.5} />
        </button>
        {!isActive && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className={planDangerIconButtonClass}
            title="Delete"
          >
            <Trash2 size={11} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Mode Selector Card ──────────────────────────────────────
function ModeCard({ icon, title, description, active, onClick }) {
  const Icon = icon;

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "group relative flex w-full flex-col items-start gap-2.5 overflow-hidden rounded-[var(--app-radius-lg)] border p-4 text-left shadow-[var(--app-shadow-sm)] transition-colors",
        active
          ? "border-[var(--app-border-strong)] bg-[var(--app-accent-soft)]"
          : "border-[var(--app-border)] bg-[var(--app-surface)] hover:border-[var(--app-border-strong)]"
      )}
    >
      <div className={cn(
        "pointer-events-none absolute right-0 top-0 -mr-12 -mt-12 h-32 w-32 rounded-[999px] blur-3xl transition-opacity",
        active ? "bg-[var(--app-accent-soft)] opacity-100" : "bg-[var(--app-surface-muted)] opacity-0 group-hover:opacity-100"
      )} />

      <div className={cn(
        "flex h-9 w-9 items-center justify-center rounded-[var(--app-radius-md)] transition-colors",
        active
          ? "bg-foreground text-background shadow-[var(--app-shadow-sm)]"
          : "bg-[var(--app-surface-muted)] text-muted-foreground group-hover:bg-[var(--app-surface-raised)]"
      )}>
        <Icon size={18} strokeWidth={2.5} />
      </div>

      <div className="relative z-10">
        <h3 className={cn(
          "font-semibold text-xs uppercase tracking-normal",
          active ? "text-foreground" : "text-foreground"
        )}>{title}</h3>
        <p className={cn(
          "text-[10px] font-medium mt-0.5 leading-tight",
          active ? "text-muted-foreground" : "text-muted-foreground"
        )}>{description}</p>
      </div>

      {active && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 right-3"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-[var(--app-radius-sm)] bg-foreground">
            <CheckCircle2 size={12} className="text-background" />
          </div>
        </motion.div>
      )}
    </motion.button>
  );
}

// ─── Cycle Slot Card ─────────────────────────────────────────
function CycleSlotCard({ slot, index, onUpdate, onDelete, templates }) {
  const [expanded, setExpanded] = useState(false);
  const [showPm, setShowPm] = useState(!!slot.pmTitle);
  const [showAmSubtitle, setShowAmSubtitle] = useState(!!slot.amSubtitle);
  const [showPmSubtitle, setShowPmSubtitle] = useState(!!slot.pmSubtitle);
  const isRest = slot.type === 'rest';
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={slot}
      dragListener={false}
      dragControls={controls}
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
      transition={{ type: "spring", stiffness: 450, damping: 30 }}
      className={cn(
        "group overflow-hidden rounded-[var(--app-radius-lg)] border shadow-[var(--app-shadow-sm)] transition-colors",
        isRest
          ? "bg-[var(--app-surface-muted)] border-[var(--app-border)] hover:border-[var(--app-border-strong)]"
          : "bg-[var(--app-surface)] border-[var(--app-border)] hover:border-[var(--app-border-strong)]"
      )}
    >
      {/* Main Row */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Drag Handle + Day Number */}
        <div className="flex items-center gap-2 shrink-0">
          <div 
            onPointerDown={(e) => controls.start(e)}
            style={{ touchAction: 'none' }}
            className="text-muted-foreground/40 cursor-grab active:cursor-grabbing hover:text-muted-foreground transition-colors p-2 -ml-2"
          >
            <GripVertical size={16} />
          </div>
          <div className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--app-radius-sm)] text-[10px] font-semibold",
            isRest
              ? "bg-[var(--app-surface)] text-muted-foreground"
              : "bg-foreground text-background shadow-[var(--app-shadow-sm)]"
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
              "w-full border-none bg-transparent text-sm font-semibold tracking-normal outline-none",
              isRest ? "text-muted-foreground italic" : "text-foreground"
            )}
            placeholder={isRest ? "Rest Day" : "Workout Name..."}
          />
        </div>

        {/* Type Badge */}
        <Badge
          variant="outline"
          className={cn(
            "shrink-0 rounded-[var(--app-radius-sm)] px-2.5 py-1 text-[8px] font-semibold uppercase tracking-normal",
            isRest
              ? "bg-[var(--app-surface-muted)] text-muted-foreground border-[var(--app-border)]"
              : "bg-[var(--app-accent-soft)] text-foreground border-[var(--app-border)]"
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
          {!isRest && (
            <Button
              variant="ghost" size="icon"
              onClick={() => setExpanded(!expanded)}
              className={cn(
                "h-7 w-7 rounded-[var(--app-radius-sm)] transition-colors",
                expanded 
                  ? "bg-[var(--app-accent-soft)] text-foreground"
                  : "bg-[var(--app-surface-muted)] text-muted-foreground hover:bg-[var(--app-surface-raised)] hover:text-foreground"
              )}
            >
              <Info size={12} strokeWidth={2.5} />
            </Button>
          )}

          <Button
            variant="ghost" size="icon"
            onClick={onDelete}
            className="h-7 w-7 rounded-[var(--app-radius-sm)] bg-red-500/10 text-red-500 transition-colors hover:bg-red-500/15"
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
            <div className="space-y-3 border-t border-[var(--app-border)] px-3 pb-3 pt-3">
              <div className={cn("grid gap-3", !showPm ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2")}>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between pl-1">
                    <label className={planFieldLabelClass}>
                      <Sun size={10} /> Session 1
                    </label>
                    <div className="flex items-center gap-2">
                      {!showAmSubtitle && (
                        <button 
                          onClick={() => setShowAmSubtitle(true)}
                          className={planInlineTextButtonClass}
                        >
                          + Subtitle
                        </button>
                      )}
                      {!showPm && (
                        <button 
                          onClick={() => setShowPm(true)}
                          className={planInlineTextButtonClass}
                        >
                          + Add Session 2
                        </button>
                      )}
                    </div>
                  </div>
                  <Textarea
                    value={slot.amTitle || ''}
                    onChange={(e) => {
                      onUpdate({ amTitle: e.target.value });
                      e.target.style.height = 'auto';
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    placeholder="Session 1 Title..."
                    rows={1}
                    className={planTextareaClass}
                  />
                  <AnimatePresence>
                    {showAmSubtitle && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-1 overflow-hidden"
                      >
                        <div className="flex items-center justify-between pl-1 mt-1">
                          <label className={planSmallLabelClass}>Subtitle</label>
                          <button 
                            onClick={() => {
                              setShowAmSubtitle(false);
                              onUpdate({ amSubtitle: '' });
                            }}
                            className={planDangerTextButtonClass}
                          >
                            Remove
                          </button>
                        </div>
                        <Textarea
                          value={slot.amSubtitle || ''}
                          onChange={(e) => {
                            onUpdate({ amSubtitle: e.target.value });
                            e.target.style.height = 'auto';
                            e.target.style.height = `${e.target.scrollHeight}px`;
                          }}
                          placeholder="e.g. Glutes / Abs"
                          rows={1}
                          className={planCompactTextareaClass}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {showPm && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between pl-1">
                      <label className={planFieldLabelClass}>
                        <Moon size={10} /> Session 2
                      </label>
                      <div className="flex items-center gap-2">
                        {!showPmSubtitle && (
                          <button 
                            onClick={() => setShowPmSubtitle(true)}
                            className={planInlineTextButtonClass}
                          >
                            + Subtitle
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            setShowPm(false);
                            onUpdate({ pmTitle: '', pmSubtitle: '' });
                          }}
                          className={planDangerTextButtonClass}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <Textarea
                      value={slot.pmTitle || ''}
                      onChange={(e) => {
                        onUpdate({ pmTitle: e.target.value });
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      placeholder="Session 2 Title..."
                      rows={1}
                      className={planTextareaClass}
                    />
                    <AnimatePresence>
                      {showPmSubtitle && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-1 overflow-hidden"
                        >
                          <div className="flex items-center justify-between pl-1 mt-1">
                            <label className={planSmallLabelClass}>Subtitle</label>
                            <button 
                              onClick={() => {
                                setShowPmSubtitle(false);
                                onUpdate({ pmSubtitle: '' });
                              }}
                              className={planDangerTextButtonClass}
                            >
                              Remove
                            </button>
                          </div>
                          <Textarea
                            value={slot.pmSubtitle || ''}
                            onChange={(e) => {
                              onUpdate({ pmSubtitle: e.target.value });
                              e.target.style.height = 'auto';
                              e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                            placeholder="e.g. Upper Focus"
                            rows={1}
                            className={planCompactTextareaClass}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {templates.length > 0 && (
                <div className="space-y-1.5">
                  <label className={`${planFieldLabelClass} pl-1`}>
                    <Sparkles size={10} /> Link Routine Template
                  </label>
                  <select
                    value={slot.templateId || ''}
                    onChange={(e) => onUpdate({ templateId: e.target.value || null })}
                    className={planSelectClass}
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
    </Reorder.Item>
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
    <Panel className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className={planSectionTitleClass}>
          <Calendar size={12} /> 14-Day Preview
        </h3>
        <Badge variant="outline" className="rounded-[var(--app-radius-sm)] border-[var(--app-border)] bg-[var(--app-surface-muted)] px-2 py-0.5 text-[8px] font-semibold uppercase tracking-normal text-muted-foreground">
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
              "flex flex-col items-center gap-1 rounded-[var(--app-radius-md)] py-2 transition-colors md:py-3",
              day.isToday
                ? "bg-foreground text-background shadow-[var(--app-shadow-sm)]"
                : day.slot?.type === 'rest'
                ? "bg-[var(--app-surface-muted)] text-muted-foreground"
                : "bg-[var(--app-surface)] border border-[var(--app-border)] text-foreground hover:border-[var(--app-border-strong)]"
            )}
          >
            <span className={cn(
              "text-[8px] font-semibold uppercase tracking-normal",
              day.isToday ? "text-background/70" : "text-muted-foreground/60"
            )}>
              {day.dayName}
            </span>
            <span className={cn(
              "text-sm font-semibold",
              day.isToday ? "text-background" : ""
            )}>
              {day.dateNum}
            </span>
            <span className={cn(
              "max-w-full truncate px-1 text-[7px] font-semibold uppercase tracking-normal",
              day.isToday ? "text-background/70" : day.slot?.type === 'rest' ? "text-muted-foreground/60" : "text-foreground"
            )}>
              {day.slot?.type === 'rest' ? 'REST' : (day.slot?.name || '').slice(0, 6)}
            </span>
          </motion.div>
        ))}
      </div>
    </Panel>
  );
}

function FixedDayRow({ day, plan, updatePlan }) {
  const hasPm = plan.fixedWeek?.pm && day in plan.fixedWeek.pm && plan.fixedWeek.pm[day] !== undefined;
  const hasAmSubtitle = !!plan.fixedWeek?.amSubtitles?.[day];
  const hasPmSubtitle = !!plan.fixedWeek?.pmSubtitles?.[day];

  return (
    <div className="flex flex-col gap-2 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 transition-colors hover:border-[var(--app-border-strong)]">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-normal w-16 shrink-0">
          {day.slice(0, 3)}
        </span>
        <div className="flex-1 flex items-center gap-1.5">
          <Sun size={10} className="text-muted-foreground/50 shrink-0" />
            <Textarea
              value={plan.fixedWeek?.am?.[day] || ''}
              onChange={(e) => {
                const fw = { ...plan.fixedWeek };
                fw.am = { ...fw.am, [day]: e.target.value };
                updatePlan({ fixedWeek: fw });
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              placeholder="Session 1 Title..."
              rows={1}
              className={`${planTextareaClass} min-h-[2rem] py-1.5 text-[10px]`}
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!hasAmSubtitle && (
              <button 
                onClick={() => {
                  const fw = { ...plan.fixedWeek };
                  fw.amSubtitles = { ...fw.amSubtitles, [day]: ' ' };
                  updatePlan({ fixedWeek: fw });
                }}
                className={planInlineTextButtonClass}
              >
                + Subtitle
              </button>
            )}
             {!hasPm && (
              <Button
                variant="ghost"
                onClick={() => {
                  const fw = { ...plan.fixedWeek };
                  fw.pm = { ...fw.pm, [day]: '' };
                  updatePlan({ fixedWeek: fw });
                }}
                className="h-8 shrink-0 rounded-[var(--app-radius-sm)] bg-[var(--app-surface)] px-2 text-[8px] font-semibold uppercase tracking-normal text-foreground shadow-[var(--app-shadow-sm)] transition-colors hover:bg-[var(--app-surface-raised)]"
              >
                + Add Session 2
              </Button>
            )}
          </div>
        </div>
        <AnimatePresence>
          {hasAmSubtitle && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex items-center gap-2 pl-20 -mt-1 overflow-hidden"
            >
              <div className="flex-1">
                <Textarea
                  value={plan.fixedWeek?.amSubtitles?.[day]?.trim() || ''}
                  onChange={(e) => {
                    const fw = { ...plan.fixedWeek };
                    fw.amSubtitles = { ...fw.amSubtitles, [day]: e.target.value };
                    updatePlan({ fixedWeek: fw });
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  placeholder="e.g. Glutes / Abs"
                  rows={1}
                  className={`${planCompactTextareaClass} min-h-[1.5rem] text-[8px]`}
                />
              </div>
              <button 
                onClick={() => {
                  const fw = { ...plan.fixedWeek };
                  const sub = { ...fw.amSubtitles };
                  delete sub[day];
                  fw.amSubtitles = sub;
                  updatePlan({ fixedWeek: fw });
                }}
                className={planDangerTextButtonClass}
              >
                Remove
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      {hasPm && (
        <>
          <div className="flex items-center gap-2">
            <div className="w-16 shrink-0"></div>
            <div className="flex-1 flex items-center gap-1.5">
              <Moon size={10} className="shrink-0 text-muted-foreground/50" />
                  <Textarea
                    value={plan.fixedWeek?.pm?.[day] || ''}
                    onChange={(e) => {
                      const fw = { ...plan.fixedWeek };
                      fw.pm = { ...fw.pm, [day]: e.target.value };
                      updatePlan({ fixedWeek: fw });
                      e.target.style.height = 'auto';
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    placeholder="Session 2 Title..."
                    rows={1}
                    className={`${planTextareaClass} min-h-[2rem] py-1.5 text-[10px]`}
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!hasPmSubtitle && (
                    <button 
                      onClick={() => {
                        const fw = { ...plan.fixedWeek };
                        fw.pmSubtitles = { ...fw.pmSubtitles, [day]: ' ' };
                        updatePlan({ fixedWeek: fw });
                      }}
                      className={planInlineTextButtonClass}
                    >
                      + Subtitle
                    </button>
                  )}
                  <Button
                    variant="ghost"
                    onClick={() => {
                      const fw = { ...plan.fixedWeek };
                      const pm = { ...fw.pm };
                      delete pm[day];
                      fw.pm = pm;
                      updatePlan({ fixedWeek: fw });
                    }}
                    className="h-8 shrink-0 rounded-[var(--app-radius-sm)] border border-transparent px-2.5 text-[8px] font-semibold uppercase tracking-normal text-red-500 transition-colors hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-600"
                  >
                    Remove
                  </Button>
                </div>
              </div>
              <AnimatePresence>
                {hasPmSubtitle && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex items-center gap-2 pl-20 -mt-1 overflow-hidden"
                  >
                    <div className="flex-1">
                      <Textarea
                        value={plan.fixedWeek?.pmSubtitles?.[day]?.trim() || ''}
                        onChange={(e) => {
                          const fw = { ...plan.fixedWeek };
                          fw.pmSubtitles = { ...fw.pmSubtitles, [day]: e.target.value };
                          updatePlan({ fixedWeek: fw });
                          e.target.style.height = 'auto';
                          e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                        placeholder="e.g. Upper Focus"
                        rows={1}
                        className={`${planCompactTextareaClass} min-h-[1.5rem] text-[8px]`}
                      />
                    </div>
                    <button 
                      onClick={() => {
                        const fw = { ...plan.fixedWeek };
                        const sub = { ...fw.pmSubtitles };
                        delete sub[day];
                        fw.pmSubtitles = sub;
                        updatePlan({ fixedWeek: fw });
                      }}
                      className={planDangerTextButtonClass}
                    >
                      Remove
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
        </>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function TrainingPlanPage({ onBack, syncKey }) {
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

  const handleSave = () => {
    if (!plan) return;
    
    // Freeze all current logged/completed past history using the OLD plan before we overwrite it
    freezeHistoryUnderPlan(loadTrainingPlan());

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
                    ? "bg-emerald-600 text-white"
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

      {/* ── Saved Plans Carousel ──────────────────────────────── */}
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

      {/* ── Plan Editor ───────────────────────────────────────── */}
      {plan && (
        <Panel className="space-y-6 p-4 md:p-5">
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
      )}
    </PageShell>
  );
}

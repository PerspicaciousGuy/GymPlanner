import { useState } from 'react';
import { BedDouble, Dumbbell, GripVertical, Info, Moon, Sparkles, Sun, Trash2 } from 'lucide-react';
import { AnimatePresence, motion, Reorder, useDragControls } from 'framer-motion';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  planCompactTextareaClass,
  planDangerTextButtonClass,
  planFieldLabelClass,
  planInlineTextButtonClass,
  planSelectClass,
  planSmallLabelClass,
  planTextareaClass,
} from './trainingPlanStyles';
export function CycleSlotCard({ slot, index, onUpdate, onDelete, templates }) {
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
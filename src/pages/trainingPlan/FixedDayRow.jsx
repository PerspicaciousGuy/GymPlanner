import { Moon, Sun } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  planCompactTextareaClass,
  planDangerTextButtonClass,
  planInlineTextButtonClass,
  planTextareaClass,
} from './trainingPlanStyles';
export function FixedDayRow({ day, plan, updatePlan }) {
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
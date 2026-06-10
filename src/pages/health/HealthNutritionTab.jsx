import {
  Activity,
  Cookie,
  Droplet,
  Drumstick,
  Flame,
  Footprints,
  GlassWater,
  Leaf,
  Minus,
  Plus,
  Settings,
  Trash2,
  Utensils,
  Zap
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/layout/Panel";
import { cn } from "@/lib/utils";
import { getFoodLog, removeFoodFromLog } from '../../utils/foodDatabase';
import { logWater } from '../../utils/vitalsDatabase';

const ringTrackClass = "stroke-[var(--app-surface-muted)] fill-none";
const iconTone = "text-foreground/70";

function ProgressRing({ value, goal, icon: Icon, strokeClass = "stroke-foreground", sizeClass = "h-14 w-14", strokeWidth = 12 }) {
  const progress = goal > 0 ? Math.min(value / goal, 1) : 0;
  const radius = strokeWidth === 8 ? 38 : 40;
  const circumference = strokeWidth === 8 ? 239 : 251;

  return (
    <div className={cn("relative", sizeClass)}>
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} className={ringTrackClass} strokeWidth={strokeWidth} />
        <circle
          cx="50"
          cy="50"
          r={radius}
          className={cn("fill-none transition-all duration-1000 ease-out", strokeClass)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (circumference * progress)}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon className={cn("h-4 w-4", iconTone)} />
      </div>
    </div>
  );
}

function MacroMetricCard({ metric, showGoals }) {
  return (
    <Panel className="h-full">
      <div className="flex h-full flex-col p-3 md:p-6">
        <div className="mb-4">
          <p className="truncate text-xs font-semibold text-foreground">
            {metric.eaten}
            {showGoals && (
              <span className="whitespace-nowrap text-[10px] font-semibold text-muted-foreground">
                {' '}/ {metric.goal}{metric.unit || 'g'}
              </span>
            )}
          </p>
          <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-normal text-muted-foreground">
            {metric.label} eaten
          </p>
        </div>
        <div className="mt-auto flex justify-center">
          <ProgressRing value={metric.eaten} goal={metric.goal} icon={metric.icon} />
        </div>
      </div>
    </Panel>
  );
}

export function HealthNutritionTab({
  currentSlide,
  dateKey,
  eaten,
  goals,
  onSetCurrentSlide,
  onSetHealthSubView,
  onSetLogVersion,
  onSetSelectedFood,
  showGoals,
  waterIntake
}) {
  const macroMetrics = [
    { label: 'Protein', eaten: eaten.protein, goal: goals.protein, icon: Drumstick },
    { label: 'Carbs', eaten: eaten.carbs, goal: goals.carbs, icon: Zap },
    { label: 'Fats', eaten: eaten.fats, goal: goals.fats, icon: Droplet },
  ];

  const microMetrics = [
    { label: 'Fiber', eaten: eaten.fiber || 0, goal: goals.fiber || 38, icon: Leaf },
    { label: 'Sugar', eaten: eaten.sugar || 0, goal: goals.sugar || 84, icon: Cookie },
    { label: 'Sodium', eaten: eaten.sodium || 0, goal: goals.sodium || 2300, icon: Activity, unit: 'mg' },
  ];

  const loggedFood = getFoodLog(dateKey);

  return (
    <TabsContent value="nutrition" className="relative space-y-4 overflow-hidden outline-none">
      <div className="relative isolate">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="space-y-4"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -50 && currentSlide < 2) onSetCurrentSlide(currentSlide + 1);
              if (info.offset.x > 50 && currentSlide > 0) onSetCurrentSlide(currentSlide - 1);
            }}
          >
            {currentSlide === 0 && (
              <div className="space-y-4">
                <Panel className="overflow-hidden">
                  <div className="flex items-center justify-between p-4 md:p-6">
                    <div>
                      <h2 className="text-3xl font-semibold tracking-normal text-foreground md:text-4xl">
                        {eaten.calories}
                        {showGoals && (
                          <span className="text-lg font-semibold text-muted-foreground md:text-xl">
                            {' '}/ {goals.calories}
                          </span>
                        )}
                      </h2>
                      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground md:text-xs">
                        Calories eaten
                      </p>
                    </div>
                    <ProgressRing
                      value={eaten.calories}
                      goal={goals.calories}
                      icon={Flame}
                      sizeClass="h-20 w-20 md:h-24 md:w-24"
                    />
                  </div>
                </Panel>
                <div className="grid grid-cols-3 gap-3">
                  {macroMetrics.map((metric) => (
                    <MacroMetricCard key={metric.label} metric={metric} showGoals={showGoals} />
                  ))}
                </div>
              </div>
            )}

            {currentSlide === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {microMetrics.map((metric) => (
                    <MacroMetricCard key={metric.label} metric={metric} showGoals />
                  ))}
                </div>
                <Panel className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-normal text-foreground">Health Score</h3>
                    <span className="text-lg font-semibold text-foreground">
                      0<span className="text-xs text-muted-foreground"> / 10</span>
                    </span>
                  </div>
                  <div className="mb-6 h-1.5 w-full overflow-hidden rounded-[var(--app-radius-sm)] bg-[var(--app-surface-muted)]">
                    <div className="h-full w-[10%] rounded-[var(--app-radius-sm)] bg-foreground" />
                  </div>
                  <p className="text-xs font-medium leading-relaxed text-muted-foreground">
                    Carbs and fats are on track. You're low on calories and protein, which can slow weight loss and impact muscle retention.
                  </p>
                </Panel>
              </div>
            )}

            {currentSlide === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Panel className="flex h-60 flex-col overflow-hidden p-4 md:p-5">
                    <div className="text-left">
                      <p className="text-2xl font-semibold text-foreground md:text-3xl">
                        107<span className="text-sm font-semibold text-muted-foreground md:text-base"> / 10000</span>
                      </p>
                      <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground md:text-xs">Steps Today</p>
                    </div>
                    <div className="mt-auto flex flex-col items-center justify-center pb-1">
                      <ProgressRing
                        value={107}
                        goal={10000}
                        icon={Footprints}
                        sizeClass="h-32 w-32 md:h-36 md:w-36"
                        strokeWidth={8}
                      />
                    </div>
                  </Panel>

                  <Panel className="flex h-60 flex-col overflow-hidden p-4 md:p-5">
                    <div className="flex items-center gap-1.5">
                      <Flame className="h-5 w-5 text-foreground" />
                      <p className="text-2xl font-semibold text-foreground md:text-3xl">2</p>
                    </div>
                    <p className="mt-0.5 text-left text-[11px] font-semibold text-muted-foreground md:text-xs">Calories burned</p>

                    <div className="mt-4 flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--app-radius-sm)] bg-foreground text-background">
                        <Footprints className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </div>
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="text-[11px] font-semibold leading-none text-foreground">Steps</span>
                        <span className="mt-0.5 rounded-[var(--app-radius-sm)] bg-[var(--app-surface-muted)] px-2 py-0.5 text-[10px] font-semibold leading-none text-muted-foreground">
                          +2
                        </span>
                      </div>
                    </div>
                  </Panel>
                </div>

                <Panel className="flex w-full items-center justify-between gap-3 p-4 md:p-5">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--app-radius-md)] bg-[var(--app-surface-muted)]">
                      <GlassWater className="h-6 w-6 text-foreground/70" strokeWidth={1.5} />
                    </div>
                    <div className="flex min-w-0 flex-col items-start">
                      <p className="mb-1 text-[13px] font-semibold text-foreground md:text-sm">Water</p>
                      <div className="flex items-center gap-1.5">
                        <p className="text-base font-semibold leading-none text-foreground">{waterIntake} ml</p>
                        <Settings className="h-4 w-4 text-muted-foreground/60 transition-colors hover:text-muted-foreground" strokeWidth={2} />
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => {
                        logWater(dateKey, -250);
                        onSetLogVersion(version => version + 1);
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-[var(--app-radius-md)] border border-[var(--app-border)] text-foreground transition-colors hover:bg-[var(--app-surface-muted)]"
                    >
                      <Minus size={18} strokeWidth={2} />
                    </button>
                    <button
                      onClick={() => {
                        logWater(dateKey, 250);
                        onSetLogVersion(version => version + 1);
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-[var(--app-radius-md)] bg-foreground text-background transition-colors hover:bg-foreground/90"
                    >
                      <Plus size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </Panel>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-center gap-1.5 py-2">
        {[0, 1, 2].map((slideIndex) => (
          <button
            key={slideIndex}
            onClick={() => onSetCurrentSlide(slideIndex)}
            className={cn(
              "h-1.5 rounded-[var(--app-radius-sm)] transition-all duration-300",
              currentSlide === slideIndex ? "w-4 bg-foreground" : "w-1.5 bg-[var(--app-border)]"
            )}
          />
        ))}
      </div>

      <div className="space-y-4 pt-4">
        <h3 className="flex items-center justify-between text-lg font-semibold tracking-normal text-foreground">
          Recently Logged
          <Button variant="ghost" size="sm" className="text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
            See All
          </Button>
        </h3>

        {loggedFood.length === 0 ? (
          <Panel className="border-dashed bg-[var(--app-surface-muted)]">
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--app-shadow-sm)]">
                <Cookie className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-semibold leading-relaxed text-muted-foreground">
                Tap <span className="text-foreground">+</span> to add your <br /> first meal of the day
              </p>
            </div>
          </Panel>
        ) : (
          <div className="space-y-3">
            {loggedFood.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => {
                  onSetSelectedFood(entry.food);
                  onSetHealthSubView('food-detail');
                }}
                className="group flex w-full cursor-pointer items-center justify-between rounded-[var(--app-radius-lg)] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 text-left shadow-[var(--app-shadow-sm)] transition-colors hover:border-[var(--app-border-strong)]"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[var(--app-radius-md)] bg-[var(--app-surface-muted)]">
                    <Utensils className="h-5 w-5 text-muted-foreground/60" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="truncate text-sm font-semibold text-foreground">{entry.food?.name}</h4>
                      <span className="whitespace-nowrap rounded-[var(--app-radius-sm)] bg-[var(--app-surface-muted)] px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {entry.servings} serving{entry.servings !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-xs font-semibold text-foreground/70">{Math.round(entry.food?.calories * entry.servings)} cal</span>
                      <span className="text-[10px] font-semibold text-muted-foreground">P: {Math.round(entry.food?.protein * entry.servings)}g</span>
                      <span className="text-[10px] font-semibold text-muted-foreground">C: {Math.round(entry.food?.carbs * entry.servings)}g</span>
                      <span className="text-[10px] font-semibold text-muted-foreground">F: {Math.round(entry.food?.fats * entry.servings)}g</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    removeFoodFromLog(dateKey, entry.id);
                    onSetLogVersion(version => version + 1);
                  }}
                  className="relative z-10 flex h-10 w-10 items-center justify-center rounded-[var(--app-radius-md)] text-muted-foreground/40 transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 size={18} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </TabsContent>
  );
}

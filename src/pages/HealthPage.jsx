import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus,
  ChevronRight,
  Settings,
  Utensils,
  Flame,
  Droplet,
  Scale,
  Activity,
  Zap,
  Leaf,
  Drumstick,
  Cookie,
  Trash2,
  Footprints,
  Minus,
  GlassWater
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/layout/Panel";
import { cn } from "@/lib/utils";
import { getToday, formatDateKey } from '../utils/dateUtils';
import {
  getDailyTotals,
  addFoodToLog,
  getFoodLog,
  removeFoodFromLog
} from '../utils/foodDatabase';
import LogFoodPage from './health/LogFoodPage';
import FoodDetailPage from './health/FoodDetailPage';
import CreateMealPage from './health/CreateMealPage';
import MealDetailPage from './health/MealDetailPage';

import {
  getWeightForDate,
  getWaterForDate,
  logWater,
  getWeightHistory
} from '../utils/vitalsDatabase';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

export default function HealthPage({ settings, onFullScreenToggle, initialSubView, onSubViewConsumed }) {
  const [activeTab, setActiveTab] = useState('nutrition');
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [currentSlide, setCurrentSlide] = useState(0);
  const [healthSubView, setHealthSubView] = useState(null); // null | 'log-food' | 'food-detail' | 'create-meal' | 'meal-detail'
  
  useEffect(() => {
    if (initialSubView) {
      setHealthSubView(initialSubView);
      if (onSubViewConsumed) onSubViewConsumed();
    }
  }, [initialSubView, onSubViewConsumed]);

  const [selectedFood, setSelectedFood] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [logVersion, setLogVersion] = useState(0); // trigger re-render on logs (food, weight, water)

  useEffect(() => {
    if (onFullScreenToggle) {
      onFullScreenToggle(!!healthSubView);
    }
  }, [healthSubView, onFullScreenToggle]);

  const dateScrollRef = useRef(null);

  // Generate last 14 days and next 3 days
  const dates = useMemo(() => {
    const list = [];
    for (let i = -14; i <= 3; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      list.push(d);
    }
    return list;
  }, []);

  // Center the today's date in scroller on mount
  useEffect(() => {
    if (dateScrollRef.current) {
      const todayIdx = dates.findIndex(d => formatDateKey(d) === formatDateKey(getToday()));
      if (todayIdx !== -1) {
        const el = dateScrollRef.current.children[todayIdx];
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }
    }
  }, [dates]);
  const dateKey = formatDateKey(selectedDate);
  const waterIntake = useMemo(() => getWaterForDate(dateKey), [dateKey, logVersion]);

  // Mock data for goals (these would eventually come from user settings)
  const nutritionGoals = settings.nutritionGoals || { enabled: false, calories: 0, protein: 0, carbs: 0, fats: 0 };

  const goals = {
    calories: nutritionGoals.calories,
    protein: nutritionGoals.protein,
    carbs: nutritionGoals.carbs,
    fats: nutritionGoals.fats,
    fiber: 38,
    sugar: 84,
    sodium: 2300,
    steps: 10000
  };

  const showGoals = nutritionGoals.enabled;

  // eslint-disable-next-line
  const dailyTotals = useMemo(() => getDailyTotals(dateKey), [dateKey, logVersion]);

  const eaten = {
    calories: dailyTotals.calories || 0,
    protein: dailyTotals.protein || 0,
    carbs: dailyTotals.carbs || 0,
    fats: dailyTotals.fats || 0,
    fiber: dailyTotals.fiber || 0,
    sugar: dailyTotals.sugar || 0,
    sodium: dailyTotals.sodium || 0
  };

  return (
    <PageShell>
      <PageHeader
        title="Health"
        meta={(
          <span className="text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
            Daily log
          </span>
        )}
      />

      {/* Date Selector Scroller */}
      <div
        ref={dateScrollRef}
        className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {dates.map((date, i) => {
          const isSelected = formatDateKey(date) === dateKey;
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          const dayNum = date.getDate();

          return (
            <button
              key={i}
              onClick={() => setSelectedDate(date)}
              className={cn(
                "flex min-w-[58px] flex-col items-center justify-center rounded-[var(--app-radius-md)] border px-2 py-2 transition-all duration-200 group",
                isSelected
                  ? "border-[var(--app-border-strong)] bg-[var(--app-surface)] shadow-[var(--app-shadow-sm)]"
                  : "border-transparent text-muted-foreground hover:border-[var(--app-border)] hover:bg-[var(--app-surface-muted)]"
              )}
            >
              <span className={cn(
                "mb-1 text-[10px] font-bold uppercase tracking-normal",
                isSelected ? "text-foreground" : "text-muted-foreground"
              )}>
                {dayName}
              </span>
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-2xl transition-all duration-200",
                isSelected
                  ? "bg-foreground text-background"
                  : "bg-[var(--app-surface)] text-foreground"
              )}>
                <span className="text-sm font-semibold">
                  {dayNum}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="sticky top-2 z-10 -mx-1 flex justify-center overflow-x-auto whitespace-nowrap bg-[var(--app-bg)]/85 px-1 py-2 backdrop-blur-xl scrollbar-hide">
          <TabsList className="h-auto gap-1 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] p-1 shadow-[var(--app-shadow-sm)]">
            <TabsTrigger value="nutrition" className="rounded-xl px-5 py-2.5 text-[11px] font-semibold uppercase tracking-normal data-[state=active]:bg-foreground data-[state=active]:text-background transition-all">Nutrition</TabsTrigger>
            <TabsTrigger value="vitals" className="rounded-xl px-5 py-2.5 text-[11px] font-semibold uppercase tracking-normal data-[state=active]:bg-foreground data-[state=active]:text-background transition-all">Vitals</TabsTrigger>
            <TabsTrigger value="library" className="rounded-xl px-5 py-2.5 text-[11px] font-semibold uppercase tracking-normal data-[state=active]:bg-foreground data-[state=active]:text-background transition-all">Library</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="nutrition" className="space-y-4 outline-none relative overflow-hidden">
          {/* Dashboard Carousel */}
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
                  if (info.offset.x < -50 && currentSlide < 2) setCurrentSlide(s => s + 1);
                  if (info.offset.x > 50 && currentSlide > 0) setCurrentSlide(s => s - 1);
                }}
              >
                {currentSlide === 0 && (
                  <div className="space-y-4">
                    {/* Slide 1: Primary Macros */}
                    <Panel className="overflow-hidden">
                      <div className="p-4 md:p-6 flex items-center justify-between relative !pb-4">
                        <div className="relative z-10">
                          <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tighter">
                            {eaten.calories}{showGoals && <span className="text-lg md:text-xl text-muted-foreground font-black opacity-30"> / {goals.calories}</span>}
                          </h2>
                          <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-0.5">Calories <span className="text-foreground font-black">eaten</span></p>
                        </div>
                        <div className="relative w-20 h-20 md:w-24 md:h-24">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" className="stroke-slate-100 dark:stroke-slate-800 fill-none" strokeWidth="12" />
                            <circle cx="50" cy="50" r="40" className="stroke-amber-400 fill-none transition-all duration-1000 ease-out" strokeWidth="12" strokeLinecap="round" strokeDasharray="251" strokeDashoffset={251 - (251 * Math.min(eaten.calories / goals.calories, 1))} />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Flame className="w-5 h-5 md:w-6 md:h-6 text-amber-500 fill-current opacity-80" />
                          </div>
                        </div>
                      </div>
                    </Panel>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Protein', eaten: eaten.protein, goal: goals.protein, icon: Drumstick, color: 'text-rose-500', ringColor: 'stroke-rose-400' },
                        { label: 'Carbs', eaten: eaten.carbs, goal: goals.carbs, icon: Zap, color: 'text-amber-500', ringColor: 'stroke-amber-400' },
                        { label: 'Fats', eaten: eaten.fats, goal: goals.fats, icon: Droplet, color: 'text-blue-500', ringColor: 'stroke-blue-400' },
                      ].map((macro, idx) => (
                        <Panel key={idx} className="h-full">
                          <div className="p-3 md:p-6 flex flex-col h-full">
                            <div className="mb-4">
                              <p className="text-xs font-black text-foreground truncate">
                                {macro.eaten}{showGoals && <span className="text-[10px] text-muted-foreground opacity-30 font-bold whitespace-nowrap"> /{macro.goal}g</span>}
                              </p>
                              <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-tight mt-0.5">{macro.label} <span className="text-foreground font-black">eaten</span></p>
                            </div>
                            <div className="mt-auto flex justify-center">
                              <div className="relative h-14 w-14">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                  <circle cx="50" cy="50" r="40" className="stroke-slate-100 dark:stroke-slate-800 fill-none" strokeWidth="12" />
                                  <circle cx="50" cy="50" r="40" className={cn("fill-none transition-all duration-1000", macro.ringColor)} strokeWidth="12" strokeLinecap="round" strokeDasharray="251" strokeDashoffset={251 - (251 * Math.min(macro.eaten / macro.goal, 1))} />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center"><macro.icon className={cn("w-4 h-4", macro.color)} /></div>
                              </div>
                            </div>
                          </div>
                        </Panel>
                      ))}
                    </div>
                  </div>
                )}

                {currentSlide === 1 && (
                  <div className="space-y-4">
                    {/* Slide 2: Micros & Health Score */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Fiber', eaten: eaten.fiber || 0, goal: goals.fiber || 38, icon: Leaf, color: 'text-emerald-500', ringColor: 'stroke-emerald-400' },
                        { label: 'Sugar', eaten: eaten.sugar || 0, goal: goals.sugar || 84, icon: Cookie, color: 'text-purple-500', ringColor: 'stroke-purple-400' },
                        { label: 'Sodium', eaten: eaten.sodium || 0, goal: goals.sodium || 2300, icon: Activity, color: 'text-amber-500', ringColor: 'stroke-amber-400', unit: 'mg' },
                      ].map((micro, idx) => (
                        <Panel key={idx} className="h-full">
                          <div className="p-3 md:p-6 flex flex-col h-full min-h-[140px]">
                            <div className="mb-4">
                              <p className="text-xs font-black text-foreground truncate">{micro.eaten}<span className="text-[10px] text-muted-foreground opacity-30 font-bold whitespace-nowrap"> /{micro.goal}{micro.unit || 'g'}</span></p>
                              <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-tight mt-0.5">{micro.label} <span className="text-foreground font-black">eaten</span></p>
                            </div>
                            <div className="mt-auto flex justify-center">
                              <div className="relative h-14 w-14">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                  <circle cx="50" cy="50" r="40" className="stroke-slate-100 dark:stroke-slate-800 fill-none" strokeWidth="12" />
                                  <circle cx="50" cy="50" r="40" className={cn("fill-none", micro.ringColor)} strokeWidth="12" strokeLinecap="round" strokeDasharray="251" strokeDashoffset={251 - (251 * Math.min(micro.eaten / micro.goal, 1))} />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center"><micro.icon className={cn("w-4 h-4", micro.color)} /></div>
                              </div>
                            </div>
                          </div>
                        </Panel>
                      ))}
                    </div>
                    <Panel className="p-6 bg-gradient-to-br from-[var(--app-surface)] to-[var(--app-surface-muted)]">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-black text-foreground uppercase tracking-[0.2em]">Health Score</h3>
                        <span className="text-lg font-black text-foreground">0<span className="text-xs text-muted-foreground opacity-30"> / 10</span></span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-6">
                        <div className="h-full bg-emerald-500 rounded-full w-[10%]" />
                      </div>
                      <p className="text-xs font-bold text-muted-foreground leading-relaxed italic opacity-80">
                        Carbs and fats are on track. You’re low on calories and protein, which can slow weight loss and impact muscle retention.
                      </p>
                    </Panel>
                  </div>
                )}

                {currentSlide === 2 && (
                  <div className="space-y-4">
                    {/* Slide 3: Activity & Habits */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Steps Card */}
                      <Panel className="p-4 md:p-5 flex flex-col h-60 relative overflow-hidden">
                        <div className="z-10 text-left">
                          <p className="text-2xl md:text-3xl font-black text-foreground">107<span className="text-sm md:text-base text-muted-foreground font-black opacity-50"> /10000</span></p>
                          <p className="text-[11px] md:text-xs font-bold text-foreground mt-0.5">Steps Today</p>
                        </div>
                        <div className="mt-auto flex justify-center pb-1 relative z-10 flex-col items-center">
                          <div className="relative w-32 h-32 md:w-36 md:h-36">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="38" className="stroke-slate-100/80 dark:stroke-slate-800/80 fill-none" strokeWidth="8" />
                              <circle cx="50" cy="50" r="38" className="stroke-foreground fill-none transition-all duration-1000" strokeWidth="8" strokeLinecap="round" strokeDasharray="239" strokeDashoffset={239 - (239 * Math.max(0.01, Math.min(107 / 10000, 1)))} />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Footprints className="w-6 h-6 text-foreground fill-foreground/90" />
                            </div>
                          </div>
                        </div>
                      </Panel>

                      {/* Calories Burned Card */}
                      <Panel className="p-4 md:p-5 flex flex-col h-60 relative overflow-hidden">
                        <div className="flex items-center gap-1.5 z-10">
                          <Flame className="w-5 h-5 text-foreground fill-foreground" />
                          <p className="text-2xl md:text-3xl font-black text-foreground">2</p>
                        </div>
                        <p className="text-[11px] md:text-xs font-bold text-foreground mt-0.5 z-10 text-left">Calories burned</p>

                        <div className="mt-4 flex items-center gap-2.5 z-10">
                          <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center shrink-0">
                            <Footprints className="w-3.5 h-3.5" strokeWidth={2.5} />
                          </div>
                          <div className="flex flex-col items-start gap-0.5">
                            <span className="text-[11px] font-bold text-foreground leading-none">Steps</span>
                            <span className="text-[10px] font-black text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5 leading-none mt-0.5">+2</span>
                          </div>
                        </div>
                      </Panel>
                    </div>

                    {/* Water Card */}
                    <Panel className="flex w-full items-center justify-between gap-0 p-4 md:p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-[#F2F4F7] dark:bg-slate-800/60 rounded-[20px] flex items-center justify-center shrink-0">
                          <GlassWater className="w-6 h-6 text-[#4F8CEF] fill-[#4F8CEF]" strokeWidth={1.5} />
                        </div>
                        <div className="flex flex-col items-start">
                          <p className="text-[13px] md:text-sm font-bold text-foreground mb-1">Water</p>
                          <div className="flex items-center gap-1.5">
                            <p className="text-base font-black text-foreground leading-none">{waterIntake} ml</p>
                            <Settings className="w-4 h-4 text-muted-foreground/40 hover:text-muted-foreground cursor-pointer transition-colors" strokeWidth={2} />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            logWater(dateKey, -250);
                            setLogVersion(v => v + 1);
                          }}
                          className="w-10 h-10 rounded-full flex items-center justify-center text-foreground border border-foreground hover:bg-muted/50 transition-colors"
                        >
                          <Minus size={18} strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => {
                            logWater(dateKey, 250);
                            setLogVersion(v => v + 1);
                          }}
                          className="w-10 h-10 rounded-full flex items-center justify-center bg-foreground text-background hover:scale-105 transition-transform"
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

          {/* Slider Dots */}
          <div className="flex justify-center items-center gap-1.5 py-2">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all duration-300",
                  currentSlide === i ? "bg-foreground w-4" : "bg-muted"
                )}
              />
            ))}
          </div>

          {/* Activity / Logs Section */}
          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-semibold text-foreground tracking-normal flex items-center justify-between">
              Recently Logged
              <Button variant="ghost" size="sm" className="text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">See All</Button>
            </h3>


            {getFoodLog(dateKey).length === 0 ? (
              <Panel className="border-dashed bg-[var(--app-surface-muted)]">
                <div className="p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-[var(--app-surface)] rounded-2xl shadow-sm border border-[var(--app-border)] flex items-center justify-center mb-5">
                    <Cookie className="w-10 h-10 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm font-bold text-muted-foreground leading-relaxed">
                    Tap <span className="text-foreground">+</span> to add your <br /> first meal of the day
                  </p>
                </div>
              </Panel>
            ) : (
              <div className="space-y-3">
                {getFoodLog(dateKey).map((entry) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => {
                      setSelectedFood(entry.food);
                      setHealthSubView('food-detail');
                    }}
                    className="w-full text-left group bg-[var(--app-surface)] border border-[var(--app-border)] rounded-[var(--app-radius-lg)] p-4 flex items-center justify-between hover:border-[var(--app-border-strong)] transition-all active:scale-[0.98] cursor-pointer shadow-[var(--app-shadow-sm)]"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-muted/50 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Utensils className="w-5 h-5 text-muted-foreground/60" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-foreground truncate">{entry.food?.name}</h4>
                          <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full whitespace-nowrap">
                            {entry.servings} serving{entry.servings !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs font-bold text-foreground/70">{Math.round(entry.food?.calories * entry.servings)} cal</span>
                          <div className="flex items-center gap-1.5 opacity-60">
                            <span className="text-[10px] font-bold">P: {Math.round(entry.food?.protein * entry.servings)}g</span>
                            <span className="text-[10px] font-bold">C: {Math.round(entry.food?.carbs * entry.servings)}g</span>
                            <span className="text-[10px] font-bold">F: {Math.round(entry.food?.fats * entry.servings)}g</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Don't trigger the card's onClick
                        removeFoodFromLog(dateKey, entry.id);
                        setLogVersion(v => v + 1);
                      }}
                      className="w-10 h-10 flex items-center justify-center rounded-2xl text-muted-foreground/20 group-hover:text-red-500/60 transition-colors hover:bg-red-500/5 relative z-10"
                    >
                      <Trash2 size={18} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="vitals" className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Weight Stats Overview */}
          <div className="grid grid-cols-2 gap-4">
            <Panel className="p-5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-normal mb-1">Today's Weight</p>
              <h3 className="text-2xl font-semibold text-foreground">
                {getWeightForDate(dateKey) ? `${getWeightForDate(dateKey)} kg` : '--'}
              </h3>
            </Panel>
            <Panel className="p-5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-normal mb-1">7D Trend</p>
              <h3 className="text-2xl font-semibold text-foreground">Stable</h3>
            </Panel>
          </div>

          {/* Weight Chart */}
          <Panel className="p-5 md:p-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-normal">Weight Trend</h3>
                <p className="text-[10px] font-bold text-muted-foreground mt-1">Last 14 days</p>
              </div>
              <Activity className="w-5 h-5 text-indigo-500 opacity-50" />
            </div>

            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getWeightHistory(14)}>
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                    tickFormatter={(str) => {
                      const d = new Date(str);
                      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                    }}
                  />
                  <YAxis
                    hide
                    domain={['dataMin - 2', 'dataMax + 2']}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white px-3 py-2 rounded-xl border border-slate-800 shadow-xl text-[10px] font-black">
                            <p>{new Date(payload[0].payload.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                            <p className="text-indigo-400 mt-0.5">{payload[0].value} kg</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="#6366f1"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorWeight)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          {/* History List */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-foreground uppercase tracking-[0.2em] px-2 mb-4">Weight History</h3>
            {getWeightHistory(10).length === 0 ? (
              <p className="text-xs font-bold text-muted-foreground italic text-center py-8">No weight data available.</p>
            ) : (
              getWeightHistory(10).map((entry, idx) => (
                <div key={idx} className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded-[var(--app-radius-md)] p-4 flex items-center justify-between shadow-[var(--app-shadow-sm)]">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                      <Scale size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-foreground">{entry.weight} kg</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                        {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground/30" />
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="library">
          <div className="p-12 text-center text-muted-foreground italic">
            Food and meal library coming soon...
          </div>
        </TabsContent>
      </Tabs>

      {/* Floating Action Button */}

      {/* Sub-views */}
      <AnimatePresence>
        {healthSubView === 'log-food' && (
          <LogFoodPage
            onBack={() => setHealthSubView(null)}
            onSelectFood={(food) => {
              setSelectedFood(food); // null = manual add
              setHealthSubView('food-detail');
            }}
            onSelectMeal={(meal) => {
              setSelectedMeal(meal);
              setHealthSubView('meal-detail');
            }}
            onCreateMeal={() => {
              setHealthSubView('create-meal');
            }}
          />
        )}
        {healthSubView === 'food-detail' && (
          <FoodDetailPage
            food={selectedFood}
            dateKey={dateKey}
            onBack={() => {
              setHealthSubView('log-food');
              setSelectedFood(null);
            }}
            onSave={(entry) => {
              addFoodToLog(dateKey, entry);
              setLogVersion(v => v + 1);
              setHealthSubView(null);
              setSelectedFood(null);
            }}
          />
        )}
        {healthSubView === 'create-meal' && (
          <CreateMealPage
            onBack={() => setHealthSubView('log-food')}
            onSaveMeal={(meal, shouldLog) => {
              if (shouldLog && meal?.items) {
                meal.items.forEach(item => {
                  addFoodToLog(dateKey, item);
                });
                setLogVersion(v => v + 1);
              }
              setHealthSubView(null);
            }}
          />
        )}
        {healthSubView === 'meal-detail' && selectedMeal && (
          <MealDetailPage
            meal={selectedMeal}
            onBack={() => {
              setHealthSubView('log-food');
              setSelectedMeal(null);
            }}
            onAddItems={() => {
              // TODO: Navigate to a food picker that adds items back to the meal
              setHealthSubView('log-food');
            }}
            onDone={() => {
              setHealthSubView(null);
              setSelectedMeal(null);
            }}
            onLogMeal={() => {
              // Log every item in the meal to the current day
              if (selectedMeal?.items) {
                selectedMeal.items.forEach(item => {
                  addFoodToLog(dateKey, item);
                });
                setLogVersion(v => v + 1);
              }
              setHealthSubView(null);
              setSelectedMeal(null);
            }}
            onDeleteMeal={() => {
              setHealthSubView('log-food');
              setSelectedMeal(null);
            }}
          />
        )}
      </AnimatePresence>
    </PageShell>
  );
}

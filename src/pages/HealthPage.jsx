import { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  Utensils, 
  Flame, 
  Droplet, 
  Moon, 
  Scale, 
  ChevronDown,
  Activity,
  Zap,
  Leaf,
  Drumstick,
  Cookie
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { getToday, formatDateKey, formatDateDisplay } from '../utils/dateUtils';
import { loadSettings } from '../utils/settings';
import { getDailyTotals, addFoodToLog } from '../utils/foodDatabase';
import LogFoodPage from './health/LogFoodPage';
import FoodDetailPage from './health/FoodDetailPage';
import CreateMealPage from './health/CreateMealPage';

export default function HealthPage({ settings, onFullScreenToggle }) {
  const [activeTab, setActiveTab] = useState('nutrition');
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [currentSlide, setCurrentSlide] = useState(0);
  const [waterIntake, setWaterIntake] = useState(0);
  const [healthSubView, setHealthSubView] = useState(null); // null | 'log-food' | 'food-detail' | 'create-meal'
  const [selectedFood, setSelectedFood] = useState(null);
  const [logVersion, setLogVersion] = useState(0); // trigger re-render on food log
  
  // Update parent full screen mode
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
  const isToday = dateKey === formatDateKey(getToday());

  // Mock data for goals (these would eventually come from user settings)
  const nutritionGoals = settings.nutritionGoals || { enabled: false, calories: 2000, protein: 150, carbs: 250, fats: 65 };
  
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
    <div className="space-y-6 pb-24 animate-in fade-in duration-500 max-w-4xl mx-auto px-1">
      {/* Branding Header */}
      <div className="flex items-center justify-between px-4 pt-2">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-foreground dark:bg-card rounded-2xl flex items-center justify-center shadow-sm">
                <Leaf className="text-background dark:text-foreground w-6 h-6 fill-current" />
            </div>
            <div>
                <h1 className="text-2xl font-black text-foreground tracking-tighter leading-none">Health Hub</h1>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Daily Log</p>
            </div>
        </div>
      </div>

      {/* Date Selector Scroller */}
      <div 
        ref={dateScrollRef}
        className="flex items-center gap-2 overflow-x-auto pb-6 no-scrollbar scroll-smooth px-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {dates.map((date, i) => {
            const isSelected = formatDateKey(date) === dateKey;
            const isTodayItem = formatDateKey(date) === formatDateKey(getToday());
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = date.getDate();

            return (
                <button
                    key={i}
                    onClick={() => setSelectedDate(date)}
                    className={cn(
                        "flex flex-col items-center justify-center min-w-[64px] transition-all duration-300 group",
                        isSelected ? "scale-110" : "opacity-60 hover:opacity-100"
                    )}
                >
                    <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider mb-2",
                        isSelected ? "text-foreground font-black" : "text-muted-foreground"
                    )}>
                        {dayName}
                    </span>
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                        isSelected 
                          ? "bg-foreground text-background shadow-lg shadow-slate-200 dark:shadow-none" 
                          : "border-2 border-dashed border-slate-200 dark:border-slate-800 text-foreground"
                    )}>
                        <span className="text-base font-black">
                            {dayNum}
                        </span>
                    </div>
                </button>
            );
        })}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-center mb-8 sticky top-[72px] z-10 bg-background/80 backdrop-blur-md py-2 -mx-4 px-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <TabsList className="bg-muted/50 p-1 rounded-2xl border border-border/50 h-auto gap-1">
                <TabsTrigger value="nutrition" className="rounded-xl px-6 py-2.5 text-xs font-black uppercase tracking-widest data-[state=active]:bg-foreground data-[state=active]:text-background transition-all">Nutrition</TabsTrigger>
                <TabsTrigger value="vitals" className="rounded-xl px-6 py-2.5 text-xs font-black uppercase tracking-widest data-[state=active]:bg-foreground data-[state=active]:text-background transition-all">Vitals</TabsTrigger>
                <TabsTrigger value="library" className="rounded-xl px-6 py-2.5 text-xs font-black uppercase tracking-widest data-[state=active]:bg-foreground data-[state=active]:text-background transition-all">Library</TabsTrigger>
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
                                <Card className="rounded-[40px] border border-border shadow-sm overflow-hidden group">
                                    <CardContent className="p-5 md:p-8 flex items-center justify-between relative">
                                        <div className="relative z-10">
                                            <h2 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter">
                                                {eaten.calories}{showGoals && <span className="text-xl md:text-2xl text-muted-foreground font-black opacity-30"> / {goals.calories}</span>}
                                            </h2>
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">Calories <span className="text-foreground font-black">eaten</span></p>
                                        </div>
                                        <div className="relative w-28 h-28 md:w-36 md:h-36">
                                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r="40" className="stroke-slate-100 dark:stroke-slate-800 fill-none" strokeWidth="12" />
                                                <circle cx="50" cy="50" r="40" className="stroke-amber-400 fill-none transition-all duration-1000 ease-out" strokeWidth="12" strokeLinecap="round" strokeDasharray="251" strokeDashoffset={251 - (251 * Math.min(eaten.calories / goals.calories, 1))} />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Flame className="w-8 h-8 text-amber-500 fill-current opacity-80" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { label: 'Protein', eaten: eaten.protein, goal: goals.protein, icon: Drumstick, color: 'text-rose-500', ringColor: 'stroke-rose-400' },
                                        { label: 'Carbs', eaten: eaten.carbs, goal: goals.carbs, icon: Zap, color: 'text-amber-500', ringColor: 'stroke-amber-400' },
                                        { label: 'Fats', eaten: eaten.fats, goal: goals.fats, icon: Droplet, color: 'text-blue-500', ringColor: 'stroke-blue-400' },
                                    ].map((macro, idx) => (
                                        <Card key={idx} className="rounded-[32px] border border-border shadow-sm h-full">
                                            <CardContent className="p-3 md:p-6 flex flex-col h-full">
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
                                            </CardContent>
                                        </Card>
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
                                        <Card key={idx} className="rounded-[32px] border border-border shadow-sm h-full">
                                            <CardContent className="p-3 md:p-6 flex flex-col h-full min-h-[140px]">
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
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                                <Card className="rounded-[32px] border border-border shadow-sm p-6 bg-gradient-to-br from-card to-slate-50/50">
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
                                </Card>
                            </div>
                        )}

                        {currentSlide === 2 && (
                            <div className="space-y-4">
                                {/* Slide 3: Activity & Habits */}
                                <div className="grid grid-cols-2 gap-4">
                                    <Card className="rounded-[40px] border border-border shadow-sm p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group h-40">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Activity className="w-8 h-8 text-foreground" /></div>
                                        <p className="text-4xl font-black text-foreground">0<span className="text-sm text-muted-foreground opacity-30"> / 10000</span></p>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2">Steps Today</p>
                                        <div className="mt-4 p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/10 flex items-center gap-2">
                                            <Activity size={12} className="text-indigo-600" />
                                            <span className="text-[8px] font-black text-indigo-700 uppercase">Connect Health</span>
                                        </div>
                                    </Card>
                                    <Card className="rounded-[40px] border border-border shadow-sm p-6 flex flex-col items-center justify-center text-center h-40">
                                        <Flame className="w-8 h-8 text-amber-500 fill-amber-500 mb-2" />
                                        <p className="text-4xl font-black text-foreground">0</p>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2">Calories Burned</p>
                                    </Card>
                                </div>
                                <Card className="rounded-[40px] border border-border shadow-sm p-6 md:p-8 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-blue-500/10 rounded-3xl flex items-center justify-center border border-blue-500/10">
                                            <Droplet className="w-8 h-8 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-foreground">{waterIntake} <span className="text-xs text-muted-foreground opacity-30 font-black">ml</span></p>
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Water Intake</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => setWaterIntake(prev => Math.max(0, prev - 250))}
                                            className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-foreground font-black text-xl border border-border hover:bg-slate-200 transition-colors"
                                        >−</button>
                                        <button 
                                            onClick={() => setWaterIntake(prev => prev + 250)}
                                            className="w-12 h-12 bg-foreground text-background rounded-2xl flex items-center justify-center text-xl font-bold hover:scale-105 transition-transform"
                                        >+</button>
                                    </div>
                                </Card>
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
                <h3 className="text-xl font-black text-foreground tracking-tight flex items-center justify-between">
                    Recently Logged
                    <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">See All</Button>
                </h3>

                <Card className="rounded-3xl border border-dashed border-border/60 bg-muted/20">
                    <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-card rounded-2xl shadow-sm border border-border flex items-center justify-center mb-6">
                            <Cookie className="w-10 h-10 text-muted-foreground/40" />
                        </div>
                        <p className="text-sm font-bold text-muted-foreground leading-relaxed">
                            Tap <span className="text-foreground">+</span> to add your <br /> first meal of the day
                        </p>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>

        <TabsContent value="vitals">
            <div className="p-12 text-center text-muted-foreground italic">
                Body weight and vitals tracking coming soon...
            </div>
        </TabsContent>

        <TabsContent value="library">
            <div className="p-12 text-center text-muted-foreground italic">
                Food and meal library coming soon...
            </div>
        </TabsContent>
      </Tabs>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setHealthSubView('log-food')}
        className="fixed bottom-28 right-6 md:bottom-12 md:right-12 w-14 h-14 bg-foreground text-background rounded-full shadow-2xl flex items-center justify-center z-[50]"
      >
        <Plus size={24} strokeWidth={3.5} />
      </motion.button>

      {/* Sub-views */}
      <AnimatePresence>
        {healthSubView === 'log-food' && (
          <LogFoodPage
            onBack={() => setHealthSubView(null)}
            onSelectFood={(food) => {
              setSelectedFood(food); // null = manual add
              setHealthSubView('food-detail');
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
            onSaveMeal={(meal) => {
              setHealthSubView(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

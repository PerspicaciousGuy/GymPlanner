import { useState, useMemo, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { getToday, formatDateKey } from '../utils/dateUtils';
import {
  getDailyTotals,
  addFoodToLog,
} from '../utils/foodDatabase';
import LogFoodPage from './health/LogFoodPage';
import FoodDetailPage from './health/FoodDetailPage';
import CreateMealPage from './health/CreateMealPage';
import MealDetailPage from './health/MealDetailPage';
import { HealthDateScroller } from './health/HealthDateScroller';
import { HealthNutritionTab } from './health/HealthNutritionTab';
import { HealthVitalsTab } from './health/HealthVitalsTab';

import {
  getWaterForDate,
} from '../utils/vitalsDatabase';

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

  const dates = useMemo(() => {
    const list = [];
    for (let i = -14; i <= 3; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      list.push(d);
    }
    return list;
  }, []);

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

      <HealthDateScroller
        dates={dates}
        selectedDateKey={dateKey}
        onSelectDate={setSelectedDate}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="sticky top-2 z-10 -mx-1 flex justify-center overflow-x-auto whitespace-nowrap bg-[var(--app-bg)]/85 px-1 py-2 backdrop-blur-xl scrollbar-hide">
          <TabsList className="h-auto gap-1 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] p-1 shadow-[var(--app-shadow-sm)]">
            <TabsTrigger value="nutrition" className="rounded-[var(--app-radius-sm)] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-normal transition-all data-[state=active]:bg-foreground data-[state=active]:text-background">Nutrition</TabsTrigger>
            <TabsTrigger value="vitals" className="rounded-[var(--app-radius-sm)] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-normal transition-all data-[state=active]:bg-foreground data-[state=active]:text-background">Vitals</TabsTrigger>
          </TabsList>
        </div>

        <HealthNutritionTab
          currentSlide={currentSlide}
          dateKey={dateKey}
          eaten={eaten}
          goals={goals}
          onSetCurrentSlide={setCurrentSlide}
          onSetHealthSubView={setHealthSubView}
          onSetLogVersion={setLogVersion}
          onSetSelectedFood={setSelectedFood}
          showGoals={showGoals}
          waterIntake={waterIntake}
        />

        <HealthVitalsTab dateKey={dateKey} />
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

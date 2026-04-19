import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  Plus,
  Flame,
  ClipboardList,
  Utensils,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DEFAULT_FOODS,
  getSavedMeals,
  getCustomFoods,
  getBookmarkedFoods,
  searchFoods,
} from '../../utils/foodDatabase';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'my_meals', label: 'My Meals' },
  { id: 'my_foods', label: 'My Foods' },
  { id: 'saved', label: 'Saved' },
];

export default function LogFoodPage({ onBack, onSelectFood, onSelectMeal, onCreateMeal }) {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Get data
  const bookmarkedIds = getBookmarkedFoods();
  const customFoods = getCustomFoods();
  const savedMeals = getSavedMeals();

  // Local search results (for My Foods / Saved tabs, or as fallback)
  const displayItems = useMemo(() => {
    if (activeTab === 'my_meals') return [];
    if (activeTab === 'my_foods') {
      if (!searchQuery.trim()) return customFoods;
      const q = searchQuery.toLowerCase();
      return customFoods.filter(f => f.name.toLowerCase().includes(q));
    }
    if (activeTab === 'saved') {
      const allFoods = searchFoods(searchQuery);
      return allFoods.filter(f => bookmarkedIds.includes(f.id));
    }
    // 'all' tab - show local suggestions when no query
    if (!searchQuery.trim()) {
      // Just popular IDs for suggestions
      const popularIds = [
        'peanut_butter', 'egg', 'banana', 'chicken_breast_raw',
        'oats', 'white_rice_raw', 'almonds', 'whey_protein',
      ];
      return DEFAULT_FOODS.filter(f => popularIds.includes(f.id));
    }
    // When searching
    return searchFoods(searchQuery);
  }, [searchQuery, activeTab, customFoods, bookmarkedIds]);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="fixed inset-0 bg-background z-[100] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
        >
          <ArrowLeft size={22} className="text-foreground" />
        </button>
        <h1 className="text-lg font-black text-foreground tracking-tight">Log food</h1>
        <div className="w-10" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 py-2 overflow-x-auto no-scrollbar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all",
              activeTab === tab.id
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Box */}
      <div className="px-4 py-3">
        <div className="relative">
          <div className="flex items-center bg-muted/50 border border-border rounded-2xl px-4 py-3 gap-3 focus-within:ring-2 focus-within:ring-foreground/20 transition-all">
            <Search size={18} className="text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Search foods"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {/* All / My Foods / Saved tabs */}
        {activeTab !== 'my_meals' && (
          <>
            {/* Section Headers */}
            {activeTab === 'all' && !searchQuery.trim() && (
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-base font-black text-foreground tracking-tight">Suggestions</h2>
              </div>
            )}
            {activeTab === 'all' && searchQuery.trim() && (
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-black text-foreground tracking-tight">
                  Results for "{searchQuery}"
                </h2>
              </div>
            )}

            {/* Empty state */}
            {displayItems.length === 0 && (
              <div className="text-center py-16">
                <Utensils size={40} className="mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-sm font-bold text-muted-foreground">
                  {activeTab === 'my_foods' ? 'No custom foods yet' :
                   activeTab === 'saved' ? 'No saved foods yet' :
                   'No foods found'}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {activeTab === 'my_foods' ? 'Tap "Manual Add" to create one' :
                   activeTab === 'saved' ? 'Bookmark foods to save them here' :
                   'Try a different search term'}
                </p>
              </div>
            )}

            {/* Food list */}
            {displayItems.length > 0 && (
              <div className="space-y-2">
                {displayItems.map((food, idx) => (
                  <motion.button
                    key={food.id || `food-${idx}`}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelectFood(food)}
                    className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-2xl hover:shadow-md transition-all group text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-foreground truncate">{food.name}</p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Flame size={12} className="text-muted-foreground/50" />
                        <span className="text-xs text-muted-foreground">
                          {food.calories} cal
                          <span className="mx-1">·</span>
                          P: {food.protein}g
                          <span className="mx-1">·</span>
                          C: {food.carbs}g
                          <span className="mx-1">·</span>
                          F: {food.fats}g
                        </span>
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-full border-2 border-border flex items-center justify-center text-muted-foreground group-hover:border-foreground group-hover:text-foreground transition-colors flex-shrink-0 ml-3">
                      <Plus size={18} strokeWidth={2.5} />
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </>
        )}

        {/* My Meals tab */}
        {activeTab === 'my_meals' && (
          <>
            {savedMeals.length === 0 ? (
              <div className="text-center py-16">
                <ClipboardList size={40} className="mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-sm font-bold text-muted-foreground">No meals saved yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Create a meal to quickly log combos</p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedMeals.map((meal) => (
                  <motion.button
                    key={meal.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelectMeal ? onSelectMeal(meal) : onSelectFood(meal)}
                    className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-2xl hover:shadow-md transition-all group text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{meal.name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Flame size={12} className="text-muted-foreground/50" />
                        <span className="text-xs text-muted-foreground">
                          {meal.items?.reduce((sum, item) => sum + Math.round((item.food?.calories || 0) * (item.servings || 1)), 0) || 0} cal
                        </span>
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-full border-2 border-border flex items-center justify-center text-muted-foreground group-hover:border-foreground group-hover:text-foreground transition-colors flex-shrink-0 ml-3">
                      <Plus size={18} strokeWidth={2.5} />
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 border-t border-border px-4 py-4 flex gap-3 z-[101]"
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <Button
          variant="outline"
          onClick={() => onSelectFood(null)}
          className="flex-1 h-14 rounded-2xl border-2 border-border font-bold text-sm gap-2 hover:bg-muted"
        >
          <ClipboardList size={18} />
          Manual Add
        </Button>
        <Button
          variant="outline"
          onClick={onCreateMeal}
          className="flex-1 h-14 rounded-2xl border-2 border-border font-bold text-sm gap-2 hover:bg-muted"
        >
          <Utensils size={18} />
          Create Meal
        </Button>
      </div>
    </motion.div>
  );
}

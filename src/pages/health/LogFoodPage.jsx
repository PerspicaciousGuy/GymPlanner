import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Search,
  Plus,
  Flame,
  Bookmark,
  ClipboardList,
  Utensils,
  X,
  Loader2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DEFAULT_FOODS,
  getSavedMeals,
  getCustomFoods,
  getBookmarkedFoods,
  searchFoods,
} from '../../utils/foodDatabase';
import {
  searchFatSecretFoods,
  getCachedFatSecretFoods,
} from '../../utils/fatSecretApi';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'my_meals', label: 'My Meals' },
  { id: 'my_foods', label: 'My Foods' },
  { id: 'saved', label: 'Saved' },
];

export default function LogFoodPage({ onBack, onSelectFood, onCreateMeal }) {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [apiResults, setApiResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);

  // Get data
  const bookmarkedIds = getBookmarkedFoods();
  const customFoods = getCustomFoods();
  const savedMeals = getSavedMeals();
  const cachedFoods = getCachedFatSecretFoods();

  // Debounced FatSecret API search
  useEffect(() => {
    if (activeTab !== 'all' || searchQuery.trim().length < 2) {
      setApiResults([]);
      setIsSearching(false);
      setSearchError(false);
      return;
    }

    setIsSearching(true);
    setSearchError(false);
    const timeout = setTimeout(async () => {
      try {
        const { foods } = await searchFatSecretFoods(searchQuery);
        setApiResults(foods);
        setSearchError(false);
      } catch {
        setSearchError(true);
        setApiResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(timeout);
  }, [searchQuery, activeTab]);

  // Local search results (for My Foods / Saved tabs, or as fallback)
  const localResults = useMemo(() => {
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
      // Mix cached fatsecret foods (recently used) with popular defaults
      const popularIds = [
        'peanut_butter', 'avocado', 'egg', 'banana', 'chicken_breast',
        'apple', 'oats', 'greek_yogurt', 'white_rice', 'spinach',
        'almonds', 'whey_protein',
      ];
      const localSuggestions = DEFAULT_FOODS.filter(f => popularIds.includes(f.id));
      // Show cached FatSecret foods first (recently logged), then local
      const recentCached = cachedFoods.slice(0, 8);
      return [...recentCached, ...localSuggestions];
    }
    // When searching, also search local as a fallback/complement
    return searchFoods(searchQuery);
  }, [searchQuery, activeTab, customFoods, bookmarkedIds, cachedFoods]);

  // Combine results: API first, then local (deduplicated)
  const displayItems = useMemo(() => {
    if (activeTab !== 'all') return localResults;
    if (!searchQuery.trim()) return localResults; // Suggestions mode

    // Merge: API results first, then local that aren't duplicated
    const apiIds = new Set(apiResults.map(f => f.name.toLowerCase()));
    const uniqueLocal = localResults.filter(f => !apiIds.has(f.name.toLowerCase()));
    return [...apiResults, ...uniqueLocal];
  }, [activeTab, searchQuery, apiResults, localResults]);

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
            {isSearching ? (
              <Loader2 size={18} className="text-muted-foreground flex-shrink-0 animate-spin" />
            ) : (
              <Search size={18} className="text-muted-foreground flex-shrink-0" />
            )}
            <input
              type="text"
              placeholder="Search foods (powered by FatSecret)"
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
                {cachedFoods.length > 0 && (
                  <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    Recently Used
                  </span>
                )}
              </div>
            )}
            {activeTab === 'all' && searchQuery.trim() && (
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-black text-foreground tracking-tight">
                  Results for "{searchQuery}"
                </h2>
                {searchError && (
                  <div className="flex items-center gap-1 text-amber-500">
                    <WifiOff size={12} />
                    <span className="text-[10px] font-bold">Offline</span>
                  </div>
                )}
                {!searchError && apiResults.length > 0 && (
                  <div className="flex items-center gap-1 text-emerald-500">
                    <Wifi size={12} />
                    <span className="text-[10px] font-bold">FatSecret</span>
                  </div>
                )}
              </div>
            )}

            {/* Loading state */}
            {isSearching && displayItems.length === 0 && (
              <div className="text-center py-16">
                <Loader2 size={32} className="mx-auto text-muted-foreground/40 mb-4 animate-spin" />
                <p className="text-sm font-bold text-muted-foreground">Searching...</p>
              </div>
            )}

            {/* Empty state */}
            {!isSearching && displayItems.length === 0 && (
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
                        {food.brand && (
                          <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md truncate max-w-[100px]">
                            {food.brand}
                          </span>
                        )}
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
                    onClick={() => onSelectFood(meal)}
                    className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-2xl hover:shadow-md transition-all group text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{meal.name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Flame size={12} className="text-muted-foreground/50" />
                        <span className="text-xs text-muted-foreground">
                          {meal.items?.length || 0} items
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

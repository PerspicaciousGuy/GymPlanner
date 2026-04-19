import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Plus,
  Flame,
  Pencil,
  Zap,
  Droplet,
  Cookie,
  Trash2,
  UtensilsCrossed,
  Search,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  searchFoods,
  DEFAULT_FOODS,
  calculateNutrition,
  saveMeal,
  calculateMealNutrition,
} from '../../utils/foodDatabase';

/**
 * CreateMealPage — Build a multi-item meal.
 * Users name their meal, add food items from a search, and save it.
 */
export default function CreateMealPage({ onBack, onSaveMeal }) {
  const [mealName, setMealName] = useState('');
  const [mealItems, setMealItems] = useState([]); // Array of { food, servings }
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);

  // Total nutrition across all items
  const totals = useMemo(() => {
    return calculateMealNutrition(mealItems);
  }, [mealItems]);

  // Search results for adding items
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      const popularIds = [
        'egg', 'chicken_breast_raw', 'white_rice_raw', 'banana', 'peanut_butter',
        'oats', 'almonds', 'whey_protein', 'honey',
      ];
      return DEFAULT_FOODS.filter(f => popularIds.includes(f.id));
    }
    return searchFoods(searchQuery);
  }, [searchQuery]);

  const addItem = (food) => {
    setMealItems(prev => [...prev, { food, servings: 1 }]);
    setShowSearch(false);
    setSearchQuery('');
  };

  const removeItem = (index) => {
    setMealItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateServings = (index, delta) => {
    setMealItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const newServings = Math.max(0.5, item.servings + delta);
      return { ...item, servings: newServings };
    }));
  };

  const handleCreate = () => {
    const meal = saveMeal({
      name: mealName || 'Unnamed Meal',
      items: mealItems,
      totalNutrition: totals,
    });
    onSaveMeal(meal);
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="fixed inset-0 bg-background z-[110] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
        >
          <ArrowLeft size={22} className="text-foreground" />
        </button>
        <h1 className="text-lg font-black text-foreground tracking-tight">Create Meal</h1>
        <div className="w-10" />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {/* Meal Name */}
        <div className="mt-4 mb-6">
          <div className="flex items-center gap-3 border-b-2 border-border/50 focus-within:border-foreground pb-2 transition-colors">
            <input
              type="text"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              placeholder="Tap Name"
              className="flex-1 text-xl font-bold text-foreground bg-transparent outline-none placeholder:text-muted-foreground/50"
            />
            <Pencil size={18} className="text-muted-foreground/40" />
          </div>
        </div>

        {/* Calories Summary Card */}
        <Card className="rounded-3xl border border-border shadow-sm mb-4">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
              <Flame size={22} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Calories</p>
              <p className="text-2xl font-black text-foreground">{totals.calories}</p>
            </div>
          </CardContent>
        </Card>

        {/* Macro Cards Row */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { key: 'protein', label: 'Protein', icon: Zap, color: 'text-rose-500' },
            { key: 'carbs', label: 'Carbs', icon: Cookie, color: 'text-amber-500' },
            { key: 'fats', label: 'Fats', icon: Droplet, color: 'text-blue-500' },
          ].map(macro => (
            <Card key={macro.key} className="rounded-2xl border border-border shadow-sm">
              <CardContent className="p-3 flex flex-col items-start gap-1">
                <div className="flex items-center gap-1.5">
                  <macro.icon size={12} className={macro.color} />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{macro.label}</span>
                </div>
                <span className="text-lg font-black text-foreground">{totals[macro.key]}g</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Meal Items Section */}
        <div className="flex items-center justify-center mb-4">
          <UtensilsCrossed size={20} className="text-muted-foreground/40 mr-2" />
          <h3 className="text-lg font-black text-foreground tracking-tight text-center">
            Meal Items
          </h3>
        </div>

        {/* Item List */}
        {mealItems.length > 0 && (
          <div className="space-y-2 mb-4">
            <AnimatePresence>
              {mealItems.map((item, idx) => {
                const itemNutrition = calculateNutrition(item.food, item.servings);
                return (
                  <motion.div
                    key={`${item.food.id}-${idx}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{item.food.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {itemNutrition.calories} cal · {item.servings} serving{item.servings !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateServings(idx, -0.5)}
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground text-xs font-bold flex-shrink-0"
                      >
                        −
                      </button>
                      {editingIndex === idx ? (
                        <input
                          autoFocus
                          type="number"
                          step="any"
                          defaultValue={item.servings}
                          onBlur={(e) => {
                             const val = parseFloat(e.target.value) || 0.5;
                             setMealItems(prev => prev.map((it, i) => i === idx ? { ...it, servings: Math.max(0.1, val) } : it));
                             setEditingIndex(null);
                          }}
                          onKeyDown={(e) => {
                             if (e.key === 'Enter') {
                                 const val = parseFloat(e.target.value) || 0.5;
                                 setMealItems(prev => prev.map((it, i) => i === idx ? { ...it, servings: Math.max(0.1, val) } : it));
                                 setEditingIndex(null);
                             }
                          }}
                          className="text-xs font-black text-foreground w-10 text-center bg-transparent outline-none border-b-2 border-foreground"
                        />
                      ) : (
                        <span 
                          onClick={() => setEditingIndex(idx)}
                          className="text-xs font-black text-foreground w-10 text-center cursor-pointer hover:text-muted-foreground"
                        >
                            {item.servings}
                        </span>
                      )}
                      <button
                        onClick={() => updateServings(idx, 0.5)}
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground text-xs font-bold flex-shrink-0"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(idx)}
                      className="p-1.5 text-muted-foreground/40 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Add Items Button */}
        <button
          onClick={() => setShowSearch(true)}
          className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-2xl text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-all"
        >
          <Plus size={18} />
          <span className="text-sm font-bold">Add items to this meal</span>
        </button>
      </div>

      {/* Create Meal Button */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 py-4 z-[111] flex gap-3 bg-background/90 backdrop-blur-md border-t border-border"
      >
        <Button
          variant="outline"
          onClick={() => {
            const meal = saveMeal({
              name: mealName || 'Unnamed Meal',
              items: mealItems,
              totalNutrition: totals,
            });
            onSaveMeal(meal, false);
          }}
          disabled={mealItems.length === 0}
          className="flex-1 h-14 rounded-2xl font-black text-base transition-all border-2 border-border"
        >
          Save
        </Button>
        <Button
          onClick={() => {
            const meal = saveMeal({
              name: mealName || 'Unnamed Meal',
              items: mealItems,
              totalNutrition: totals,
            });
            onSaveMeal(meal, true);
          }}
          disabled={mealItems.length === 0}
          className="flex-[2] h-14 rounded-2xl bg-foreground text-background font-black text-base hover:bg-foreground/90 transition-all shadow-xl disabled:opacity-40"
        >
          Save & Log Meal
        </Button>
      </div>

      {/* Inline Search Overlay */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-0 bg-background z-[120] flex flex-col"
          >
            {/* Search Header */}
            <div className="flex items-center gap-3 px-4 pt-4 pb-2">
              <button
                onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
              >
                <ArrowLeft size={22} className="text-foreground" />
              </button>
              <h1 className="text-lg font-black text-foreground tracking-tight">Add Item</h1>
            </div>

            {/* Search Input */}
            <div className="px-4 py-3">
              <div className="flex items-center bg-muted/50 border border-border rounded-2xl px-4 py-3 gap-3 focus-within:ring-2 focus-within:ring-foreground/20 transition-all">
                <Search size={18} className="text-muted-foreground flex-shrink-0" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search foods..."
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

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto px-4 pb-8">
              {!searchQuery.trim() && (
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Popular Items</p>
              )}
              <div className="space-y-2">
                {searchResults.map(food => (
                  <motion.button
                    key={food.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addItem(food)}
                    className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-2xl hover:shadow-md transition-all group text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{food.name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Flame size={12} className="text-muted-foreground/50" />
                        <span className="text-xs text-muted-foreground">
                          {food.calories} cal · {food.servingSize}
                        </span>
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-full border-2 border-border flex items-center justify-center text-muted-foreground group-hover:border-foreground group-hover:text-foreground transition-colors flex-shrink-0 ml-3">
                      <Plus size={18} strokeWidth={2.5} />
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

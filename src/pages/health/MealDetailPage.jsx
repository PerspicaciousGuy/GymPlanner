import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Trash2,
  Pencil,
  Flame,
  Zap,
  Droplet,
  Cookie,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  calculateMealNutrition,
  saveMeal,
  deleteMeal,
  getSavedMeals,
  searchFoods,
  DEFAULT_FOODS,
} from '../../utils/foodDatabase';

/**
 * MealDetailPage — View / Edit a saved meal.
 * Shows total nutrition, item list, and supports editing.
 */
export default function MealDetailPage({
  meal,
  onBack,
  onAddItems,
  onDone,
  onLogMeal,
  onDeleteMeal,
}) {
  const [mealName, setMealName] = useState(meal?.name || 'Unnamed Meal');
  const [editingName, setEditingName] = useState(false);
  const [items, setItems] = useState(meal?.items || []);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);

  // Total nutrition across all items
  const totals = useMemo(() => {
    return calculateMealNutrition(items);
  }, [items]);

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
    // Add default with 1 serving
    setItems(prev => [...prev, { food, servings: 1 }]);
    setShowSearch(false);
    setSearchQuery('');
  };

  const handleRemoveItem = (idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateServings = (index, delta) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const currentServings = item.servings || 1;
      const newServings = Math.max(0.5, currentServings + delta);
      return { ...item, servings: newServings };
    }));
  };

  const handleDeleteMeal = () => {
    if (meal?.id) {
      deleteMeal(meal.id);
    }
    onDeleteMeal?.();
  };

  const handleDone = () => {
    // Update the saved meal with any changes
    if (meal?.id) {
      // Delete old and save updated
      deleteMeal(meal.id);
    }
    const updatedMeal = saveMeal({
      ...meal,
      id: meal?.id, // saveMeal will regenerate if undefined
      name: mealName || 'Unnamed Meal',
      items,
    });
    onDone?.(updatedMeal);
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
        <h1 className="text-lg font-black text-foreground tracking-tight">Edit Meal</h1>
        <button
          onClick={handleDeleteMeal}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-500/10 transition-colors"
        >
          <Trash2 size={20} className="text-muted-foreground hover:text-red-500" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {/* Meal Name */}
        <div className="mt-4 mb-6">
          {editingName ? (
            <div className="flex items-center gap-3 bg-muted/40 border border-border rounded-xl px-4 py-3">
              <input
                autoFocus
                type="text"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
                className="flex-1 text-lg font-black text-foreground bg-transparent outline-none"
                placeholder="Meal name"
              />
            </div>
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="w-full flex items-center justify-between bg-muted/40 border border-border rounded-xl px-4 py-3 group"
            >
              <span className="text-lg font-black text-foreground">{mealName}</span>
              <Pencil size={16} className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
            </button>
          )}
        </div>

        {/* Calories Card */}
        <Card className="rounded-2xl border border-border shadow-sm mb-4">
          <CardContent className="py-0.5 px-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Flame size={20} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Calories</p>
              <p className="text-2xl font-black text-foreground leading-none">{Math.round(totals.calories)}</p>
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
            <Card key={macro.key} className="rounded-xl border border-border shadow-sm">
              <CardContent className="p-0.5 px-4 flex flex-col items-start gap-1">
                <div className="flex items-center gap-1.5">
                  <macro.icon size={12} className={macro.color} />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{macro.label}</span>
                </div>
                <span className="text-lg font-black text-foreground">{Math.round(totals[macro.key])}g</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Meal Items */}
        <h3 className="text-base font-black text-foreground tracking-tight mb-4">
          Meal Items
        </h3>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm font-bold text-muted-foreground">No items yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Tap below to add foods to this meal</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {items.map((item, idx) => {
                const currentServings = item.servings || 1;
                return (
                  <motion.div
                    key={`${item.food?.id}-${idx}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{item.food?.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Flame size={12} className="text-muted-foreground/80" />
                        <span className="text-xs font-medium text-foreground">
                          {Math.round((item.food?.calories || 0) * currentServings)} cal
                        </span>
                      </div>
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
                          defaultValue={currentServings}
                          onBlur={(e) => {
                             const val = parseFloat(e.target.value) || 0.5;
                             setItems(prev => prev.map((it, i) => i === idx ? { ...it, servings: Math.max(0.1, val) } : it));
                             setEditingIndex(null);
                          }}
                          onKeyDown={(e) => {
                             if (e.key === 'Enter') {
                                 const val = parseFloat(e.target.value) || 0.5;
                                 setItems(prev => prev.map((it, i) => i === idx ? { ...it, servings: Math.max(0.1, val) } : it));
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
                            {currentServings}
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
                      onClick={() => handleRemoveItem(idx)}
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
          className="w-full mt-4 mb-2 flex items-center justify-center gap-2 py-3.5 border border-border rounded-full hover:bg-muted/30 transition-all text-foreground"
        >
          <Plus size={18} strokeWidth={2} />
          <span className="text-sm font-medium">Add items to this meal</span>
        </button>
      </div>

      {/* Bottom Action Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 py-4 z-[111] flex gap-3 bg-background/90 backdrop-blur-md border-t border-border"
      >
        <Button
          variant="outline"
          onClick={handleDone}
          className="flex-1 h-14 rounded-2xl font-black text-base transition-all border-2 border-border"
        >
          Save Details
        </Button>
        <Button
          onClick={() => {
            if (meal?.id) {
              const updatedMeal = saveMeal({
                ...meal,
                name: mealName || 'Unnamed Meal',
                items,
              });
              onDone?.(updatedMeal);
            }
            if (onLogMeal && items.length > 0) {
               onLogMeal();
            }
          }}
          disabled={items.length === 0}
          className="flex-[2] h-14 rounded-2xl bg-foreground text-background font-black text-base hover:bg-foreground/90 transition-all shadow-xl disabled:opacity-50"
        >
          Log Meal ({items.length} items)
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

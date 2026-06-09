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
import {
  calculateMealNutrition,
  saveMeal,
  deleteMeal,
} from '../../utils/foodDatabase';
import {
  adjustMealItemServings,
  getMealSearchResults,
  setMealItemServings,
} from './mealPageHelpers';

/**
 * MealDetailPage - View / Edit a saved meal.
 * Shows total nutrition, item list, and supports editing.
 */
export default function MealDetailPage({
  meal,
  onBack,
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
    return getMealSearchResults(searchQuery);
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
    setItems(prev => adjustMealItemServings(prev, index, delta));
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
      className="fixed inset-0 z-[110] flex flex-col bg-[var(--app-bg)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--app-border)] bg-[var(--app-surface)] px-4 pb-3 pt-4 shadow-[var(--app-shadow-sm)]">
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-[var(--app-radius-md)] text-muted-foreground transition-colors hover:bg-[var(--app-surface-muted)] hover:text-foreground"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-semibold tracking-normal text-foreground">Edit Meal</h1>
        <button
          onClick={handleDeleteMeal}
          className="flex h-10 w-10 items-center justify-center rounded-[var(--app-radius-md)] text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {/* Meal Name */}
        <div className="mt-4 mb-6">
          {editingName ? (
            <div className="flex items-center gap-3 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 shadow-[var(--app-shadow-sm)]">
              <input
                autoFocus
                type="text"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
                className="flex-1 bg-transparent text-lg font-semibold text-foreground outline-none"
                placeholder="Meal name"
              />
            </div>
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="group flex w-full items-center justify-between rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 shadow-[var(--app-shadow-sm)]"
            >
              <span className="text-lg font-semibold text-foreground">{mealName}</span>
              <Pencil size={16} className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
            </button>
          )}
        </div>

        {/* Calories Card */}
        <Card className="mb-4 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--app-shadow-sm)]">
          <CardContent className="py-0.5 px-5 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--app-radius-md)] bg-[var(--app-surface-muted)]">
              <Flame size={20} className="text-muted-foreground" />
            </div>
            <div>
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">Calories</p>
              <p className="text-2xl font-semibold leading-none text-foreground">{Math.round(totals.calories)}</p>
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
            <Card key={macro.key} className="rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--app-shadow-sm)]">
              <CardContent className="p-0.5 px-4 flex flex-col items-start gap-1">
                <div className="flex items-center gap-1.5">
                  <macro.icon size={12} className={macro.color} />
                  <span className="text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">{macro.label}</span>
                </div>
                <span className="text-lg font-semibold text-foreground">{Math.round(totals[macro.key])}g</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Meal Items */}
        <h3 className="mb-4 text-base font-semibold tracking-normal text-foreground">
          Meal Items
        </h3>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm font-semibold text-muted-foreground">No items yet</p>
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
                    className="flex items-center gap-3 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-[var(--app-shadow-sm)]"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{item.food?.name}</p>
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
                        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[var(--app-radius-sm)] border border-[var(--app-border)] text-xs font-semibold text-muted-foreground hover:text-foreground"
                      >
                        -
                      </button>
                      {editingIndex === idx ? (
                        <input
                          autoFocus
                          type="number"
                          step="any"
                          defaultValue={currentServings}
                          onBlur={(e) => {
                             const val = parseFloat(e.target.value) || 0.5;
                             setItems(prev => setMealItemServings(prev, idx, val));
                             setEditingIndex(null);
                          }}
                          onKeyDown={(e) => {
                             if (e.key === 'Enter') {
                                 const val = parseFloat(e.target.value) || 0.5;
                                 setItems(prev => setMealItemServings(prev, idx, val));
                                 setEditingIndex(null);
                             }
                          }}
                          className="w-10 border-b-2 border-foreground bg-transparent text-center text-xs font-semibold text-foreground outline-none"
                        />
                      ) : (
                        <span 
                          onClick={() => setEditingIndex(idx)}
                          className="w-10 cursor-pointer text-center text-xs font-semibold text-foreground hover:text-muted-foreground"
                        >
                            {currentServings}
                        </span>
                      )}
                      <button
                        onClick={() => updateServings(idx, 0.5)}
                        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[var(--app-radius-sm)] border border-[var(--app-border)] text-xs font-semibold text-muted-foreground hover:text-foreground"
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
          className="mb-2 mt-4 flex w-full items-center justify-center gap-2 rounded-[var(--app-radius-md)] border border-dashed border-[var(--app-border)] py-3.5 text-foreground transition-colors hover:bg-[var(--app-surface-muted)]"
        >
          <Plus size={18} strokeWidth={2} />
          <span className="text-sm font-medium">Add items to this meal</span>
        </button>
      </div>

      {/* Bottom Action Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[111] flex gap-3 border-t border-[var(--app-border)] bg-[var(--app-surface)]/90 px-4 py-4 backdrop-blur-md"
      >
        <Button
          variant="outline"
          onClick={handleDone}
          className="h-14 flex-1 rounded-[var(--app-radius-md)] border border-[var(--app-border)] text-base font-semibold transition-colors"
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
          className="h-14 flex-[2] rounded-[var(--app-radius-md)] bg-foreground text-base font-semibold text-background shadow-[var(--app-shadow-md)] transition-colors hover:bg-foreground/90 disabled:opacity-50"
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
            className="fixed inset-0 z-[120] flex flex-col bg-[var(--app-bg)]"
          >
            {/* Search Header */}
            <div className="flex items-center gap-3 px-4 pt-4 pb-2">
              <button
                onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                className="flex h-10 w-10 items-center justify-center rounded-[var(--app-radius-md)] text-muted-foreground transition-colors hover:bg-[var(--app-surface-muted)] hover:text-foreground"
              >
                <ArrowLeft size={22} className="text-foreground" />
              </button>
              <h1 className="text-lg font-semibold tracking-normal text-foreground">Add Item</h1>
            </div>

            {/* Search Input */}
            <div className="px-4 py-3">
              <div className="flex items-center gap-3 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 shadow-[var(--app-shadow-sm)] transition-colors focus-within:border-[var(--app-border-strong)]">
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
                <p className="mb-3 text-xs font-semibold uppercase tracking-normal text-muted-foreground">Popular Items</p>
              )}
              <div className="space-y-2">
                {searchResults.map(food => (
                  <motion.button
                    key={food.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addItem(food)}
                    className="group flex w-full items-center justify-between rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 text-left shadow-[var(--app-shadow-sm)] transition-colors hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface-raised)]"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{food.name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Flame size={12} className="text-muted-foreground/50" />
                        <span className="text-xs text-muted-foreground">
                          {food.calories} cal - {food.servingSize}
                        </span>
                      </div>
                    </div>
                    <div className="ml-3 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[var(--app-radius-md)] border border-[var(--app-border)] text-muted-foreground transition-colors group-hover:border-[var(--app-border-strong)] group-hover:text-foreground">
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

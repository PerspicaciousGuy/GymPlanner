import { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  MoreVertical,
  Bookmark,
  BookmarkCheck,
  Minus,
  Plus,
  Flame,
  Pencil,
  Zap,
  Droplet,
  Cookie,
  Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  calculateNutrition,
  toggleBookmark,
  isBookmarked as checkBookmarked,
  SERVING_UNITS,
  saveCustomFood,
} from '../../utils/foodDatabase';


// Micro nutrient display config
const MICRO_NUTRIENTS = [
  { key: 'saturatedFat', label: 'Saturated Fat', unit: 'g' },
  { key: 'polyunsaturatedFat', label: 'Polyunsaturated Fat', unit: 'g' },
  { key: 'monounsaturatedFat', label: 'Monounsaturated Fat', unit: 'g' },
  { key: 'cholesterol', label: 'Cholesterol', unit: 'mg' },
  { key: 'sodium', label: 'Sodium', unit: 'mg' },
  { key: 'fiber', label: 'Fiber', unit: 'g' },
  { key: 'sugar', label: 'Sugar', unit: 'g' },
  { key: 'potassium', label: 'Potassium', unit: 'mg' },
  { key: 'vitaminA', label: 'Vitamin A', unit: 'μg' },
  { key: 'vitaminC', label: 'Vitamin C', unit: 'mg' },
  { key: 'calcium', label: 'Calcium', unit: 'mg' },
  { key: 'iron', label: 'Iron', unit: 'mg' },
];

/**
 * FoodDetailPage — Nutrition detail / editing screen.
 * If `food` is null, acts as a "Manual Add" blank form.
 */
export default function FoodDetailPage({ food, onBack, onSave, dateKey }) {
  const isManual = !food;

  // Editable state
  const [name, setName] = useState(food?.name || '');
  const [servings, setServings] = useState(1);
  const [gramAmount, setGramAmount] = useState(food?.servingGrams || 100);
  const [editingGrams, setEditingGrams] = useState(false);
  const [editingServings, setEditingServings] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(
    food?.availableUnits?.[0] || SERVING_UNITS.SERVING
  );
  const [bookmarked, setBookmarked] = useState(
    food ? checkBookmarked(food.id) : false
  );
  const [editingField, setEditingField] = useState(null);

  // For manual entry, allow free-form macro editing
  const [manualValues, setManualValues] = useState({
    calories: food?.calories || 0,
    protein: food?.protein || 0,
    carbs: food?.carbs || 0,
    fats: food?.fats || 0,
    saturatedFat: food?.saturatedFat || 0,
    polyunsaturatedFat: food?.polyunsaturatedFat || 0,
    monounsaturatedFat: food?.monounsaturatedFat || 0,
    cholesterol: food?.cholesterol || 0,
    sodium: food?.sodium || 0,
    fiber: food?.fiber || 0,
    sugar: food?.sugar || 0,
    potassium: food?.potassium || 0,
    vitaminA: food?.vitaminA || 0,
    vitaminC: food?.vitaminC || 0,
    calcium: food?.calcium || 0,
    iron: food?.iron || 0,
    ingredients: food?.ingredients || '',
  });



  const activeFood = food;

  // Are we in gram mode?
  const isGramMode = selectedUnit === SERVING_UNITS.GRAM;

  // The effective multiplier for nutrition scaling
  const effectiveServings = useMemo(() => {
    if (isGramMode && activeFood?.servingGrams) {
      return gramAmount / activeFood.servingGrams;
    }
    return servings;
  }, [isGramMode, gramAmount, activeFood, servings]);

  // Calculated nutrition (for database foods, scale by servings)
  const nutrition = useMemo(() => {
    if (isManual) {
      const result = {};
      Object.keys(manualValues).forEach(k => {
        result[k] = Math.round(manualValues[k] * effectiveServings * 10) / 10;
      });
      return result;
    }
    return calculateNutrition(activeFood, effectiveServings);
  }, [activeFood, effectiveServings, isManual, manualValues]);

  const availableUnits = activeFood?.availableUnits || [SERVING_UNITS.SERVING, SERVING_UNITS.GRAM];

  const handleBookmark = () => {
    if (food) {
      toggleBookmark(food.id);
      setBookmarked(!bookmarked);
    }
  };

  const handleManualValueChange = (key, value) => {
    setManualValues(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
    setEditingField(null);
  };

  const handleSave = () => {
    let finalFood = activeFood;
    
    if (isManual) {
      finalFood = {
        id: `custom_${Date.now()}`, // Save as custom
        name: name || 'Unnamed Food',
        calories: manualValues.calories,
        protein: manualValues.protein,
        carbs: manualValues.carbs,
        fats: manualValues.fats,
        saturatedFat: manualValues.saturatedFat,
        polyunsaturatedFat: manualValues.polyunsaturatedFat,
        monounsaturatedFat: manualValues.monounsaturatedFat,
        cholesterol: manualValues.cholesterol,
        sodium: manualValues.sodium,
        fiber: manualValues.fiber,
        sugar: manualValues.sugar,
        potassium: manualValues.potassium,
        vitaminA: manualValues.vitaminA,
        vitaminC: manualValues.vitaminC,
        calcium: manualValues.calcium,
        iron: manualValues.iron,
        ingredients: manualValues.ingredients, 
        isManual: true,
        servingSize: '1 serving',
        servingGrams: 100,
      };
      
      // Persist to user's "My Foods" library
      saveCustomFood(finalFood);
    }

    const entry = {
      food: finalFood,
      servings: effectiveServings,
    };
    onSave(entry);
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
        <h1 className="text-lg font-black text-foreground tracking-tight">
          {isManual ? 'Manual Add' : 'Nutrition'}
        </h1>
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
          <MoreVertical size={20} className="text-muted-foreground" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {/* Food Name + Bookmark */}
        <div className="flex items-start justify-between mt-4 mb-2">
          {editingField === 'name' || isManual ? (
            <input
              autoFocus={editingField === 'name'}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setEditingField(null)}
              placeholder="Tap to name"
              className="text-2xl font-black text-foreground tracking-tight bg-transparent outline-none border-b-2 border-foreground/20 focus:border-foreground pb-1 flex-1 mr-4"
            />
          ) : (
            <button
              onClick={() => setEditingField('name')}
              className="text-2xl font-black text-foreground tracking-tight text-left flex-1 mr-4"
            >
              {name || 'Tap to name'}
            </button>
          )}
          {!isManual && (
            <button
              onClick={handleBookmark}
              className="mt-1 p-1"
            >
              {bookmarked ? (
                <BookmarkCheck size={24} className="text-foreground fill-foreground" />
              ) : (
                <Bookmark size={24} className="text-muted-foreground" />
              )}
            </button>
          )}
        </div>

        {/* Serving Size Measurement */}
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
          Serving Size Measurement
        </p>
        <div className="flex gap-2 mb-6">
          {availableUnits.map(unit => (
            <button
              key={unit}
              onClick={() => setSelectedUnit(unit)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold border-2 transition-all capitalize",
                selectedUnit === unit
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/30"
              )}
            >
              {unit}
            </button>
          ))}
        </div>

        {/* Serving Amount */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm font-bold text-foreground">
              {isGramMode ? 'Amount (grams)' : 'Serving Amount'}
            </p>
            {isGramMode && activeFood?.servingSize && (
              <p className="text-[10px] font-medium text-muted-foreground mt-0.5">
                1 serving = {activeFood.servingGrams}g ({activeFood.servingSize})
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (isGramMode) {
                  setGramAmount(prev => Math.max(1, prev - 10));
                } else {
                  setServings(prev => Math.max(0.5, prev - 0.5));
                }
              }}
              className="w-10 h-10 rounded-full border-2 border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
            >
              <Minus size={18} strokeWidth={2.5} />
            </button>
            {isGramMode ? (
              editingGrams ? (
                <input
                  autoFocus
                  type="number"
                  defaultValue={gramAmount}
                  onBlur={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setGramAmount(Math.max(1, val));
                    setEditingGrams(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = parseInt(e.target.value) || 1;
                      setGramAmount(Math.max(1, val));
                      setEditingGrams(false);
                    }
                  }}
                  className="text-xl font-black text-foreground w-16 text-center bg-transparent outline-none border-b-2 border-foreground"
                />
              ) : (
                <button
                  onClick={() => setEditingGrams(true)}
                  className="text-xl font-black text-foreground min-w-[3rem] text-center"
                >
                  {gramAmount}<span className="text-xs text-muted-foreground ml-0.5">g</span>
                </button>
              )
            ) : (
              editingServings ? (
                <input
                  autoFocus
                  type="number"
                  step="any"
                  defaultValue={servings}
                  onBlur={(e) => {
                    const val = parseFloat(e.target.value) || 0.5;
                    setServings(Math.max(0.1, val));
                    setEditingServings(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = parseFloat(e.target.value) || 0.5;
                      setServings(Math.max(0.1, val));
                      setEditingServings(false);
                    }
                  }}
                  className="text-xl font-black text-foreground w-16 text-center bg-transparent outline-none border-b-2 border-foreground"
                />
              ) : (
                <button
                  onClick={() => setEditingServings(true)}
                  className="text-xl font-black text-foreground min-w-[3rem] text-center"
                >
                  {servings}
                </button>
              )
            )}
            <button
              onClick={() => {
                if (isGramMode) {
                  setGramAmount(prev => prev + 10);
                } else {
                  setServings(prev => prev + 0.5);
                }
              }}
              className="w-10 h-10 rounded-full border-2 border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
            >
              <Plus size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Calories Card */}
        <Card className="rounded-2xl border border-border shadow-sm mb-4">
          <CardContent className="py-2.5 px-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Flame size={20} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Calories</p>
                {editingField === 'calories' ? (
                  <input
                    autoFocus
                    type="number"
                    defaultValue={isManual ? manualValues.calories : food?.calories || 0}
                    onBlur={(e) => handleManualValueChange('calories', e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualValueChange('calories', e.target.value)}
                    className="text-2xl font-black text-foreground bg-transparent outline-none border-b-2 border-foreground w-24 leading-none"
                  />
                ) : (
                  <p className="text-2xl font-black text-foreground leading-none">{nutrition.calories}</p>
                )}
              </div>
            </div>
            {(isManual || food) && (
              <button
                onClick={() => setEditingField('calories')}
                className="p-2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              >
                <Pencil size={16} />
              </button>
            )}
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
              <CardContent className="p-3 flex flex-col items-start gap-1">
                <div className="flex items-center gap-1.5">
                  <macro.icon size={12} className={macro.color} />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{macro.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  {editingField === macro.key ? (
                    <input
                      autoFocus
                      type="number"
                      defaultValue={isManual ? manualValues[macro.key] : food?.[macro.key] || 0}
                      onBlur={(e) => handleManualValueChange(macro.key, e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleManualValueChange(macro.key, e.target.value)}
                      className="text-lg font-black text-foreground bg-transparent outline-none border-b-2 border-foreground w-12"
                    />
                  ) : (
                    <span className="text-lg font-black text-foreground">{nutrition[macro.key]}g</span>
                  )}
                  <button
                    onClick={() => setEditingField(macro.key)}
                    className="p-0.5 text-muted-foreground/30 hover:text-muted-foreground"
                  >
                    <Pencil size={10} />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Ingredients section for manual entry */}
        {isManual && (
          <div className="mb-8">
            <h3 className="text-base font-black text-foreground tracking-tight mb-4 flex items-center justify-between">
              Ingredients
              <span className="text-[10px] text-muted-foreground font-normal tracking-normal uppercase">Optional</span>
            </h3>
            <textarea
              placeholder="e.g. 2 eggs, 1 slice cheese, 1 cup spinach..."
              value={manualValues.ingredients || ''}
              onChange={(e) => setManualValues(prev => ({ ...prev, ingredients: e.target.value }))}
              className="w-full min-h-[100px] p-4 bg-muted/30 border border-border rounded-2xl text-sm font-medium text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 resize-none transition-all"
            />
          </div>
        )}

        {/* Other Nutrition Facts */}
        <h3 className="text-base font-black text-foreground tracking-tight mb-4">
          Other nutrition facts
        </h3>
        <div className="space-y-0">
          {MICRO_NUTRIENTS.map((micro, idx) => (
            <div
              key={micro.key}
              className={cn(
                "flex items-center justify-between py-4 px-1",
                idx < MICRO_NUTRIENTS.length - 1 && "border-b border-border/50"
              )}
            >
              <span className="text-sm text-foreground font-medium">{micro.label}</span>
              <div className="flex items-center gap-2">
                {editingField === micro.key ? (
                  <div className="flex items-center">
                    <input
                      autoFocus
                      type="number"
                      step="any"
                      defaultValue={isManual ? manualValues[micro.key] : activeFood?.[micro.key] || 0}
                      onBlur={(e) => handleManualValueChange(micro.key, e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleManualValueChange(micro.key, e.target.value)}
                      className="text-sm font-bold text-foreground bg-transparent outline-none border-b border-foreground w-16 text-right appearance-none"
                    />
                    <span className="text-sm font-bold text-foreground ml-1">{micro.unit}</span>
                  </div>
                ) : (
                  <span className="text-sm font-bold text-foreground">
                    {nutrition[micro.key] || 0}{micro.unit}
                  </span>
                )}
                
                {/* Always allow editing for manual input */}
                {(isManual || food) && (
                  <button
                    onClick={() => setEditingField(micro.key)}
                    className="p-1 text-muted-foreground/30 hover:text-muted-foreground transition-colors ml-1"
                  >
                    <Pencil size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 py-4 z-[111]"
        style={{
          background: 'linear-gradient(to top, var(--background) 60%, transparent)',
        }}
      >
        <Button
          onClick={handleSave}
          disabled={isManual && !name.trim()}
          className="w-full h-14 rounded-2xl bg-foreground text-background font-black text-base hover:bg-foreground/90 transition-all shadow-xl disabled:opacity-40"
        >
          Save
        </Button>
      </div>
    </motion.div>
  );
}

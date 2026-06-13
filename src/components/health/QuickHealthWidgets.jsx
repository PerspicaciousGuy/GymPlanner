import { useState, useEffect } from 'react';
import { Scale, GlassWater, Plus, Minus, PencilLine } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { getToday, formatDateKey } from '../../utils/dateUtils';
import { getWeightForDate, getWaterForDate, logWeight, logWater } from '../../utils/vitalsDatabase';

export default function QuickHealthWidgets() {
  const [todayWeight, setTodayWeight] = useState(null);
  const [todayWater, setTodayWater] = useState(0);
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [weightInputValue, setWeightInputValue] = useState('');

  const todayKey = formatDateKey(getToday());

  useEffect(() => {
    setTodayWeight(getWeightForDate(todayKey));
    setTodayWater(getWaterForDate(todayKey));
  }, [todayKey]);

  const handleWeightSubmit = (e) => {
    e.preventDefault();
    const w = parseFloat(weightInputValue);
    if (!isNaN(w) && w > 0) {
      logWeight(todayKey, w);
      setTodayWeight(w);
      setShowWeightInput(false);
      setWeightInputValue('');
    }
  };

  const adjustWater = (amount) => {
    const newTotal = logWater(todayKey, amount);
    setTodayWater(newTotal);
  };

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {/* Weight Widget */}
      <Card className="overflow-hidden rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--app-shadow-sm)] transition-[box-shadow,border-color] duration-300 hover:border-[var(--app-border-strong)] hover:shadow-[var(--app-shadow-md)]">
        <CardContent className="p-3 md:p-4 h-full flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-accent-soft)] text-foreground">
              <Scale size={16} strokeWidth={2.5} />
            </div>
            <p className="text-[9px] font-semibold uppercase leading-none tracking-normal text-muted-foreground">Weight</p>
          </div>
          
          <div className="flex items-end justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold leading-none tracking-normal text-foreground md:text-xl">
                {todayWeight ? `${todayWeight}` : '0'}
                <span className="ml-0.5 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">kg</span>
              </h3>
            </div>

            <AnimatePresence mode="wait">
              {!showWeightInput ? (
                <motion.button
                  key="log-btn"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => {
                    setShowWeightInput(true);
                    setWeightInputValue(todayWeight?.toString() || '');
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-[var(--app-radius-md)] bg-foreground text-background shadow-[var(--app-shadow-sm)] transition-transform hover:bg-foreground/90 active:scale-95 md:h-10 md:w-10"
                >
                  {todayWeight ? (
                    <PencilLine size={16} strokeWidth={2.5} />
                  ) : (
                    <Plus size={16} strokeWidth={3} />
                  )}
                </motion.button>
              ) : (
                <motion.form
                  key="weight-form"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  onSubmit={handleWeightSubmit}
                  className="flex items-center gap-1 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-1"
                >
                  <input
                    type="number"
                    step="0.1"
                    autoFocus
                    value={weightInputValue}
                    onChange={(e) => setWeightInputValue(e.target.value)}
                    className="w-10 bg-transparent text-center text-xs font-semibold text-foreground focus:outline-none"
                  />
                  <button type="submit" className="flex h-6 w-6 items-center justify-center rounded-[var(--app-radius-sm)] bg-foreground text-background">
                    <Plus size={14} strokeWidth={3} />
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Water Widget */}
      <Card className="overflow-hidden rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--app-shadow-sm)] transition-[box-shadow,border-color] duration-300 hover:border-[var(--app-border-strong)] hover:shadow-[var(--app-shadow-md)]">
        <CardContent className="p-3 md:p-4 h-full flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-accent-soft)] text-foreground">
              <GlassWater size={16} strokeWidth={2.5} />
            </div>
            <p className="text-[9px] font-semibold uppercase leading-none tracking-normal text-muted-foreground">Water</p>
          </div>

          <div className="flex items-end justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold leading-none tracking-normal text-foreground md:text-xl">
                {todayWater}
                <span className="ml-0.5 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">ml</span>
              </h3>
            </div>

            <div className="flex items-center gap-1.5 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-1">
              <button
                onClick={() => adjustWater(-250)}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--app-radius-sm)] text-muted-foreground transition-colors hover:bg-[var(--app-surface)] hover:text-foreground"
              >
                <Minus size={14} strokeWidth={3} />
              </button>
              <button
                onClick={() => adjustWater(250)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--app-radius-sm)] bg-foreground text-background shadow-[var(--app-shadow-sm)] transition-transform hover:bg-foreground/90 active:scale-95"
              >
                <Plus size={14} strokeWidth={3} />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

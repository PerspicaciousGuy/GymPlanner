import { useState } from 'react';
import { Plus, Scale, Utensils, Droplet, X, Minus, PencilLine } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { logWeight, logWater, getWeightForDate, getWaterForDate } from '../../utils/vitalsDatabase';
import { getToday } from '../../utils/dateUtils';

export default function QuickActionHub({ onNavigateToHealth }) {
  const [isOpen, setIsOpen] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [isWeightLogged, setIsWeightLogged] = useState(!!getWeightForDate(getToday()));
  const [waterAmount, setWaterAmount] = useState(getWaterForDate(getToday()));

  const handleWeightSubmit = (e) => {
    e.preventDefault();
    if (!weightInput) return;
    logWeight(getToday(), weightInput);
    setIsWeightLogged(true);
    setIsOpen(false);
    setWeightInput('');
  };

  const adjustWater = (amount) => {
    const newAmount = logWater(getToday(), amount);
    setWaterAmount(newAmount);
  };

  return (
    <>
      {/* FAB */}
      <div className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-[50]">
        <button
          onClick={() => {
            setIsWeightLogged(!!getWeightForDate(getToday()));
            setWaterAmount(getWaterForDate(getToday()));
            setIsOpen(true);
          }}
          className="group flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background shadow-[var(--app-shadow-md)] transition-transform hover:scale-105 active:scale-95 md:h-16 md:w-16"
        >
          <Plus size={28} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      {/* Sheet / Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[10000] bg-foreground/40 backdrop-blur-sm"
            />

            {/* Content Panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-[10001] mx-auto max-w-[500px] rounded-t-[var(--app-radius-lg)] border-t border-[var(--app-border)] bg-[var(--app-surface)] px-6 pb-10 pt-8 shadow-[var(--app-shadow-md)]"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-semibold tracking-normal text-foreground">Quick Log</h2>
                  <p className="text-sm font-medium text-muted-foreground">What are we tracking today?</p>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--app-surface-muted)] text-muted-foreground transition-colors hover:bg-[var(--app-surface-raised)] hover:text-foreground"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Meal Action */}
                <button
                  onClick={() => {
                    onNavigateToHealth('log-food');
                    setIsOpen(false);
                  }}
                  className="group flex w-full items-center gap-4 rounded-[var(--app-radius-md)] bg-foreground p-5 text-background shadow-[var(--app-shadow-sm)] transition-colors hover:bg-foreground/90"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--app-radius-md)] bg-background/15">
                    <Utensils size={24} />
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-semibold leading-none tracking-normal">Log a Meal</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-normal text-background/70">Macro Tracking</p>
                  </div>
                </button>

                {/* Weight Action */}
                <div className="flex flex-col gap-4 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] text-foreground shadow-[var(--app-shadow-sm)]">
                        <Scale size={24} />
                      </div>
                      <div className="text-left">
                        <p className="text-lg font-semibold leading-none tracking-normal text-foreground">Body Weight</p>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">
                          {isWeightLogged ? 'Already Logged Today' : 'Enter kilos'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleWeightSubmit} className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        step="0.1"
                        placeholder={getWeightForDate(getToday()) || "70.0"}
                        value={weightInput}
                        onChange={(e) => setWeightInput(e.target.value)}
                        className="h-14 w-full rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] px-6 text-lg font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--app-border-strong)]"
                      />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 font-semibold text-muted-foreground">kg</span>
                    </div>
                    <button 
                      type="submit"
                      disabled={!weightInput}
                      className="flex h-14 w-14 items-center justify-center rounded-[var(--app-radius-md)] bg-foreground text-background transition-colors disabled:opacity-50"
                    >
                      {isWeightLogged ? <PencilLine size={24} /> : <Plus size={24} strokeWidth={3} />}
                    </button>
                  </form>
                </div>

                {/* Water Action */}
                <div className="flex items-center justify-between gap-4 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] text-foreground shadow-[var(--app-shadow-sm)]">
                      <Droplet size={24} />
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-semibold leading-none tracking-normal text-foreground">Hydration</p>
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">{waterAmount} ml</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] p-1.5">
                    <button 
                      onClick={() => adjustWater(-250)}
                      className="flex h-10 w-10 items-center justify-center rounded-[var(--app-radius-sm)] text-muted-foreground transition-colors hover:bg-[var(--app-surface-muted)] hover:text-foreground"
                    >
                      <Minus size={20} strokeWidth={3} />
                    </button>
                    <button 
                      onClick={() => adjustWater(250)}
                      className="flex h-12 w-12 items-center justify-center rounded-[var(--app-radius-sm)] bg-foreground text-background shadow-[var(--app-shadow-sm)] transition-transform hover:bg-foreground/90 active:scale-95"
                    >
                      <Plus size={24} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

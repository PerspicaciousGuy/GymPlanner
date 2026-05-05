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
          className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-slate-900 text-white shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all group"
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
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[10000]"
            />

            {/* Content Panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] shadow-2xl z-[10001] pb-10 px-6 pt-8 max-w-[500px] mx-auto border-t border-slate-100"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Quick Log</h2>
                  <p className="text-sm font-bold text-slate-400">What are we tracking today?</p>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all"
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
                  className="w-full p-5 rounded-[2rem] bg-indigo-600 text-white flex items-center gap-4 hover:bg-indigo-700 transition-all group shadow-lg shadow-indigo-100"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                    <Utensils size={24} />
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-black tracking-tight leading-none">Log a Meal</p>
                    <p className="text-xs font-bold text-indigo-100 mt-1 uppercase tracking-widest">Macro Tracking</p>
                  </div>
                </button>

                {/* Weight Action */}
                <div className="p-5 rounded-[2rem] bg-slate-50 border border-slate-100 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-600 shadow-sm border border-slate-100">
                        <Scale size={24} />
                      </div>
                      <div className="text-left">
                        <p className="text-lg font-black tracking-tight leading-none">Body Weight</p>
                        <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">
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
                        className="w-full h-14 bg-white border border-slate-200 rounded-2xl px-6 font-black text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">kg</span>
                    </div>
                    <button 
                      type="submit"
                      disabled={!weightInput}
                      className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center disabled:opacity-50 transition-all"
                    >
                      {isWeightLogged ? <PencilLine size={24} /> : <Plus size={24} strokeWidth={3} />}
                    </button>
                  </form>
                </div>

                {/* Water Action */}
                <div className="p-5 rounded-[2rem] bg-blue-50 border border-blue-100 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-blue-500 shadow-sm border border-blue-100">
                      <Droplet size={24} />
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-black tracking-tight leading-none">Hydration</p>
                      <p className="text-[10px] font-black text-blue-400 mt-1 uppercase tracking-widest">{waterAmount} ml</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-white/50 p-1.5 rounded-2xl border border-blue-100">
                    <button 
                      onClick={() => adjustWater(-250)}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-blue-400 hover:bg-white transition-all"
                    >
                      <Minus size={20} strokeWidth={3} />
                    </button>
                    <button 
                      onClick={() => adjustWater(250)}
                      className="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-200 hover:bg-blue-600 active:scale-95 transition-all"
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

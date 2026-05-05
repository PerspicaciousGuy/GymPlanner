import { useState, useEffect } from 'react';
import { Scale, GlassWater, Plus, Minus, PencilLine } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { getToday, formatDateKey } from '../../utils/dateUtils';
import { getWeightForDate, getWaterForDate, logWeight, logWater, getLatestWeight } from '../../utils/vitalsDatabase';

export default function QuickHealthWidgets() {
  const [todayWeight, setTodayWeight] = useState(null);
  const [todayWater, setTodayWater] = useState(0);
  const [latestWeight, setLatestWeight] = useState(null);
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [weightInputValue, setWeightInputValue] = useState('');

  const todayKey = formatDateKey(getToday());

  useEffect(() => {
    setTodayWeight(getWeightForDate(todayKey));
    setTodayWater(getWaterForDate(todayKey));
    setLatestWeight(getLatestWeight());
  }, [todayKey]);

  const handleWeightSubmit = (e) => {
    e.preventDefault();
    const w = parseFloat(weightInputValue);
    if (!isNaN(w) && w > 0) {
      logWeight(todayKey, w);
      setTodayWeight(w);
      setLatestWeight(w);
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
      <Card className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        <CardContent className="p-3 md:p-4 h-full flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50/80 flex items-center justify-center text-indigo-600 border border-indigo-100/50 shrink-0">
              <Scale size={16} strokeWidth={2.5} />
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Weight</p>
          </div>
          
          <div className="flex items-end justify-between gap-2">
            <div>
              <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight leading-none">
                {todayWeight ? `${todayWeight}` : latestWeight ? `${latestWeight}` : '--'}
                <span className="text-[10px] ml-0.5 text-slate-400 font-bold uppercase tracking-wide">kg</span>
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
                    setWeightInputValue(todayWeight?.toString() || latestWeight?.toString() || '');
                  }}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-all shadow-sm"
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
                  className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200"
                >
                  <input
                    type="number"
                    step="0.1"
                    autoFocus
                    value={weightInputValue}
                    onChange={(e) => setWeightInputValue(e.target.value)}
                    className="w-10 bg-transparent text-xs font-black text-center focus:outline-none"
                  />
                  <button type="submit" className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                    <Plus size={14} strokeWidth={3} />
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Water Widget */}
      <Card className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        <CardContent className="p-3 md:p-4 h-full flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50/80 flex items-center justify-center text-blue-500 border border-blue-100/50 shrink-0">
              <GlassWater size={16} strokeWidth={2.5} />
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Water</p>
          </div>

          <div className="flex items-end justify-between gap-2">
            <div>
              <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight leading-none">
                {todayWater}
                <span className="text-[10px] ml-0.5 text-slate-400 font-bold uppercase tracking-wide">ml</span>
              </h3>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-200">
              <button
                onClick={() => adjustWater(-250)}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-white transition-all shrink-0"
              >
                <Minus size={14} strokeWidth={3} />
              </button>
              <button
                onClick={() => adjustWater(250)}
                className="w-7 h-7 rounded-lg bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 active:scale-95 transition-all shadow-sm shrink-0"
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

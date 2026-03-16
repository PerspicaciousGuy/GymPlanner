import { Minus, Plus } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export function Stepper({ value, onChange, placeholder = "0", className, step = 1, min = 0 }) {
  const numValue = parseFloat(value) || 0;

  const handleMinus = (e) => {
    e.stopPropagation();
    const next = Math.max(min, numValue - step);
    onChange(String(next));
  };

  const handlePlus = (e) => {
    e.stopPropagation();
    const next = numValue + step;
    onChange(String(next));
  };

  return (
    <div className={cn("flex items-stretch bg-slate-50 border border-slate-100 rounded-xl overflow-hidden shadow-sm", className)}>
      <Button
        variant="ghost"
        size="icon"
        className="h-full rounded-none px-3 text-slate-400 hover:text-red-500 hover:bg-slate-100 border-r border-slate-100"
        onClick={handleMinus}
        tabIndex={-1}
      >
        <Minus size={14} strokeWidth={3} />
      </Button>
      
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white text-center text-sm font-black text-indigo-600 outline-none px-1"
      />

      <Button
        variant="ghost"
        size="icon"
        className="h-full rounded-none px-3 text-slate-400 hover:text-emerald-500 hover:bg-slate-100 border-l border-slate-100"
        onClick={handlePlus}
        tabIndex={-1}
      >
        <Plus size={14} strokeWidth={3} />
      </Button>
    </div>
  );
}

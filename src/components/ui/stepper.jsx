import { Minus, Plus } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export function Stepper({ value, onChange, placeholder = "0", className, step = 1, min = 0 }) {
  const parseParts = (val) => {
    const s = String(val || "");
    const match = s.match(/^([\d.]+)?(\s*.*)$/);
    return {
      num: parseFloat(match?.[1]) || 0,
      suffix: match?.[2] || ""
    };
  };

  const handleMinus = (e) => {
    e.stopPropagation();
    const { num, suffix } = parseParts(value);
    const next = Math.max(min, num - step);
    const out = suffix ? `${next}${suffix}` : String(next);
    onChange(out);
  };

  const handlePlus = (e) => {
    e.stopPropagation();
    const { num, suffix } = parseParts(value);
    const next = num + step;
    const out = suffix ? `${next}${suffix}` : String(next);
    onChange(out);
  };

  return (
    <div className={cn("flex items-stretch bg-secondary border border-border rounded-xl overflow-hidden shadow-sm", className)}>
      <Button
        variant="ghost"
        size="icon"
        className="h-full rounded-none px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-r border-border"
        onClick={handleMinus}
        tabIndex={-1}
      >
        <Minus size={14} strokeWidth={3} />
      </Button>
      
      <input
        type="text"
        inputMode="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-center text-sm font-black text-primary outline-none px-1"
      />

      <Button
        variant="ghost"
        size="icon"
        className="h-full rounded-none px-3 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 border-l border-border"
        onClick={handlePlus}
        tabIndex={-1}
      >
        <Plus size={14} strokeWidth={3} />
      </Button>
    </div>
  );
}

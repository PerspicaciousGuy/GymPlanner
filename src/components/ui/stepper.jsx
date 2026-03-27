import { cn } from '@/lib/utils';

export function Stepper({ value, onChange, placeholder = "0", className }) {
  return (
    <div className={cn("flex items-stretch bg-secondary border border-border rounded-xl overflow-hidden shadow-sm", className)}>
      <input
        type="text"
        inputMode="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-center text-[13px] font-black text-primary outline-none px-3 h-10"
      />
    </div>
  );
}

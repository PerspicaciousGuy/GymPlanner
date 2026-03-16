import { useMemo } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Simplified SVG Paths for Human Muscle Groups
// FRONT VIEW
const FRONT_MUSCLE_PATHS = {
  neck: "M 92,20 Q 100,22 108,20 L 108,28 Q 100,32 92,28 Z",
  shoulders: "M 65,30 Q 75,25 90,30 L 92,45 Q 75,45 65,40 Z M 135,30 Q 125,25 110,30 L 108,45 Q 125,45 135,40 Z",
  chest: "M 92,45 Q 100,42 108,45 L 120,50 L 122,75 Q 100,85 78,75 L 80,50 Z",
  abs: "M 85,80 L 115,80 L 118,125 Q 100,135 82,125 Z",
  quads: "M 70,135 Q 85,130 98,135 L 100,195 Q 85,205 72,195 Z M 130,135 Q 115,130 102,135 L 100,195 Q 115,205 128,195 Z",
  biceps: "M 55,42 Q 62,40 70,55 L 65,85 Q 55,80 50,70 Z M 145,42 Q 138,40 130,55 L 135,85 Q 145,80 150,70 Z",
  forearms: "M 48,80 L 62,90 L 58,135 L 42,125 Z M 152,80 L 138,90 L 142,135 L 158,125 Z",
  calves: "M 75,210 Q 85,205 95,210 L 92,260 Q 85,265 78,260 Z M 125,210 Q 115,205 105,210 L 108,260 Q 115,265 122,260 Z"
};

// BACK VIEW
const BACK_MUSCLE_PATHS = {
  traps: "M 90,28 Q 100,25 110,28 L 120,40 Q 100,50 80,40 Z",
  lats: "M 78,45 L 122,45 L 125,120 Q 100,130 75,120 Z",
  triceps: "M 52,45 Q 60,40 70,55 L 68,90 Q 58,85 52,75 Z M 148,45 Q 140,40 130,55 L 132,90 Q 142,85 148,75 Z",
  glutes: "M 82,125 Q 100,120 118,125 L 120,155 Q 100,165 80,155 Z",
  hamstrings: "M 72,160 Q 85,155 98,160 L 98,215 Q 85,220 72,215 Z M 128,160 Q 115,155 102,160 L 102,215 Q 115,220 128,215 Z"
};

// Map terminology to our SVG segments
const MUSCLE_GROUP_MAP = {
  'Chest': ['chest'],
  'Back': ['lats', 'traps'],
  'Shoulders': ['shoulders'],
  'Legs': ['quads', 'hamstrings', 'glutes', 'calves'],
  'Arms': ['biceps', 'triceps', 'forearms'],
  'Abs': ['abs'],
  'Core': ['abs'],
  'Quads': ['quads'],
  'Hamstrings': ['hamstrings'],
  'Glutes': ['glutes'],
  'Biceps': ['biceps'],
  'Triceps': ['triceps'],
  'Calves': ['calves'],
  'Forearms': ['forearms'],
  'Traps': ['traps'],
  'Lats': ['lats']
};

export default function MuscleMap({ muscles = [], size = 180 }) {
  const activeSegments = useMemo(() => {
    const segments = new Set();
    muscles.forEach(m => {
      const match = MUSCLE_GROUP_MAP[m];
      if (match) match.forEach(s => segments.add(s));
    });
    return segments;
  }, [muscles]);

  const renderView = (paths, title) => (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
      <svg width={size} height={size * 1.5} viewBox="0 0 200 300" className="overflow-visible">
        {/* Shadow Figure Base */}
        <path d="M 100,10 A 10,10 0 1,1 100.1,10 Z M 80,40 Q 100,30 120,40 L 125,50 L 130,80 L 135,120 L 125,125 L 115,130 L 120,165 L 125,230 L 120,290 L 80,290 L 75,230 L 80,165 L 85,130 L 75,125 L 65,120 L 70,80 L 75,50 Z" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1" />
        
        {Object.entries(paths).map(([name, d]) => {
          const isActive = activeSegments.has(name);
          const displayName = name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' ');
          
          return (
            <Tooltip key={name} delayDuration={50}>
              <TooltipTrigger asChild>
                <path
                  d={d}
                  fill={isActive ? "#4f46e5" : "transparent"}
                  fillOpacity={isActive ? 0.8 : 0}
                  stroke={isActive ? "#4338ca" : "#f1f5f9"}
                  strokeWidth={isActive ? 1.5 : 1}
                  className="transition-all duration-700 ease-out cursor-help"
                  style={{ filter: isActive ? "drop-shadow(0 0 4px rgba(79, 70, 229, 0.4))" : "none" }}
                />
              </TooltipTrigger>
              <TooltipContent className="rounded-lg bg-slate-900 text-white text-[10px] font-bold border-none px-2 py-1 shadow-xl">
                {displayName}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </svg>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="flex items-center justify-center gap-4 md:gap-12 py-4 bg-slate-50/50 rounded-3xl border border-slate-100/50">
        {renderView(FRONT_MUSCLE_PATHS, "Front")}
        <div className="w-px h-24 bg-slate-200 hidden sm:block" />
        {renderView(BACK_MUSCLE_PATHS, "Back")}
      </div>
    </TooltipProvider>
  );
}

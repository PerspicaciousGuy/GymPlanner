import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { anteriorData, posteriorData, MuscleType } from './AnatomyData';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const COLORS = {
  fatigued: '#f43f5e',   // rose-500
  recovering: '#f59e0b', // amber-500
  recovered: '#10b981',  // emerald-500
  idle: '#e2e8f0',       // slate-200
  active: '#6366f1'      // indigo-500
};

export default function InteractiveMuscleMap({ 
  muscleStats = {}, 
  view = 'both', // 'anterior' | 'posterior' | 'both'
  size = 200,
  onMuscleClick,
  noBackground = false
}) {
  const [mobileView, setMobileView] = useState('anterior'); // 'anterior' | 'posterior'
  
  const getMuscleColor = (muscle) => {
    const stat = muscleStats[muscle];
    if (!stat) return COLORS.idle;
    return COLORS[stat.status] || COLORS.idle;
  };

  // ... (rest of helper functions)

  const renderModel = (data, title, type) => (
    <div className="flex flex-col items-center w-full min-w-0">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{title}</span>
      <div className="w-full flex justify-center">
        <svg 
          viewBox="0 0 100 240" 
          style={{ maxWidth: size, width: '100%', height: 'auto' }}
          className="overflow-visible"
        >
          {data.map((group) => {
            const color = getMuscleColor(group.muscle);
            const isActive = !!muscleStats[group.muscle];
            
            return (
              <Tooltip key={group.muscle} delayDuration={0}>
                <TooltipTrigger asChild>
                  <motion.g 
                    className="cursor-pointer"
                    onClick={() => onMuscleClick?.(group.muscle)}
                    whileHover={{ 
                      scale: 1.01,
                      filter: 'brightness(1.05)'
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    {group.svgPoints.map((points, idx) => (
                      <motion.polygon
                        key={`${group.muscle}-${idx}`}
                        points={points}
                        initial={false}
                        animate={{
                          fill: color,
                          fillOpacity: isActive ? 0.8 : 0.35,
                          stroke: isActive ? color : '#cbd5e1',
                          strokeWidth: isActive ? 0.8 : 0.3
                        }}
                        transition={{ duration: 0.4 }}
                      />
                    ))}
                  </motion.g>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900 border-none text-white p-2 rounded-xl shadow-2xl z-50">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-tight">{group.muscle.replace('-', ' ')}</p>
                    {isActive && (
                      <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                         <p className="text-[9px] font-bold text-slate-300 capitalize">{muscleStats[group.muscle].status}</p>
                      </div>
                    )}
                    {!isActive && <p className="text-[9px] font-bold text-slate-500">Not targeted recently</p>}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </svg>
      </div>
    </div>
  );

  const containerClasses = noBackground 
    ? "flex flex-col items-center gap-6"
    : "flex flex-col items-center gap-6 py-8 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 shadow-inner overflow-hidden px-6";

  const isBoth = view === 'both';

  return (
    <TooltipProvider>
      <div className={containerClasses}>
        {/* Mobile View Switcher - Only shown on small screens when view is 'both' */}
        {isBoth && (
          <div className="flex md:hidden bg-white/50 p-1 rounded-2xl border border-slate-200 mb-2">
            <button 
              onClick={() => setMobileView('anterior')}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                mobileView === 'anterior' ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100" : "text-slate-400"
              )}
            >
              Front
            </button>
            <button 
              onClick={() => setMobileView('posterior')}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                mobileView === 'posterior' ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100" : "text-slate-400"
              )}
            >
              Back
            </button>
          </div>
        )}

        <div className="flex md:flex-row items-center md:items-start justify-center gap-4 md:gap-12 w-full">
          {/* Anterior View: Visible if view is 'anterior' or 'both' (conditioned by mobileView on small screens) */}
          {((isBoth && (mobileView === 'anterior')) || view === 'anterior') && (
            <div className={cn("w-full transition-all duration-300", isBoth && "md:hidden", !isBoth && "block")}>
              {renderModel(anteriorData, "Front View", "anterior")}
            </div>
          )}
          
          {/* Posterious View: Visible if view is 'posterior' or 'both' (conditioned by mobileView on small screens) */}
          {(isBoth && (mobileView === 'posterior') || view === 'posterior') && (
            <div className={cn("w-full transition-all duration-300", isBoth && "md:hidden", !isBoth && "block")}>
              {renderModel(posteriorData, "Back View", "posterior")}
            </div>
          )}

          {/* Desktop Dual View handling for 'both' mode */}
          {isBoth && (
            <>
              {/* Force Anterior on Desktop */}
              <div className="hidden md:block w-full">
                {renderModel(anteriorData, "Front View", "anterior")}
              </div>
              
              <div className={cn("w-px bg-slate-200 mt-12 hidden md:block self-center opacity-50", noBackground ? "h-32" : "h-64")} />
              
              {/* Force Posterior on Desktop */}
              <div className="hidden md:block w-full">
                {renderModel(posteriorData, "Back View", "posterior")}
              </div>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

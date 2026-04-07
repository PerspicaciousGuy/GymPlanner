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
  const [selectedMuscle, setSelectedMuscle] = useState(null);
  
  const handleMuscleClick = (muscle) => {
    setSelectedMuscle(muscle === selectedMuscle ? null : muscle);
    onMuscleClick?.(muscle);
  };

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
                    onClick={() => handleMuscleClick(group.muscle)}
                    whileHover={{ 
                      scale: 1.01,
                      filter: 'brightness(1.05)'
                    }}
                    animate={{
                      filter: selectedMuscle === group.muscle ? 'brightness(1.2)' : 'brightness(1)'
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

        {/* Legend / Analysis Section */}
        <div className="w-full mt-4 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Target Analysis
            </h4>
            {selectedMuscle && (
              <button 
                onClick={() => setSelectedMuscle(null)}
                className="text-[9px] font-bold text-indigo-600 uppercase tracking-tighter hover:underline"
              >
                Clear Selection
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 justify-start px-1">
            {/* Show Selected Muscle prominently if active */}
            {selectedMuscle && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full mb-2"
              >
                <div className={cn(
                  "p-3 rounded-2xl border flex items-center justify-between",
                  muscleStats[selectedMuscle] ? "bg-indigo-50 border-indigo-100" : "bg-slate-50 border-slate-100"
                )}>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full shadow-sm" 
                      style={{ backgroundColor: getMuscleColor(selectedMuscle) }} 
                    />
                    <div>
                      <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">
                        {selectedMuscle.replace('-', ' ')}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        {muscleStats[selectedMuscle] ? `Status: ${muscleStats[selectedMuscle].status}` : 'Not Targeted'}
                      </p>
                    </div>
                  </div>
                  <div className="text-[8px] font-black text-indigo-400 uppercase border border-indigo-100 px-2 py-0.5 rounded-md">
                    Selected
                  </div>
                </div>
              </motion.div>
            )}

            {/* List current active muscles in view as labels */}
            {(isBoth || view === 'anterior' || view === 'posterior') && (
              (isBoth ? (mobileView === 'anterior' ? anteriorData : posteriorData) : (view === 'anterior' ? anteriorData : posteriorData))
                .filter(group => muscleStats[group.muscle])
                .map(group => (
                  <button
                    key={`legend-${group.muscle}`}
                    onClick={() => handleMuscleClick(group.muscle)}
                    className={cn(
                      "group flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all",
                      selectedMuscle === group.muscle 
                        ? "bg-slate-900 border-slate-900 text-white scale-105 shadow-xl" 
                        : "bg-white border-slate-100 text-slate-600 hover:border-indigo-200"
                    )}
                  >
                    <div 
                      className="w-1.5 h-1.5 rounded-full" 
                      style={{ backgroundColor: getMuscleColor(group.muscle) }} 
                    />
                    <span className="text-[9px] font-black uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                      {group.muscle.replace('-', ' ')}
                    </span>
                  </button>
                ))
            )}

            {/* No muscles targeted message */}
            {!(isBoth ? (mobileView === 'anterior' ? anteriorData : posteriorData) : (view === 'anterior' ? anteriorData : posteriorData))
                .some(group => muscleStats[group.muscle]) && (
              <div className="w-full py-4 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Tap muscles below to identify them
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

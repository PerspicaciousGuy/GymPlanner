import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { anteriorData, posteriorData } from './AnatomyData';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const COLORS = {
  fatigued: 'var(--destructive)',
  recovering: 'var(--app-border-strong)',
  recovered: 'var(--app-accent)',
  idle: 'var(--app-border)',
  active: 'var(--app-accent)'
};

export default function InteractiveMuscleMap({
  muscleStats = {},
  view = 'both',
  size = 200,
  onMuscleClick,
  noBackground = false
}) {
  const [mobileView, setMobileView] = useState('anterior');
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

  const renderModel = (data, title) => (
    <div className="flex flex-col items-center w-full min-w-0">
      <span className="mb-4 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">{title}</span>
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
                          stroke: isActive ? color : 'var(--app-border-strong)',
                          strokeWidth: isActive ? 0.8 : 0.3
                        }}
                        transition={{ duration: 0.4 }}
                      />
                    ))}
                  </motion.g>
                </TooltipTrigger>
                <TooltipContent className="z-50 rounded-[var(--app-radius-md)] border-none bg-foreground p-2 text-background shadow-[var(--app-shadow-md)]">
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-normal">{group.muscle.replace('-', ' ')}</p>
                    {isActive && (
                      <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                         <p className="text-[9px] font-semibold capitalize text-background/70">{muscleStats[group.muscle].status}</p>
                      </div>
                    )}
                    {!isActive && <p className="text-[9px] font-semibold text-background/60">Not targeted recently</p>}
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
    : "flex flex-col items-center gap-6 overflow-hidden rounded-[var(--app-radius-lg)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-6 py-8 shadow-[inset_0_1px_2px_rgb(15_23_42_/_0.04)]";

  const isBoth = view === 'both';

  return (
    <TooltipProvider>
      <div className={containerClasses}>
        {isBoth && (
          <div className="mb-2 flex rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] p-1 md:hidden">
            <button
              onClick={() => setMobileView('anterior')}
              className={cn(
                "rounded-[var(--app-radius-sm)] px-4 py-2 text-[10px] font-semibold uppercase tracking-normal transition-all",
                mobileView === 'anterior' ? "bg-foreground text-background shadow-[var(--app-shadow-sm)]" : "text-muted-foreground"
              )}
            >
              Front
            </button>
            <button
              onClick={() => setMobileView('posterior')}
              className={cn(
                "rounded-[var(--app-radius-sm)] px-4 py-2 text-[10px] font-semibold uppercase tracking-normal transition-all",
                mobileView === 'posterior' ? "bg-foreground text-background shadow-[var(--app-shadow-sm)]" : "text-muted-foreground"
              )}
            >
              Back
            </button>
          </div>
        )}

        <div className="flex md:flex-row items-center md:items-start justify-center gap-4 md:gap-12 w-full">
          {((isBoth && (mobileView === 'anterior')) || view === 'anterior') && (
            <div className={cn("w-full transition-all duration-300", isBoth && "md:hidden", !isBoth && "block")}>
              {renderModel(anteriorData, "Front View", "anterior")}
            </div>
          )}

          {(isBoth && (mobileView === 'posterior') || view === 'posterior') && (
            <div className={cn("w-full transition-all duration-300", isBoth && "md:hidden", !isBoth && "block")}>
              {renderModel(posteriorData, "Back View", "posterior")}
            </div>
          )}

          {isBoth && (
            <>
              <div className="hidden md:block w-full">
                {renderModel(anteriorData, "Front View", "anterior")}
              </div>

              <div className={cn("mt-12 hidden w-px self-center bg-[var(--app-border)] opacity-80 md:block", noBackground ? "h-32" : "h-64")} />

              <div className="hidden md:block w-full">
                {renderModel(posteriorData, "Back View", "posterior")}
              </div>
            </>
          )}
        </div>

        <div className="w-full mt-4 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h4 className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--app-accent)]" />
              Target Analysis
            </h4>
            {selectedMuscle && (
              <button
                onClick={() => setSelectedMuscle(null)}
                className="text-[9px] font-semibold uppercase tracking-normal text-foreground hover:underline"
              >
                Clear Selection
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 justify-start px-1">
            {selectedMuscle && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full mb-2"
              >
                <div className={cn(
                  "flex items-center justify-between rounded-[var(--app-radius-md)] border p-3",
                  muscleStats[selectedMuscle] ? "border-[var(--app-border-strong)] bg-[var(--app-accent-soft)]" : "border-[var(--app-border)] bg-[var(--app-surface-muted)]"
                )}>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full shadow-[var(--app-shadow-sm)]"
                      style={{ backgroundColor: getMuscleColor(selectedMuscle) }}
                    />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-normal text-foreground">
                        {selectedMuscle.replace('-', ' ')}
                      </p>
                      <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-normal text-muted-foreground">
                        {muscleStats[selectedMuscle] ? `Status: ${muscleStats[selectedMuscle].status}` : 'Not Targeted'}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-[var(--app-radius-sm)] border border-[var(--app-border)] px-2 py-0.5 text-[8px] font-semibold uppercase text-[var(--app-text-soft)]">
                    Selected
                  </div>
                </div>
              </motion.div>
            )}

            {(isBoth || view === 'anterior' || view === 'posterior') && (
              (isBoth ? (mobileView === 'anterior' ? anteriorData : posteriorData) : (view === 'anterior' ? anteriorData : posteriorData))
                .filter(group => muscleStats[group.muscle])
                .map(group => (
                  <button
                    key={`legend-${group.muscle}`}
                    onClick={() => handleMuscleClick(group.muscle)}
                    className={cn(
                      "group flex items-center gap-2 rounded-[var(--app-radius-sm)] border px-3 py-1.5 transition-all",
                      selectedMuscle === group.muscle
                        ? "scale-105 border-foreground bg-foreground text-background shadow-[var(--app-shadow-md)]"
                        : "border-[var(--app-border)] bg-[var(--app-surface)] text-muted-foreground hover:border-[var(--app-border-strong)]"
                    )}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: getMuscleColor(group.muscle) }}
                    />
                    <span className="text-[9px] font-semibold uppercase tracking-normal transition-colors group-hover:text-foreground">
                      {group.muscle.replace('-', ' ')}
                    </span>
                  </button>
                ))
            )}

            {!(isBoth ? (mobileView === 'anterior' ? anteriorData : posteriorData) : (view === 'anterior' ? anteriorData : posteriorData))
                .some(group => muscleStats[group.muscle]) && (
              <div className="w-full rounded-[var(--app-radius-md)] border border-dashed border-[var(--app-border)] py-4 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">
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

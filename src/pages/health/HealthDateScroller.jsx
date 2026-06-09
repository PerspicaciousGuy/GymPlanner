import { useEffect, useRef } from 'react';
import { cn } from "@/lib/utils";
import { formatDateKey, getToday } from '../../utils/dateUtils';

export function HealthDateScroller({ dates, selectedDateKey, onSelectDate }) {
  const dateScrollRef = useRef(null);

  useEffect(() => {
    if (!dateScrollRef.current) return;

    const todayIndex = dates.findIndex(date => formatDateKey(date) === formatDateKey(getToday()));
    const todayElement = dateScrollRef.current.children[todayIndex];

    if (todayElement) {
      todayElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [dates]);

  return (
    <div
      ref={dateScrollRef}
      className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {dates.map((date) => {
        const dateKey = formatDateKey(date);
        const isSelected = dateKey === selectedDateKey;
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dayNum = date.getDate();

        return (
          <button
            key={dateKey}
            onClick={() => onSelectDate(date)}
            className={cn(
              "group flex min-w-[58px] flex-col items-center justify-center rounded-[var(--app-radius-md)] border px-2 py-2 transition-colors duration-200",
              isSelected
                ? "border-[var(--app-border-strong)] bg-[var(--app-surface)] shadow-[var(--app-shadow-sm)]"
                : "border-transparent text-muted-foreground hover:border-[var(--app-border)] hover:bg-[var(--app-surface-muted)]"
            )}
          >
            <span
              className={cn(
                "mb-1 text-[10px] font-semibold uppercase tracking-normal",
                isSelected ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {dayName}
            </span>
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-[var(--app-radius-md)] text-sm font-semibold transition-colors duration-200",
                isSelected
                  ? "bg-foreground text-background"
                  : "bg-[var(--app-surface-muted)] text-foreground"
              )}
            >
              {dayNum}
            </span>
          </button>
        );
      })}
    </div>
  );
}

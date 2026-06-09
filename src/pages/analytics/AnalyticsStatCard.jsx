import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Panel } from "@/components/layout/Panel";
import { cn } from "@/lib/utils";

const statIconClass =
  "flex shrink-0 items-center justify-center rounded-[var(--app-radius-md)] transition-transform group-hover:scale-105";

function GlowCounter({ value, suffix = "", decimals = 0 }) {
  const countRef = useRef(null);

  useGSAP(() => {
    const countState = { value: 0 };
    gsap.to(countState, {
      value,
      duration: 1.5,
      ease: "power2.out",
      onUpdate: () => {
        if (countRef.current) {
          countRef.current.innerText = countState.value.toFixed(decimals) + suffix;
        }
      },
    });
  }, [value]);

  return <span ref={countRef}>0</span>;
}

export function AnalyticsStatCard({ title, value, subtitle, icon, iconColor, bgColor, trend, suffix = "", className, isMicro }) {
  return (
    <Panel className={cn(
      "group relative min-w-0 overflow-hidden transition-colors hover:border-[var(--app-border-strong)]",
      isMicro ? "p-3" : "p-5",
      className
    )}>
      <div className="absolute inset-x-0 top-0 h-px bg-[var(--app-border-strong)] opacity-80" />
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between relative">
          <div className={cn(
            statIconClass,
            isMicro ? "h-8 w-8" : "h-11 w-11",
            bgColor,
            iconColor
          )}>
            {icon}
          </div>
          {trend !== undefined && trend !== null && (
            <div className={cn(
              "flex items-center gap-0.5 rounded-[var(--app-radius-sm)] px-1.5 py-0.5 text-[9px] font-semibold",
              trend >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500',
              isMicro ? "absolute right-0 top-0" : ""
            )}>
              {trend >= 0 ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div className={cn("mt-4 flex-grow", isMicro && "mt-3")}>
          <p className={cn(
            "mb-0.5 truncate font-semibold uppercase tracking-normal text-muted-foreground",
            isMicro ? "text-[8px]" : "text-[10px]"
          )}>
            {title}
          </p>
          <h2 className={cn(
            "flex items-baseline gap-0.5 font-semibold leading-none text-foreground",
            isMicro ? "mt-0.5 text-base" : "mt-1.5 text-3xl"
          )}>
            <GlowCounter value={value} suffix={suffix} decimals={suffix === 't' ? 1 : 0} />
          </h2>
          <p className={cn(
            "truncate font-medium tracking-normal text-muted-foreground",
            isMicro ? "text-[8px] mt-1" : "text-[10px] mt-1.5"
          )}>
            {subtitle}
          </p>
        </div>
      </div>
    </Panel>
  );
}

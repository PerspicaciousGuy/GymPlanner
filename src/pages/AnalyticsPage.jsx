import { useMemo, useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

import { Activity, Share2 } from 'lucide-react';
import { formatDateKey } from '../utils/dateUtils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import HistoryPage from './HistoryPage';
import { buildAnalyticsData, buildSelectedExerciseData } from './analytics/analyticsData';
import { EvolutionTabContent } from './analytics/EvolutionTabContent';
import { OverviewTabContent } from './analytics/OverviewTabContent';
import { RecoveryTabContent } from './analytics/RecoveryTabContent';

const analyticsSelectTriggerClass =
  "h-10 w-[142px] rounded-[var(--app-radius-md)] border-[var(--app-border)] bg-[var(--app-surface)] text-[11px] font-semibold text-foreground shadow-[var(--app-shadow-sm)]";

const analyticsPrimaryButtonClass =
  "flex h-10 items-center gap-2 rounded-[var(--app-radius-md)] bg-foreground px-4 text-[11px] font-semibold text-background shadow-[var(--app-shadow-sm)] hover:bg-foreground/90 disabled:opacity-60";

const analyticsTabsListClass =
  "h-auto w-full max-w-[460px] gap-1 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] p-1 shadow-[var(--app-shadow-sm)]";

const analyticsTabTriggerClass =
  "flex-1 rounded-[var(--app-radius-sm)] px-2 py-2.5 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground transition-all data-[state=active]:bg-foreground data-[state=active]:text-background";

function AnalyticsTabsList() {
  return (
    <TabsList className={analyticsTabsListClass}>
      <TabsTrigger value="overview" className={analyticsTabTriggerClass}>Overview</TabsTrigger>
      <TabsTrigger value="history" className={analyticsTabTriggerClass}>History</TabsTrigger>
      <TabsTrigger value="evolution" className={analyticsTabTriggerClass}>Focus</TabsTrigger>
      <TabsTrigger value="recovery" className={cn(analyticsTabTriggerClass, "flex items-center justify-center gap-1")}>
        Recovery <span className="h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
      </TabsTrigger>
    </TabsList>
  );
}

export default function AnalyticsPage({ onDateSelect }) {
  const [exerciseFilter, setExerciseFilter] = useState('All');
  const [timeRange, setTimeRange] = useState('30d');
  const dashboardRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [muscleMetric, setMuscleMetric] = useState('sets');
  const [activeTab, setActiveTab] = useState('overview');
  const tabsSentinelRef = useRef(null);
  const [isTabsSticky, setIsTabsSticky] = useState(false);

  useEffect(() => {
    setRefreshNonce(n => n + 1);
  }, []);

  useEffect(() => {
    const sentinel = tabsSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsTabsSticky(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const analyticsData = useMemo(() => buildAnalyticsData(timeRange), [timeRange, refreshNonce]);

  const selectedExerciseData = useMemo(
    () => buildSelectedExerciseData(exerciseFilter, analyticsData.exerciseHistory),
    [exerciseFilter, analyticsData.exerciseHistory]
  );
  const handleExportImage = () => {
    if (!dashboardRef.current) return;
    setIsExporting(true);

    // Add a slight delay to allow any UI states to settle
    setTimeout(async () => {
      try {
        const htmlToImage = await import('html-to-image');
        const dataUrl = await htmlToImage.toJpeg(dashboardRef.current, {
          quality: 0.95,
          backgroundColor: '#f8fafc',
          style: {
            padding: '24px',
            margin: '0',
            borderRadius: '24px'
          }
        });
        const link = document.createElement('a');
        link.download = `GymPlanner-Insights-${timeRange}-${formatDateKey(new Date())}.jpg`;
        link.href = dataUrl;
        link.click();
      } catch (error) {
        console.error('oops, something went wrong!', error);
      } finally {
        setIsExporting(false);
      }
    }, 100);
  };

  useGSAP(() => {
    // Reveal header cards with a cleaner, safer stagger
    gsap.from(".stat-card", {
      y: 20,
      opacity: 0,
      stagger: 0.05,
      duration: 0.6,
      ease: "power2.out",
      clearProps: "all"
    });

    // Animate charts on scroll
    gsap.from(".chart-container", {
      y: 30,
      opacity: 0,
      stagger: 0.2,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".chart-container",
        start: "top 85%",
        toggleActions: "play none none none"
      }
    });
  }, { scope: dashboardRef });

  return (
    <PageShell className="analytics-page">
      <PageHeader
        title="Insights"
        meta={(
          <span className="text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
            Performance analysis
          </span>
        )}
        actions={(
          <>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className={analyticsSelectTriggerClass}>
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent className="rounded-[var(--app-radius-md)] border-[var(--app-border)]">
                <SelectItem value="30d" className="text-xs font-semibold">Last 30 Days</SelectItem>
                <SelectItem value="90d" className="text-xs font-semibold">Last 3 Months</SelectItem>
                <SelectItem value="1y" className="text-xs font-semibold">This Year</SelectItem>
                <SelectItem value="all" className="text-xs font-semibold">All Time</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={handleExportImage}
              disabled={isExporting}
              className={analyticsPrimaryButtonClass}
            >
              {isExporting ? <Activity size={14} className="animate-spin" /> : <Share2 size={14} />}
              <span className="hidden sm:inline">Snapshot</span>
            </Button>
          </>
        )}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div ref={tabsSentinelRef} className="h-0 w-full" />

        <div
          className={cn(
            "fixed left-0 right-0 top-0 z-50 border-b border-[var(--app-border)] bg-[var(--app-bg)]/85 px-3 py-3 shadow-[var(--app-shadow-sm)] backdrop-blur-xl transition-all duration-200 sm:px-4 lg:px-6",
            isTabsSticky ? "translate-y-0 opacity-100 pointer-events-auto" : "-translate-y-2 opacity-0 pointer-events-none"
          )}
        >
          <div className="mx-auto flex max-w-[1600px] justify-center">
            <AnalyticsTabsList />
          </div>
        </div>

        <div className="mb-4 flex justify-center">
          <AnalyticsTabsList />
        </div>

        <div ref={dashboardRef} className="space-y-6 rounded-[var(--app-radius-lg)]">

          <OverviewTabContent
            analyticsData={analyticsData}
            timeRange={timeRange}
            muscleMetric={muscleMetric}
            setMuscleMetric={setMuscleMetric}
          />

          <TabsContent value="history" className="outline-none">
            <HistoryPage onDateSelect={onDateSelect} />
          </TabsContent>

          <EvolutionTabContent
            exerciseFilter={exerciseFilter}
            setExerciseFilter={setExerciseFilter}
            analyticsData={analyticsData}
            selectedExerciseData={selectedExerciseData}
          />

          <RecoveryTabContent recoveryData={analyticsData.recoveryData} />
        </div>
      </Tabs>
    </PageShell>
  );
}

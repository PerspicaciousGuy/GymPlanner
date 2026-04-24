import { useMemo, useState, useRef, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

import {
  BarChart3,
  Activity,
  Flame,
  Trophy,
  Dumbbell,
  Target,
  TrendingUp,
  TrendingDown,
  History,
  Calendar,
  Download,
  Share2,
  Award,
  Zap
} from 'lucide-react';
import { loadWorkouts, loadCompletion, getEffectiveSessionTitle } from '../utils/storage';
import { formatDateDisplay, formatDateKey } from '../utils/dateUtils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Tooltip as ShadTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Button } from "@/components/ui/button";

import { calculateRecovery } from '../utils/recoveryLogic';
import InteractiveMuscleMap from '../components/InteractiveMuscleMap/InteractiveMuscleMap';
import HistoryPage from './HistoryPage';

const COLORS = ['oklch(0.91 0.23 108)', 'oklch(0.8 0.18 108)', 'oklch(0.7 0.15 108)', 'oklch(0.6 0.12 108)'];

export default function AnalyticsPage({ onDateSelect }) {
  const [exerciseFilter, setExerciseFilter] = useState('All');
  const [timeRange, setTimeRange] = useState('30d');
  const dashboardRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [muscleMetric, setMuscleMetric] = useState('sets'); // 'sets' | 'volume'
  const [activeTab, setActiveTab] = useState('overview');
  const tabsSentinelRef = useRef(null);
  const [isTabsSticky, setIsTabsSticky] = useState(false);

  // Refresh data when navigating to analytics to ensure it catches latest workouts
  useEffect(() => {
    setRefreshNonce(n => n + 1);
  }, []);

  // Sticky tabs via IntersectionObserver (reliable across all scroll contexts)
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

  const analyticsData = useMemo(() => {
    const workouts = loadWorkouts();
    const completion = loadCompletion();

    // Filter dates based on timeRange
    const today = new Date();
    let startDate = new Date(0); // All time default

    if (timeRange === '30d') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 30);
    } else if (timeRange === '90d') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 90);
    } else if (timeRange === '1y') {
      startDate = new Date(today);
      startDate.setFullYear(today.getFullYear() - 1);
    }

    const startDateString = formatDateKey(startDate);

    // Previous period for trends
    let prevStartDate = new Date(startDate);

    if (timeRange === '30d') {
      prevStartDate.setDate(prevStartDate.getDate() - 30);
    } else if (timeRange === '90d') {
      prevStartDate.setDate(prevStartDate.getDate() - 90);
    } else if (timeRange === '1y') {
      prevStartDate.setFullYear(prevStartDate.getFullYear() - 1);
    } else {
      prevStartDate = new Date(0); // All time has no previous period
    }

    const prevStartStr = formatDateKey(prevStartDate);
    const prevEndStr = startDateString;

    // Process Volume over time
    const dateKeys = Object.keys(workouts).sort();
    const isOff = (txt) => {
      if (!txt) return true;
      const t = String(txt).toLowerCase().trim();
      return t === '' || t === 'off' || t === 'rest' || t.startsWith('off ') || t.startsWith('rest ');
    };

    let totalVolume = 0;
    let completedSessions = 0;
    let plannedSessions = 0;

    let prevTotalVolume = 0;
    let prevCompletedSessions = 0;
    let prevPlannedSessions = 0;

    const volumeHistory = [];

    dateKeys.forEach(date => {
      if (date < prevStartStr) return; // Skip too old

      const isCurrentPeriod = date >= startDateString;
      const isPrevPeriod = date >= prevStartStr && date < prevEndStr;

      let dayVolume = 0;
      let exerciseCount = 0;
      const dailyMuscles = new Set();
      const dayData = workouts[date];

      ['am', 'pm'].forEach(session => {
        // Track stats from plan
        const dayDate = new Date(date);
        const scheduledTitle = getEffectiveSessionTitle(dayDate, session);
        const isSessionPlanned = !isOff(scheduledTitle);

        if (isSessionPlanned) {
          if (isCurrentPeriod) plannedSessions++;
          if (isPrevPeriod) prevPlannedSessions++;
        }

        const status = completion[`${date}_${session}`];
        if (status === true) {
          if (isCurrentPeriod) completedSessions++;
          if (isPrevPeriod) prevCompletedSessions++;

          const sess = dayData?.[session] || {};
          const groups = sess.groups || [];
          const standalone = sess.standaloneExercises || [];

          groups.forEach(group => {
            (group.rows || []).forEach(row => {
              const weight = parseFloat(row.weight) || 0;
              const sets = parseInt(row.sets) || 0;
              const reps = parseInt(row.reps) || 0;
              dayVolume += weight * sets * reps;

              // Include legacy drop sets
              if (row.dropSets && row.dropWeight) {
                dayVolume += (parseInt(row.dropSets) || 0) * (parseFloat(row.dropWeight) || 0) * reps;
              }

              if (isCurrentPeriod && row.exercise) {
                exerciseCount++;
                if (row.muscle) dailyMuscles.add(row.muscle);
              }
            });
          });

          standalone.forEach(ex => {
            if (ex.exercise) {
              if (isCurrentPeriod) {
                exerciseCount++;
                if (ex.muscle) dailyMuscles.add(ex.muscle);
              }
              (ex.sets || []).forEach(set => {
                const weight = parseFloat(set.weight) || 0;
                const reps = parseInt(set.reps) || 0;
                dayVolume += weight * reps; // Standing alone, each set row is individual

                // Include advanced drop sets (multi-drop support)
                const drops = set.drops || (set.isDrop && (set.dropWeight || set.dropReps) ? [{ weight: set.dropWeight, reps: set.dropReps }] : []);
                drops.forEach(drop => {
                  const dWeight = parseFloat(drop.weight) || 0;
                  const dReps = parseInt(drop.reps) || 0;
                  dayVolume += dWeight * dReps;
                });
              });
            }
          });
        }
      });

      if (isCurrentPeriod) {
        totalVolume += dayVolume;
        if (dayVolume > 0) {
          volumeHistory.push({
            date,
            displayDate: formatDateDisplay(date),
            volume: dayVolume,
            exerciseCount,
            muscles: Array.from(dailyMuscles)
          });
        }
      } else if (isPrevPeriod) {
        prevTotalVolume += dayVolume;
      }
    });

    // Process Muscle Distribution (Current vs Previous)
    const muscleMap = {};
    const prevMuscleMap = {};

    const processMuscleSess = (sess, map) => {
      (sess.groups || []).forEach(group => {
        (group.rows || []).forEach(row => {
          if (row.muscle) {
            const m = row.muscle;
            if (!map[m]) map[m] = { sets: 0, volume: 0 };
            const sets = parseInt(row.sets) || 0;
            const reps = parseInt(row.reps) || 0;
            const weight = parseFloat(row.weight) || 0;
            map[m].sets += sets;
            map[m].volume += (sets * reps * weight);
          }
        });
      });
      (sess.standaloneExercises || []).forEach(ex => {
        if (ex.muscle) {
          const m = ex.muscle;
          if (!map[m]) map[m] = { sets: 0, volume: 0 };
          (ex.sets || []).forEach(s => {
            const reps = parseInt(s.reps) || 0;
            const weight = parseFloat(s.weight) || 0;
            map[m].sets += 1;
            map[m].volume += (reps * weight);
            
            // Include advanced drop sets in muscle volume
            const drops = s.drops || (s.isDrop && (s.dropWeight || s.dropReps) ? [{ weight: s.dropWeight, reps: s.dropReps }] : []);
            drops.forEach(drop => {
              const dWeight = parseFloat(drop.weight) || 0;
              const dReps = parseInt(drop.reps) || 0;
              map[m].volume += (dWeight * dReps);
            });
          });
        }
      });
    };

    Object.entries(workouts).forEach(([date, day]) => {
      const isCurrent = date >= startDateString;
      const isPrev = date < startDateString && date >= prevStartStr;

      if (isCurrent) {
        ['am', 'pm'].forEach(s => processMuscleSess(day[s] || {}, muscleMap));
      } else if (isPrev) {
        ['am', 'pm'].forEach(s => processMuscleSess(day[s] || {}, prevMuscleMap));
      }
    });

    const formats = (map) => Object.entries(map).map(([name, data]) => ({
      name,
      sets: data.sets,
      volume: Math.round(data.volume)
    })).sort((a, b) => b.sets - a.sets);

    const muscleData = formats(muscleMap);
    const prevMuscleData = formats(prevMuscleMap);

    // Process Exercise PRs/Progress
    const exerciseList = new Set();
    const exerciseHistory = {};

    Object.entries(workouts).forEach(([date, day]) => {
      if (date < startDateString) return;
      ['am', 'pm'].forEach(session => {
        const isDone = completion[`${date}_${session}`] === true;
        const sess = day[session] || {};
        (sess.groups || []).forEach(group => {
          (group.rows || []).forEach(row => {
            if (row.exercise && row.weight && isDone) {
              const name = row.exercise.trim();
              exerciseList.add(name);
              if (!exerciseHistory[name]) exerciseHistory[name] = [];
              exerciseHistory[name].push({
                date,
                weight: parseFloat(row.weight),
                reps: parseInt(row.reps)
              });
            }
          });
        });
        (sess.standaloneExercises || []).forEach(ex => {
          if (ex.exercise && isDone) {
            const name = ex.exercise.trim();
            exerciseList.add(name);
            if (!exerciseHistory[name]) exerciseHistory[name] = [];

            (ex.sets || []).forEach(set => {
              if (set.weight && set.reps) {
                exerciseHistory[name].push({
                  date,
                  weight: parseFloat(set.weight),
                  reps: parseInt(set.reps)
                });
              }
            });
          }
        });
      });
    });

    const calculateTrend = (current, prev) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - prev) / prev) * 100);
    };

    // Extract Top 5 PRs
    const personalRecords = Object.entries(exerciseHistory).map(([name, history]) => {
      const best = [...history].sort((a, b) => b.weight - a.weight)[0];
      return { name, ...best };
    }).sort((a, b) => b.weight - a.weight).slice(0, 5);

    const sessionsTrend = timeRange === 'all' ? null : calculateTrend(completedSessions, prevCompletedSessions);
    const compliance = plannedSessions > 0 ? Math.round((completedSessions / plannedSessions) * 100) : 100;
    const prevCompliance = prevPlannedSessions > 0 ? Math.round((prevCompletedSessions / prevPlannedSessions) * 100) : 100;
    const complianceTrend = timeRange === 'all' ? null : calculateTrend(compliance, prevCompliance);

    // Process Recovery
    const recoveryData = calculateRecovery(Object.entries(workouts).flatMap(([date, day]) =>
      ['am', 'pm'].map(session => ({ date, ...day[session], session }))
    ));

    return {
      volumeHistory,
      muscleData,
      prevMuscleData,
      totalVolume,
      prevTotalVolume,
      completedSessions,
      plannedSessions,
      compliance,
      volumeTrend: timeRange === 'all' ? null : calculateTrend(totalVolume, prevTotalVolume),
      sessionsTrend,
      complianceTrend,
      exerciseHistory,
      personalRecords,
      recoveryData,
      exerciseList: Array.from(exerciseList).sort(),
      insights: {
        highestVolumeDay: [...volumeHistory].sort((a, b) => b.volume - a.volume)[0],
        topMuscle: muscleData[0],
        prevTopMuscle: prevMuscleData[0],
        topExercise: Object.entries(exerciseHistory)
          .map(([name, history]) => ({ name, count: history.length }))
          .sort((a, b) => b.count - a.count)[0]
      }
    };
  }, [timeRange, refreshNonce]);

  const selectedExerciseData = useMemo(() => {
    if (exerciseFilter === 'All') return [];
    const history = analyticsData.exerciseHistory[exerciseFilter] || [];

    // Group by date to get the "Daily Best"
    const dailyBest = {};
    history.forEach(item => {
      const { date, weight, reps } = item;
      // Brzycki formula for Est 1RM
      const est1RM = reps > 1 ? Math.round(weight * (36 / (37 - reps))) : weight;

      if (!dailyBest[date] || weight > dailyBest[date].weight) {
        dailyBest[date] = {
          date,
          weight,
          reps,
          est1RM
        };
      }
    });

    return Object.values(dailyBest).sort((a, b) => a.date.localeCompare(b.date));
  }, [exerciseFilter, analyticsData]);

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
    <div className="space-y-6 pb-12 animate-in fade-in duration-500 analytics-page">
      {/* Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            Performance Insights
          </h1>
          <p className="text-[10px] md:text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Data-driven training analysis</p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px] h-9 bg-card border-border text-[11px] font-bold text-foreground rounded-lg">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200">
              <SelectItem value="30d" className="text-xs font-semibold">Last 30 Days</SelectItem>
              <SelectItem value="90d" className="text-xs font-semibold">Last 3 Months</SelectItem>
              <SelectItem value="1y" className="text-xs font-semibold">This Year</SelectItem>
              <SelectItem value="all" className="text-xs font-semibold">All Time</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={handleExportImage}
            disabled={isExporting}
            className="flex items-center gap-2 h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold px-4 shadow-lg shadow-indigo-100"
          >
            {isExporting ? <Activity size={14} className="animate-spin text-white" /> : <Share2 size={14} />}
            <span className="hidden sm:inline">Snapshot</span>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Sentinel: when this scrolls out of view, tabs become fixed */}
        <div ref={tabsSentinelRef} className="h-0 w-full" />

        {/* Fixed floating tabs overlay (appears when scrolled past sentinel) */}
        <div
          className={`fixed top-0 left-0 right-0 z-50 bg-background/85 backdrop-blur-xl py-3 px-3 sm:px-4 lg:px-6 border-b border-border/30 shadow-sm transition-all duration-200 ${isTabsSticky ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
        >
          <div className="flex justify-center mx-auto max-w-[1600px]">
            <TabsList className="bg-muted/60 p-1 rounded-2xl border border-border/40 h-auto gap-0.5 w-full max-w-[400px] shadow-sm">
              <TabsTrigger value="overview" className="flex-1 rounded-xl px-2 py-2.5 text-[10px] font-black uppercase tracking-tight data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Overview</TabsTrigger>
              <TabsTrigger value="history" className="flex-1 rounded-xl px-2 py-2.5 text-[10px] font-black uppercase tracking-tight data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">History</TabsTrigger>
              <TabsTrigger value="evolution" className="flex-1 rounded-xl px-2 py-2.5 text-[10px] font-black uppercase tracking-tight data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Focus</TabsTrigger>
              <TabsTrigger value="recovery" className="flex-1 rounded-xl px-1 py-2.5 text-[10px] font-black uppercase tracking-tight data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all flex items-center justify-center gap-1">
                Recovery <div className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Inline tabs (always rendered to prevent layout shift) */}
        <div className="flex justify-center mb-4">
          <TabsList className="bg-muted/60 p-1 rounded-2xl border border-border/40 h-auto gap-0.5 w-full max-w-[400px] shadow-sm">
            <TabsTrigger value="overview" className="flex-1 rounded-xl px-2 py-2.5 text-[10px] font-black uppercase tracking-tight data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Overview</TabsTrigger>
            <TabsTrigger value="history" className="flex-1 rounded-xl px-2 py-2.5 text-[10px] font-black uppercase tracking-tight data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">History</TabsTrigger>
            <TabsTrigger value="evolution" className="flex-1 rounded-xl px-2 py-2.5 text-[10px] font-black uppercase tracking-tight data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Focus</TabsTrigger>
            <TabsTrigger value="recovery" className="flex-1 rounded-xl px-1 py-2.5 text-[10px] font-black uppercase tracking-tight data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all flex items-center justify-center gap-1">
              Recovery <div className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
            </TabsTrigger>
          </TabsList>
        </div>

        <div ref={dashboardRef} className="space-y-6 bg-background rounded-3xl">

          <TabsContent value="overview" className="space-y-6 outline-none">
            {/* Header Cards */}
            <div className="flex flex-col gap-4">
              {/* Primary Metric - Full Width Hero Card */}
              <StatCard
                title="Total Volume"
                value={analyticsData.totalVolume / 1000}
                suffix="t"
                subtitle={timeRange === 'all' ? "Tonnage lifted (lifetime)" : "Tonnage this period"}
                trend={analyticsData.volumeTrend}
                icon={<BarChart3 size={24} />}
                iconColor="text-primary"
                bgColor="bg-primary/10"
                className="stat-card"
              />

              {/* Micro Metrics Row - 3 Side-by-side Cards */}
              <div className="grid grid-cols-3 gap-3 md:gap-4 overflow-x-auto pb-4 md:pb-0 no-scrollbar snap-x">
                <StatCard
                  isMicro
                  title="Consistency"
                  value={analyticsData.compliance}
                  suffix="%"
                  subtitle={`${analyticsData.completedSessions} Days`}
                  trend={analyticsData.complianceTrend}
                  icon={<TrendingUp size={16} />}
                  iconColor="text-emerald-500"
                  bgColor="bg-emerald-500/10"
                  className="stat-center snap-center"
                />
                <StatCard
                  isMicro
                  title="Intensity"
                  value={8.4}
                  subtitle="Avg RPE"
                  icon={<Flame size={16} />}
                  iconColor="text-orange-500"
                  bgColor="bg-orange-500/10"
                  className="stat-center snap-center"
                />
                <StatCard
                  isMicro
                  title="Records"
                  value={analyticsData.volumeHistory.length ? 12 : 0}
                  subtitle="New PRs"
                  icon={<Trophy size={16} />}
                  iconColor="text-amber-500"
                  bgColor="bg-amber-500/10"
                  className="stat-center snap-center"
                />
              </div>
            </div>

            {/* Dynamic Insights Highlights */}
            {analyticsData.volumeHistory.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-primary/10 border border-primary/20 text-foreground rounded-2xl p-4 shadow-sm flex items-start gap-4 relative overflow-hidden group/insight transition-all hover:scale-[1.02] duration-300">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-10 translate-x-10" />
                  <div className="p-2.5 bg-primary/20 rounded-xl shrink-0 backdrop-blur-sm group-hover/insight:scale-110 transition-transform">
                    <Zap size={18} className="text-primary-foreground fill-primary" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1.5 opacity-80">Peak Performance</p>
                    <p className="text-sm font-bold leading-snug tracking-tight">
                      Your highest volume was <span className="text-primary font-black">{(analyticsData.insights.highestVolumeDay?.volume / 1000).toFixed(1)}t</span> on <span className="font-black underline decoration-primary/30 decoration-2 underline-offset-2">{analyticsData.insights.highestVolumeDay?.displayDate}</span>.
                    </p>
                  </div>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/20 text-foreground rounded-2xl p-4 shadow-sm flex items-start gap-4 relative overflow-hidden group/insight transition-all hover:scale-[1.02] duration-300">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -translate-y-10 translate-x-10" />
                  <div className="p-2.5 bg-emerald-500/20 rounded-xl shrink-0 backdrop-blur-sm group-hover/insight:scale-110 transition-transform">
                    <Target size={18} className="text-emerald-600" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1.5 opacity-80">Primary Focus</p>
                    <p className="text-sm font-bold leading-snug tracking-tight">
                      <span className="font-black text-emerald-700">{analyticsData.insights.topMuscle?.name || 'Nothing'}</span> is your most trained muscle group with <span className="text-emerald-600 font-black">{analyticsData.insights.topMuscle?.value || 0} sets</span>.
                    </p>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 text-foreground rounded-2xl p-4 shadow-sm flex items-start gap-4 relative overflow-hidden group/insight transition-all hover:scale-[1.02] duration-300">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -translate-y-10 translate-x-10" />
                  <div className="p-2.5 bg-amber-500/20 rounded-xl shrink-0 backdrop-blur-sm group-hover/insight:scale-110 transition-transform">
                    <Award size={18} className="text-amber-600" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-1.5 opacity-80">Top Movement</p>
                    <p className="text-sm font-bold leading-snug tracking-tight">
                      You've performed <span className="font-black text-amber-700">{analyticsData.insights.topExercise?.name || 'Nothing'}</span> the most, recording <span className="text-amber-600 font-black">{analyticsData.insights.topExercise?.count || 0} sessions</span>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Volume Chart */}
              <div className="lg:col-span-2 bg-card rounded-3xl border border-border p-6 shadow-sm hover:shadow-md transition-all chart-container">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
                      <Activity size={16} className="text-primary" />
                      Training Volume Trend
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Total load per session over time</p>
                  </div>
                </div>
                {analyticsData.volumeHistory.length === 0 ? (
                  <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground bg-muted/30 rounded-2xl border border-dashed border-border">
                    <Activity size={32} className="mb-2 opacity-20" />
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-2">No volume data for this period</p>
                    <p className="text-[10px] text-muted-foreground font-medium max-w-[200px] text-center mt-1">Log workouts and mark them as complete to see trends.</p>
                  </div>
                ) : (
                  <div className="h-[300px] w-full min-w-0" style={{ minHeight: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analyticsData.volumeHistory} style={{ outline: 'none' }}>
                        <defs>
                          <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-slate-100)" strokeOpacity={0.5} />
                        <XAxis
                          dataKey="displayDate"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fontWeight: 600, fill: 'var(--color-slate-400)' }}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(val) => `${(val / 1000).toFixed(1)}t`}
                          tick={{ fontSize: 10, fontWeight: 600, fill: 'var(--color-slate-400)' }}
                        />
                        <Tooltip
                          content={<CustomVolumeTooltip />}
                          cursor={{ stroke: 'var(--color-primary)', strokeWidth: 2, strokeDasharray: '5 5', opacity: 0.3 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="volume"
                          stroke="var(--primary)"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorVolume)"
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Muscle Distribution */}
              <div className="bg-card rounded-3xl border border-border p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
                      <Target size={16} className="text-primary" />
                      Body Focus
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Muscle group distribution</p>
                  </div>
                  <div className="flex bg-muted p-1 rounded-xl border border-border">
                    <button
                      onClick={() => setMuscleMetric('sets')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all",
                        muscleMetric === 'sets' ? "bg-white text-primary shadow-sm" : "text-muted-foreground"
                      )}
                    >
                      Sets
                    </button>
                    <button
                      onClick={() => setMuscleMetric('volume')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all",
                        muscleMetric === 'volume' ? "bg-white text-primary shadow-sm" : "text-muted-foreground"
                      )}
                    >
                      Volume
                    </button>
                  </div>
                </div>

                {analyticsData.muscleData.length === 0 ? (
                  <div className="h-[250px] flex flex-col items-center justify-center text-muted-foreground bg-muted/30 rounded-2xl border border-dashed border-border">
                    <Target size={32} className="mb-2 opacity-20" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">No muscle data yet</p>
                  </div>
                ) : (() => {
                  // Prepare comparative data for the radar chart
                  const currentMap = analyticsData.muscleData;
                  const prevMap = analyticsData.prevMuscleData;
                  const allMuscles = Array.from(new Set([...currentMap.map(m => m.name), ...prevMap.map(m => m.name)]));

                  const combinedData = allMuscles.map(name => {
                    const curr = currentMap.find(m => m.name === name);
                    const past = prevMap.find(m => m.name === name);
                    return {
                      name,
                      current: curr ? curr[muscleMetric] : 0,
                      previous: past ? past[muscleMetric] : 0
                    };
                  }).sort((a, b) => b.current - a.current).slice(0, 6); // Keep it clean with top 6 focus areas

                  return (
                    <div className="h-[250px] w-full min-w-0" style={{ minHeight: '250px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={combinedData} style={{ outline: 'none' }}>
                          <PolarGrid stroke="#eef1f5ff" strokeOpacity={1} strokeWidth={1} />
                          <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--color-slate-500)' }} />

                          {/* Previous Period "Ghost" Radar */}
                          <Radar
                            name="Previous"
                            dataKey="previous"
                            stroke="#94a3b8"
                            strokeWidth={1}
                            strokeDasharray="4 4"
                            fill="#f1f5f9"
                            fillOpacity={0.2}
                          />

                          {/* Current Period Active Radar */}
                          <Radar
                            name="Current"
                            dataKey="current"
                            stroke="#6366f1"
                            strokeWidth={2}
                            fill="url(#colorRadar)"
                            fillOpacity={0.5}
                          />

                          <defs>
                            <radialGradient id="colorRadar" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8} />
                              <stop offset="100%" stopColor="#818cf8" stopOpacity={0.3} />
                            </radialGradient>
                          </defs>
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })()}

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-1 bg-indigo-500 rounded-full" />
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Current</span>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-50">
                      <div className="w-2.5 h-1 border border-slate-400 border-dashed rounded-full" />
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Previous</span>
                    </div>
                  </div>

                  {analyticsData.muscleData.slice(0, 3).map((item) => {
                    const pastItem = analyticsData.prevMuscleData.find(m => m.name === item.name);
                    const pastVal = pastItem ? pastItem[muscleMetric] : 0;
                    const currVal = item[muscleMetric];
                    const diff = pastVal > 0 ? Math.round(((currVal - pastVal) / pastVal) * 100) : 0;

                    return (
                      <div key={item.name} className="group relative flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:border-indigo-100 hover:shadow-sm transition-all overflow-hidden">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-indigo-500" />
                          <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-tight">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {diff !== 0 && (
                            <span className={cn(
                              "text-[9px] font-black tracking-tighter",
                              diff > 0 ? "text-emerald-500" : "text-rose-500"
                            )}>
                              {diff > 0 ? '+' : ''}{diff}%
                            </span>
                          )}
                          <span className="text-[10px] font-black text-indigo-600">
                            {currVal.toLocaleString()} {muscleMetric === 'sets' ? 'Sets' : 'kg'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* PR Board */}
            {analyticsData.personalRecords.length > 0 && (
              <div className="bg-card rounded-3xl border border-border p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
                      <Trophy size={16} className="text-amber-500" />
                      Personal Records
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">All-time best lifts</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {analyticsData.personalRecords.map((pr, idx) => (
                    <div key={idx} className="bg-gradient-to-br from-muted/50 to-card rounded-2xl border border-border p-4 relative overflow-hidden group hover:border-amber-500/30 hover:shadow-md transition-all">
                      <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-all">
                        <Trophy size={64} className="text-foreground" />
                      </div>
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2 truncate pr-6" title={pr.name}>
                        {pr.name}
                      </p>
                      <div className="flex items-end gap-1 mb-1">
                        <span className="text-2xl font-black text-foreground leading-none">{pr.weight}</span>
                        <span className="text-xs font-bold text-muted-foreground mb-0.5">kg</span>
                      </div>
                      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-muted rounded text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                        <History size={8} /> {pr.reps} Reps
                      </div>
                      <p className="text-[9px] font-semibold text-muted-foreground mt-3">{formatDateDisplay(pr.date)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="outline-none">
            <HistoryPage onDateSelect={onDateSelect} />
          </TabsContent>

          <TabsContent value="evolution" className="outline-none">
            {/* Strength Evolution */}
            <div className="bg-card rounded-3xl border border-border p-6 shadow-sm chart-container">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
                    <Dumbbell size={16} className="text-primary" />
                    Strength Evolution
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Individual exercise progression</p>
                </div>

                <Select value={exerciseFilter} onValueChange={setExerciseFilter}>
                  <SelectTrigger className="w-[180px] h-9 bg-muted/50 border-border text-xs font-bold text-foreground rounded-xl">
                    <SelectValue placeholder="Select Exercise" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border">
                    <SelectItem value="All" className="text-xs font-semibold">Select Exercise</SelectItem>
                    {analyticsData.exerciseList.map(name => (
                      <SelectItem key={name} value={name} className="text-xs font-semibold">{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!exerciseFilter || exerciseFilter === 'All' ? (
                <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground bg-muted/30 rounded-2xl border border-dashed border-border border-spacing-4">
                  <div className="p-4 bg-muted rounded-full mb-4 animate-pulse">
                    <History size={32} className="opacity-20 translate-x-[1px]" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-widest">Select an exercise</p>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1 opacity-60">to view your progression history</p>
                </div>
              ) : selectedExerciseData.length === 0 ? (
                <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground bg-muted/30 rounded-2xl border border-dashed border-border">
                  <Activity size={32} className="mb-2 opacity-20" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">No history recorded yet</p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-1">Check back once you've logged this exercise in a completed session.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-muted/30 rounded-2xl border border-border/50">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Max Weight</p>
                      <p className="text-xl font-black text-foreground">{Math.max(...selectedExerciseData.map(d => d.weight))}kg</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-2xl border border-border/50">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Peak 1RM (Est)</p>
                      <p className="text-xl font-black text-indigo-600">{Math.max(...selectedExerciseData.map(d => d.est1RM))}kg</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-2xl border border-border/50">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Sessions</p>
                      <p className="text-xl font-black text-foreground">{selectedExerciseData.length}</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-2xl border border-border/50">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Growth</p>
                      <div className="flex items-center gap-1">
                        {selectedExerciseData.length > 1 ? (
                          (() => {
                            const first = selectedExerciseData[0].weight;
                            const last = selectedExerciseData[selectedExerciseData.length - 1].weight;
                            const diff = last - first;
                            return (
                              <>
                                {diff >= 0 ? <TrendingUp size={14} className="text-emerald-500" /> : <TrendingDown size={14} className="text-rose-500" />}
                                <p className={cn("text-xl font-black", diff >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                  {Math.abs(diff)}kg
                                </p>
                              </>
                            );
                          })()
                        ) : (
                          <p className="text-xl font-black text-muted-foreground">—</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="h-[300px] w-full min-w-0" style={{ minHeight: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={selectedExerciseData} style={{ outline: 'none' }}>
                        <defs>
                          <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="color1RM" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="oklch(0.58 0.23 268)" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="oklch(0.58 0.23 268)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-slate-100)" strokeOpacity={0.5} />
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--color-slate-400)' }}
                          tickFormatter={(val) => formatDateDisplay(val).split(',')[0]}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--color-slate-400)' }}
                          domain={['auto', 'auto']}
                        />
                        <Tooltip
                          content={<CustomExerciseTooltip />}
                          cursor={{ stroke: 'var(--color-primary)', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="est1RM"
                          stroke="oklch(0.58 0.23 268)"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          fillOpacity={1}
                          fill="url(#color1RM)"
                          animationDuration={1500}
                        />
                        <Area
                          type="monotone"
                          dataKey="weight"
                          stroke="var(--primary)"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorWeight)"
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="recovery" className="outline-none">
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recovery Map Section */}
                <div className="lg:col-span-2 bg-gradient-to-b from-card to-muted/20 rounded-[2.5rem] border border-border p-8 shadow-sm">
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-black text-foreground tracking-tight">Anatomy Recovery</h3>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Real-time fatigue heatmap</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)] mb-1" />
                        <span className="text-[9px] font-black text-slate-400 uppercase">Rest</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] mb-1" />
                        <span className="text-[9px] font-black text-slate-400 uppercase">Healing</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] mb-1" />
                        <span className="text-[9px] font-black text-slate-400 uppercase">Ready</span>
                      </div>
                    </div>
                  </div>

                  <InteractiveMuscleMap
                    muscleStats={analyticsData.recoveryData}
                    size={180}
                  />

                  <div className="mt-8 p-6 bg-blue-500/5 rounded-2xl border border-blue-500/10 flex items-start gap-4">
                    <div className="p-2 bg-blue-500/10 rounded-xl">
                      <Activity className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-blue-900 uppercase tracking-wide">Recovery Science</p>
                      <p className="text-[11px] font-bold text-blue-700/80 leading-relaxed mt-1">
                        Status is calculated based on time-decay since your last logged set. Large muscle groups typically require 48-72 hours
                        for full neurological and tissue recovery.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recovery Sidebar */}
                <div className="space-y-6">
                  <div className="bg-card rounded-[2.5rem] border border-border p-8 shadow-sm h-full flex flex-col">
                    <h3 className="text-sm font-black text-foreground uppercase tracking-widest mb-6">Status Feed</h3>

                    <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar flex-grow">
                      {Object.entries(analyticsData.recoveryData || {}).length > 0 ? (
                        Object.entries(analyticsData.recoveryData)
                          .sort((a, b) => a[1].hoursSince - b[1].hoursSince)
                          .map(([muscle, data]) => (
                            <div key={muscle} className="group flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-transparent hover:border-border hover:bg-muted/50 transition-all">
                              <div className="flex items-center gap-3">
                                <div className={`w-2.5 h-2.5 rounded-full ${data.status === 'fatigued' ? 'bg-rose-500 shadow-lg shadow-rose-200' :
                                  data.status === 'recovering' ? 'bg-amber-500 shadow-lg shadow-amber-100' :
                                    'bg-emerald-500 shadow-lg shadow-emerald-100'
                                  }`} />
                                <div>
                                  <p className="text-[11px] font-black text-foreground uppercase tracking-tight">{muscle.replace('-', ' ')}</p>
                                  <p className="text-[9px] font-bold text-muted-foreground">Trained {data.hoursSince}h ago</p>
                                </div>
                              </div>
                              <div className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${data.status === 'fatigued' ? 'bg-rose-100 text-rose-600' :
                                data.status === 'recovering' ? 'bg-amber-100 text-amber-600' :
                                  'bg-emerald-100 text-emerald-600'
                                }`}>
                                {data.status}
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                          <Activity className="w-10 h-10 mb-4" />
                          <p className="text-xs font-black uppercase tracking-widest">No Recent Activity</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-8 pt-8 border-t border-border/50">
                      <div className="bg-indigo-600 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-indigo-100">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                          <Zap className="w-12 h-12" />
                        </div>
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-3">Fresh Capacity</h4>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(analyticsData.recoveryData || {})
                            .filter((entry) => entry[1].status === 'recovered')
                            .slice(0, 3)
                            .map(([m]) => (
                              <span key={m} className="px-2.5 py-1.5 bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-tighter">
                                {m.replace('-', ' ')}
                              </span>
                            ))}
                          {Object.entries(analyticsData.recoveryData || {}).filter((entry) => entry[1].status === 'recovered').length === 0 && (
                            <span className="text-[10px] font-black text-indigo-200">Processing recovery...</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}





function GlowCounter({ value, suffix = "", decimals = 0 }) {
  const countRef = useRef(null);

  useGSAP(() => {
    const obj = { val: 0 };
    gsap.to(obj, {
      val: value,
      duration: 1.5,
      ease: "power2.out",
      onUpdate: () => {
        if (countRef.current) {
          countRef.current.innerText = obj.val.toFixed(decimals) + suffix;
        }
      }
    });
  }, [value]);

  return <span ref={countRef}>0</span>;
}

function StatCard({ title, value, subtitle, icon, iconColor, bgColor, trend, suffix = "", className, isMicro }) {
  return (
    <Card className={cn(
      "rounded-3xl bg-muted/30 border border-border transition-all group overflow-hidden relative min-w-0",
      isMicro ? "p-3" : "p-0",
      className
    )}>
      <div className={cn(
        "absolute top-0 right-0 rotate-12 translate-x-4 -translate-y-4 opacity-5 bg-primary rounded-full group-hover:scale-110 transition-transform",
        isMicro ? "p-4" : "p-8"
      )} />
      <CardContent className={cn("p-0 flex flex-col h-full", !isMicro && "p-5")}>
        <div className="flex items-start justify-between relative">
          <div className={cn(
            "rounded-2xl transition-transform group-hover:scale-110 flex items-center justify-center shrink-0",
            isMicro ? "p-2 w-8 h-8" : "p-3 w-12 h-12",
            bgColor,
            iconColor
          )}>
            {icon}
          </div>
          {trend !== undefined && trend !== null && (
            <div className={cn(
              "flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg text-[9px] font-black",
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
            "font-black text-muted-foreground uppercase tracking-[0.1em] mb-0.5 truncate",
            isMicro ? "text-[8px]" : "text-[10px]"
          )}>
            {title}
          </p>
          <h2 className={cn(
            "font-black text-foreground leading-none flex items-baseline gap-0.5",
            isMicro ? "text-base mt-0.5" : "text-3xl mt-1.5"
          )}>
            <GlowCounter value={value} suffix={suffix} decimals={suffix === 't' ? 1 : 0} />
          </h2>
          <p className={cn(
            "text-muted-foreground font-bold tracking-tight truncate",
            isMicro ? "text-[8px] mt-1" : "text-[10px] mt-1.5"
          )}>
            {subtitle}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

const CustomVolumeTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card rounded-2xl shadow-xl border border-border p-4 max-w-[220px]">
        <p className="text-xs font-black text-foreground mb-1">{data.displayDate}</p>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-indigo-500" />
          <p className="text-sm font-bold text-foreground">
            {(data.volume / 1000).toFixed(1)} <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">tons</span>
          </p>
        </div>

        {data.exerciseCount > 0 && (
          <div className="pt-3 border-t border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1">
                <Dumbbell size={10} /> MOVEMENTS
              </span>
              <span className="text-xs font-black text-foreground">{data.exerciseCount}</span>
            </div>
            {data.muscles && data.muscles.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {data.muscles.map((m, i) => (
                  <span key={i} className="px-1.5 py-0.5 bg-muted text-foreground/80 rounded text-[9px] font-bold uppercase tracking-wider">
                    {m}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
  return null;
};


const CustomExerciseTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[1]?.payload || payload[0]?.payload; // Fallback to either
    return (
      <div className="bg-card rounded-2xl shadow-xl border border-border p-4 min-w-[180px]">
        <p className="text-xs font-black text-foreground mb-3 border-b border-border pb-2">
          {formatDateDisplay(data.date)}
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Max Lift</span>
            </div>
            <p className="text-sm font-black text-foreground">{data.weight}kg</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full border border-indigo-500 border-dashed" />
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Est. 1RM</span>
            </div>
            <p className="text-sm font-black text-indigo-600">{data.est1RM}kg</p>
          </div>

          <div className="pt-2 border-t border-border mt-2">
            <div className="flex items-center justify-between opacity-60">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Reps Performed</span>
              <span className="text-xs font-black text-foreground">{data.reps}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

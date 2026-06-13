import { ArrowRight, BarChart3, CalendarDays, Dumbbell, Github, HeartPulse, LineChart, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import LandingShowcase from './LandingShowcase';

const githubUrl = 'https://github.com/PerspicaciousGuy/GymPlanner';

const featureCards = [
  {
    icon: CalendarDays,
    label: 'Plan',
    title: 'Build training blocks',
    body: 'Map routines across weeks, cycles, and split sessions before you step into the gym.',
  },
  {
    icon: Dumbbell,
    label: 'Log',
    title: 'Track every working set',
    body: 'Capture exercises, reps, weight, drop sets, and notes without losing the session flow.',
  },
  {
    icon: HeartPulse,
    label: 'Recover',
    title: 'See what needs attention',
    body: 'Use recovery and focus signals to balance muscle groups across the week.',
  },
  {
    icon: BarChart3,
    label: 'Review',
    title: 'Understand progress',
    body: 'Review history, volume, consistency, and trends from the same place you plan.',
  },
];

const workflowSteps = ['Create routine', 'Schedule week', 'Log workout', 'Review progress'];

const heroMetrics = [
  { value: '4', label: 'planning modes' },
  { value: '9', label: 'tracked views' },
  { value: '30d', label: 'review window' },
];

export default function LandingPage({ onStart, onSignIn, onOpenPlanner }) {
  return (
    <main className="min-h-screen overflow-hidden bg-[var(--app-bg)] text-foreground">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[var(--app-radius-md)] bg-foreground text-background shadow-[var(--app-shadow-sm)]">
            <span className="text-xl font-bold">G</span>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal">GymPlanner</p>
            <p className="text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">Training OS</p>
          </div>
        </div>

        <nav className="hidden items-center gap-6 text-[11px] font-semibold uppercase tracking-normal text-muted-foreground md:flex">
          <a href="#workflow" className="transition-colors hover:text-foreground">Workflow</a>
          <a href="#showcase" className="transition-colors hover:text-foreground">Preview</a>
          <button onClick={onSignIn} className="transition-colors hover:text-foreground">Sign In</button>
        </nav>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-84px)] w-full max-w-7xl flex-col items-center justify-center px-5 pb-10 pt-8 text-center sm:px-8 lg:px-10">
        <div className="max-w-4xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-[var(--app-radius-sm)] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-normal text-muted-foreground shadow-[var(--app-shadow-sm)]">
            <Sparkles size={14} />
            Plan. Log. Recover. Review.
          </div>

          <h1 className="mx-auto max-w-4xl text-5xl font-semibold leading-[1.02] tracking-normal text-foreground sm:text-6xl lg:text-7xl">
            Train with a plan, not guesswork.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base font-medium leading-7 text-muted-foreground sm:text-lg">
            Build routines, schedule sessions, track completion, and understand your progress across training, recovery, and nutrition.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              onClick={onStart}
              className="h-12 rounded-[var(--app-radius-md)] bg-foreground px-6 text-sm font-semibold text-background shadow-[var(--app-shadow-sm)] hover:bg-foreground/90"
            >
              Start Planning
              <ArrowRight size={18} className="ml-2" />
            </Button>
            <Button
              variant="outline"
              onClick={onOpenPlanner}
              className="h-12 rounded-[var(--app-radius-md)] border-[var(--app-border)] bg-[var(--app-surface)] px-6 text-sm font-semibold text-foreground shadow-none hover:bg-[var(--app-surface-muted)]"
            >
              Open Local Planner
            </Button>
          </div>
        </div>

        <div className="mt-12 w-full">
          <div className="mx-auto grid max-w-2xl grid-cols-3 overflow-hidden rounded-[var(--app-radius-lg)] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--app-shadow-sm)]">
            {heroMetrics.map((metric) => (
              <div key={metric.label} className="border-r border-[var(--app-border)] px-4 py-4 last:border-r-0">
                <p className="text-2xl font-semibold leading-none text-foreground">{metric.value}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">{metric.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 overflow-hidden rounded-[var(--app-radius-lg)] border border-[var(--app-border)] bg-[var(--app-surface)] p-3 shadow-[var(--app-shadow-md)]">
            <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
              <img
                src="/landing/screenshots/analytics-overview.png"
                alt="GymPlanner analytics overview"
                className="aspect-video h-full w-full rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] object-contain object-top"
              />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <img
                  src="/landing/screenshots/training-plan.png"
                  alt="GymPlanner training plan builder"
                  className="aspect-video h-full w-full rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] object-contain object-top"
                />
                <img
                  src="/landing/screenshots/recovery-map.png"
                  alt="GymPlanner recovery map"
                  className="aspect-video h-full w-full rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] object-contain object-top"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="border-y border-[var(--app-border)] bg-[var(--app-surface)]">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-12 sm:px-8 lg:grid-cols-4 lg:px-10">
          {featureCards.map((feature) => (
            <article key={feature.title} className="rounded-[var(--app-radius-lg)] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[var(--app-shadow-sm)]">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-[var(--app-radius-md)] bg-[var(--app-surface-muted)] text-foreground">
                <feature.icon size={20} />
              </div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">{feature.label}</p>
              <h2 className="text-lg font-semibold text-foreground">{feature.title}</h2>
              <p className="mt-3 text-sm font-medium leading-6 text-muted-foreground">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <LandingShowcase />

      <section id="preview" className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:px-10">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">Daily Workflow</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
            One loop from plan to progress.
          </h2>
          <div className="mt-8 space-y-3">
            {workflowSteps.map((step, index) => (
              <div key={step} className="flex items-center gap-4 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-[var(--app-shadow-sm)]">
                <span className="flex h-8 w-8 items-center justify-center rounded-[var(--app-radius-sm)] bg-foreground text-xs font-semibold text-background">
                  {index + 1}
                </span>
                <span className="text-sm font-semibold text-foreground">{step}</span>
              </div>
            ))}
          </div>
        </div>

        <ProductPreviewGrid />
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 lg:px-10">
        <div className="flex flex-col items-start justify-between gap-6 rounded-[var(--app-radius-lg)] border border-[var(--app-border)] bg-foreground p-8 text-background shadow-[var(--app-shadow-md)] md:flex-row md:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-normal text-background/70">Ready for the next block?</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal">Build your training week with intent.</h2>
          </div>
          <Button
            onClick={onStart}
            className="h-12 rounded-[var(--app-radius-md)] bg-background px-6 text-sm font-semibold text-foreground hover:bg-background/90"
          >
            Start Planning
            <ArrowRight size={18} className="ml-2" />
          </Button>
        </div>
      </section>

      <footer className="border-t border-[var(--app-border)] bg-[var(--app-surface)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-foreground">GymPlanner</p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">Plan, log, recover, and review your training.</p>
          </div>

          <a
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center gap-2 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-xs font-semibold uppercase tracking-normal text-foreground shadow-[var(--app-shadow-sm)] transition-colors hover:bg-[var(--app-surface-muted)]"
          >
            <Github size={16} />
            GitHub
          </a>
        </div>
      </footer>
    </main>
  );
}

function ProductPreviewGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-[var(--app-radius-lg)] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[var(--app-shadow-sm)]">
        <p className="mb-4 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">Training Plan</p>
        {['Push Strength', 'Pull Volume', 'Legs + Core'].map((item, index) => (
          <div key={item} className="mb-3 flex items-center justify-between rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
            <div>
              <p className="text-sm font-semibold">{item}</p>
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">Day {index + 1}</p>
            </div>
            <Dumbbell size={18} className="text-muted-foreground" />
          </div>
        ))}
      </div>

      <div className="rounded-[var(--app-radius-lg)] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[var(--app-shadow-sm)]">
        <p className="mb-4 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">Progress Signal</p>
        <div className="flex h-40 items-end gap-2 rounded-[var(--app-radius-md)] bg-[var(--app-surface-muted)] p-4">
          {[42, 58, 50, 72, 64, 86, 78].map((height, index) => (
            <div key={index} className="flex flex-1 items-end">
              <div className="w-full rounded-t-[var(--app-radius-sm)] bg-foreground" style={{ height: `${height}%` }} />
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm font-semibold">
          <LineChart size={18} />
          Volume trending up
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { ArrowLeft, ArrowRight, BarChart3, CalendarDays, Dumbbell, HeartPulse } from 'lucide-react';
import { Button } from '@/components/ui/button';

const showcaseSlides = [
  {
    title: 'Training hub',
    eyebrow: 'Today at a glance',
    description: 'Start from the week view, check body metrics, and jump straight into the planned session.',
    image: '/landing/screenshots/training-hub.png',
    icon: Dumbbell,
  },
  {
    title: 'Session logging',
    eyebrow: 'Set-by-set control',
    description: 'Expand a workout day, adjust exercises, and keep logging controls close to the work.',
    image: '/landing/screenshots/training-session.png',
    icon: Dumbbell,
  },
  {
    title: 'Nutrition log',
    eyebrow: 'Daily health context',
    description: 'Track calories and macros beside the training week so recovery decisions stay grounded.',
    image: '/landing/screenshots/health-nutrition.png',
    icon: HeartPulse,
  },
  {
    title: 'Routine library',
    eyebrow: 'Reusable templates',
    description: 'Keep repeatable workout templates ready for planning blocks and quick session setup.',
    image: '/landing/screenshots/routines-library.png',
    icon: CalendarDays,
  },
  {
    title: 'Training plan',
    eyebrow: 'Schedule builder',
    description: 'Build fixed-week or dynamic cycles, then preview upcoming training days before they land.',
    image: '/landing/screenshots/training-plan.png',
    icon: CalendarDays,
  },
  {
    title: 'Performance insights',
    eyebrow: 'Progress review',
    description: 'Review volume, consistency, records, focus distribution, and training trends from one screen.',
    image: '/landing/screenshots/analytics-overview.png',
    icon: BarChart3,
  },
  {
    title: 'Workout history',
    eyebrow: 'Completion calendar',
    description: 'Scan done, skipped, missed, and planned days with the same status language used in the app.',
    image: '/landing/screenshots/analytics-history.png',
    icon: CalendarDays,
  },
  {
    title: 'Recovery map',
    eyebrow: 'Fatigue feedback',
    description: 'Use the muscle map and recovery feed to spot what is ready and what needs more time.',
    image: '/landing/screenshots/recovery-map.png',
    icon: HeartPulse,
  },
  {
    title: 'Exercise detail',
    eyebrow: 'Movement history',
    description: 'Inspect per-exercise records and past performance without leaving the training workflow.',
    image: '/landing/screenshots/exercise-detail.png',
    icon: BarChart3,
  },
];

export default function LandingShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = showcaseSlides[activeIndex];
  const ActiveIcon = activeSlide.icon;

  const goToPrevious = () => {
    setActiveIndex((currentIndex) => (
      currentIndex === 0 ? showcaseSlides.length - 1 : currentIndex - 1
    ));
  };

  const goToNext = () => {
    setActiveIndex((currentIndex) => (
      currentIndex === showcaseSlides.length - 1 ? 0 : currentIndex + 1
    ));
  };

  return (
    <section id="showcase" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
      <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">Product Screens</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
            A planner that looks like the work you actually do.
          </h2>
          <p className="mt-4 text-sm font-medium leading-6 text-muted-foreground sm:text-base">
            Real training views, not abstract dashboards. Move from weekly planning to logging, nutrition, history, and recovery without switching systems.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={goToPrevious}
            aria-label="Show previous screenshot"
            className="h-11 w-11 rounded-[var(--app-radius-md)] border-[var(--app-border)] bg-[var(--app-surface)] p-0 shadow-[var(--app-shadow-sm)] hover:bg-[var(--app-surface-muted)]"
          >
            <ArrowLeft size={17} />
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={goToNext}
            aria-label="Show next screenshot"
            className="h-11 w-11 rounded-[var(--app-radius-md)] border-[var(--app-border)] bg-[var(--app-surface)] p-0 shadow-[var(--app-shadow-sm)] hover:bg-[var(--app-surface-muted)]"
          >
            <ArrowRight size={17} />
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.36fr_0.64fr]">
        <aside className="rounded-[var(--app-radius-lg)] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[var(--app-shadow-sm)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-[var(--app-radius-md)] bg-foreground text-background">
            <ActiveIcon size={21} />
          </div>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">{activeSlide.eyebrow}</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-normal text-foreground">{activeSlide.title}</h3>
          <p className="mt-4 text-sm font-medium leading-6 text-muted-foreground">{activeSlide.description}</p>

          <div className="mt-6 grid gap-2">
            {showcaseSlides.map((slide, index) => (
              <button
                key={slide.title}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`flex items-center justify-between rounded-[var(--app-radius-md)] border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-normal transition-colors ${
                  index === activeIndex
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-[var(--app-border)] bg-[var(--app-surface)] text-muted-foreground hover:bg-[var(--app-surface-muted)] hover:text-foreground'
                }`}
              >
                <span>{slide.title}</span>
                <span>{String(index + 1).padStart(2, '0')}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="overflow-hidden rounded-[var(--app-radius-lg)] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--app-shadow-md)]">
          <div className="border-b border-[var(--app-border)] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">GymPlanner</p>
                <p className="text-sm font-semibold text-foreground">{activeSlide.title}</p>
              </div>
              <div className="rounded-[var(--app-radius-sm)] bg-foreground px-3 py-1.5 text-[10px] font-semibold uppercase text-background">
                Live screen
              </div>
            </div>
          </div>

          <div className="bg-[var(--app-surface-muted)] p-3 sm:p-4">
            <img
              src={activeSlide.image}
              alt={`${activeSlide.title} screenshot`}
              className="h-auto w-full rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] object-cover shadow-[var(--app-shadow-sm)]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

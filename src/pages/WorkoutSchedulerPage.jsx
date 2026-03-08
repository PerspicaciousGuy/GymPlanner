import { useMemo, useState, useEffect } from 'react';
import WorkoutSection from '../components/WorkoutSection';
import { loadSessionTitles, loadWorkouts, isDayComplete, ensureAmPm, syncPlannerData } from '../utils/storage';

function getDayName(date) {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getDayName(d);
}

function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return getDayName(d);
}

function AccordionSection({ section, defaultOpen, syncToken }) {
  const [open, setOpen] = useState(defaultOpen);

  const titles = loadSessionTitles();
  const amTarget = titles.am?.[section.day] || '';
  const pmTarget = titles.pm?.[section.day] || '';

  const focusAreas = useMemo(() => {
    const areas = [];
    if (amTarget && amTarget.toLowerCase() !== 'rest' && amTarget.toLowerCase() !== 'off') areas.push(amTarget);
    if (pmTarget && pmTarget.toLowerCase() !== 'rest' && pmTarget.toLowerCase() !== 'off') areas.push(pmTarget);
    return areas;
  }, [amTarget, pmTarget]);

  return (
    <div className={`premium-card overflow-hidden mb-6 transition-all duration-500 ring-1 ring-black/5 ${open ? 'shadow-2xl shadow-blue-50/50' : 'hover:bg-gray-50/30'}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-8 py-7 bg-white transition-all ${open ? 'pb-4' : ''}`}
      >
        <div className="flex items-center gap-6">
          <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center text-2xl shadow-sm transition-all duration-500 ${open ? 'bg-[#FF9500] text-white' : 'bg-[#FAFAFA] text-[#8E8E93] border border-gray-100'}`}>
            {section.day === getDayName(new Date()) ? (
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M17.66 11.2c-.23-.3-.51-.56-.77-.82-.67-.6-1.41-1.09-2.12-1.67-1.1-1.01-2.15-2.1-2.43-3.62-.03-.13-.05-.27-.03-.4 0-.3-.02-.59-.02-.88 0-.31-.2-.59-.49-.68-.28-.09-.59.04-.74.29-.31.52-.35 1.15-.3 1.74.05.6.3 1.2.61 1.74.05.08.1.16.14.25.04.06.07.13.09.2.14.36.03.77-.28 1.01-.29.23-.7.25-1.03.09-.34-.17-.63-.44-.9-.72-.34-.35-.64-.73-.99-1.07-.12-.12-.33-.08-.4.07-.44.88-.41 1.96-.06 2.87.03.07.03.14.05.21 0 .04.01.09.02.13.05.3.11.59.18.88.01.03.01.07.03.1.2.9.71 1.71 1.41 2.33.68.59 1.54.91 2.41 1.07.87.15 1.77.12 2.65-.05.81-.15 1.59-.45 2.27-.93.68-.48 1.23-1.15 1.55-1.92.31-.76.36-1.61.12-2.39z" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </div>
          <div className="flex flex-col items-start px-1">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-[#1C1C1E] tracking-tight">
                {section.day} {section.day === getDayName(new Date()) ? '(Today)' : section.isTomorrow ? '(Tomorrow)' : ''}
              </span>
              {section.day === getDayName(new Date()) && (
                <span className="bg-[#34C759]/10 text-[#34C759] text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest border border-[#34C759]/20">Active</span>
              )}
            </div>
            <span className="text-[#8E8E93] font-bold text-[10px] uppercase tracking-widest mt-1">
              Weekly Focus: {section.muscleGroup || 'General Conditioning'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {!open && focusAreas.length > 0 && (
            <div className="hidden lg:flex items-center gap-2">
              {focusAreas.map(area => (
                <span key={area} className="text-[10px] font-black uppercase tracking-widest text-[#8E8E93] bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">{area}</span>
              ))}
            </div>
          )}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border border-gray-100 transition-all duration-500 ${open ? 'rotate-180 bg-gray-50 text-[#1C1C1E]' : 'text-[#8E8E93]'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      <div className={`transition-all duration-700 ease-[cubic-bezier(0.4, 0, 0.2, 1)] ${open ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
        <div className="px-8 pb-10 pt-4">
          <WorkoutSection
            day={section.day}
            muscleGroup={section.muscleGroup}
            isMissed={section.isMissed}
            isTomorrow={section.isTomorrow}
            initialData={section.data}
            syncToken={syncToken}
            hideBadge
          />
        </div>
      </div>
    </div>
  );
}

export default function WorkoutSchedulerPage({ syncKey = 'local' }) {
  const today = getDayName(new Date());
  const tomorrow = getTomorrow();
  const [syncState, setSyncState] = useState('loading');

  useEffect(() => {
    syncPlannerData().then((ok) => setSyncState(ok ? 'ok' : 'offline'));
  }, [syncKey]);

  const sections = useMemo(() => {
    const titles = loadSessionTitles();
    const workouts = loadWorkouts();

    // Show Today and Tomorrow
    return [
      { day: today, muscleGroup: titles.am?.[today] || titles.pm?.[today], isMissed: false, isTomorrow: false, data: ensureAmPm(workouts[today]) },
      { day: tomorrow, muscleGroup: titles.am?.[tomorrow] || titles.pm?.[tomorrow], isMissed: false, isTomorrow: true, data: ensureAmPm(workouts[tomorrow]) }
    ];
  }, [syncState, today, tomorrow]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 flex flex-col gap-6 md:gap-10 bg-white min-h-screen relative pb-40 md:pb-32">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-0 animate-apple">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-[#1C1C1E] tracking-tighter">Workout Scheduler</h1>
          <div className="flex items-center gap-2 mt-2 md:mt-4 text-[#8E8E93] font-bold tracking-tight text-xs md:text-sm">
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <button className="pill-button pill-button-secondary bg-[#FAFAFA] flex-1 md:flex-none">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            History
          </button>
          <button className="pill-button pill-button-primary flex-1 md:flex-none" onClick={() => window.location.reload()}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Save
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col animate-apple" style={{ animationDelay: '0.1s' }}>
        {sections.map((s) => (
          <AccordionSection
            key={s.day}
            section={s}
            defaultOpen={!s.isTomorrow}
            syncToken={syncState}
          />
        ))}

        {/* Placeholder for Add New Group button */}
        <div className="mt-4 border-2 border-dashed border-gray-100 rounded-[24px] md:rounded-[28px] py-6 md:py-8 flex flex-col items-center justify-center gap-3 bg-gray-50/20 hover:bg-white hover:border-[#007AFF] transition-all cursor-pointer group">
          <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-[#8E8E93] group-hover:text-[#007AFF] group-hover:border-[#007AFF] transition-all">
            <span className="text-2xl font-light">+</span>
          </div>
          <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-[#8E8E93] group-hover:text-[#007AFF]">New Training Block</span>
        </div>
      </div>

      {/* Fixed Status Bar - Hidden on small mobile to avoid clutter, shown on md+ */}
      <div className="status-bar animate-apple hidden md:flex">
        <div className="flex items-center gap-12">
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Volume (Est)</span>
            <span className="text-sm font-black text-[#1C1C1E]">1,240 kg</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Est. Duration</span>
            <span className="text-sm font-black text-[#1C1C1E]">45 mins</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Exercises</span>
            <span className="text-sm font-black text-[#1C1C1E]">8 movements</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] italic text-gray-400 font-medium">Autosaved at {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
}

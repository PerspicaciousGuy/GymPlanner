import { Boxes, CheckCircle2, Database } from 'lucide-react';

const sidebarItems = [
  { key: 'workouts', label: 'Workouts', icon: Boxes },
  { key: 'completion', label: 'Completion', icon: CheckCircle2 },
  { key: 'exerciseDb', label: 'Exercise DB', icon: Database },
];

export function DataConsoleSidebar({ activeTab, onSetActiveTab }) {
  return (
    <aside className="fixed bottom-0 left-0 top-0 z-50 flex w-20 flex-col items-center gap-8 border-r border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-8 shadow-[var(--app-shadow-sm)] lg:w-24">
      {sidebarItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.key;

        return (
          <button
            key={item.key}
            type="button"
            className="group flex flex-col items-center gap-1"
            onClick={() => onSetActiveTab(item.key)}
          >
            <span className={`rounded-[var(--app-radius-md)] p-3 transition-colors ${isActive ? 'bg-foreground text-background shadow-[var(--app-shadow-sm)]' : 'text-muted-foreground hover:bg-[var(--app-surface-muted)] hover:text-foreground'}`}>
              <Icon size={24} />
            </span>
            <span className={`text-[10px] font-semibold uppercase tracking-normal ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </aside>
  );
}

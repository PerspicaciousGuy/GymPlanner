export const DATA_CONSOLE_TABS = [
  { key: 'workouts', label: 'Workouts' },
  { key: 'completion', label: 'Completion' },
  { key: 'exerciseDb', label: 'Exercise DB' },
];

export function DataConsoleTabs({ activeTab, onSetActiveTab }) {
  return (
    <div className="mb-4 flex items-center gap-2 overflow-x-auto whitespace-nowrap border-b border-[var(--app-border)] px-1 scrollbar-none md:mb-6">
      {DATA_CONSOLE_TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onSetActiveTab(tab.key)}
          className={`relative shrink-0 px-3 pb-3 text-[11px] font-semibold uppercase tracking-normal transition-colors md:text-xs ${activeTab === tab.key
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {tab.label}
          {activeTab === tab.key && (
            <div className="absolute bottom-0 left-2 right-2 h-0.5 rounded-[var(--app-radius-sm)] bg-foreground" />
          )}
        </button>
      ))}
    </div>
  );
}

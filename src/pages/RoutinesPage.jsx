import { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  Dumbbell, 
  Search, 
  Calendar, 
  ChevronRight, 
  Pencil,
  X,
  Repeat
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadTemplates, deleteTemplate, saveTemplate, defaultSession } from '../utils/storage';
import { PageShell } from '../components/layout/PageShell';
import { PageHeader } from '../components/layout/PageHeader';
import { Panel } from '../components/layout/Panel';

export default function RoutinesPage({ onEdit, onOpenTrainingPlan, syncKey }) {
  const [templateRows, setTemplateRows] = useState(() => loadTemplates());
  const [templatesSaved, setTemplatesSaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const flashSaved = () => {
    setTemplatesSaved(true);
    setTimeout(() => setTemplatesSaved(false), 1800);
  };

  useEffect(() => {
    setTemplateRows(loadTemplates());
  }, [syncKey]);

  useEffect(() => {
    const handleSync = () => {
      setTemplateRows(loadTemplates());
    };
    window.addEventListener('gymplanner_sync_completed', handleSync);
    return () => window.removeEventListener('gymplanner_sync_completed', handleSync);
  }, []);

  const removeTemplate = (id) => {
    deleteTemplate(id);
    setTemplateRows(loadTemplates());
    flashSaved();
  };

  const handleCreateNew = () => {
    const session = defaultSession();
    const newT = saveTemplate("New Routine", session.groups, session.standaloneExercises);
    onEdit(newT.id);
  };

  const filteredTemplates = templateRows.filter(t => 
    (t.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageShell size="default" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Routines"
        description="Manage reusable workout templates and session structures."
        actions={(
          <div className="flex flex-col gap-3 w-full md:w-auto lg:flex-row lg:items-center">
          <div className="grid grid-cols-2 gap-2 shrink-0">
            <Button
              onClick={onOpenTrainingPlan}
              variant="outline"
              className="h-10 rounded-[var(--app-radius-md)] border-[var(--app-border)] px-3 text-xs font-semibold uppercase tracking-normal text-foreground shadow-none hover:bg-[var(--app-surface-muted)]"
            >
              <Repeat size={12} strokeWidth={3} />
              <span className="truncate">Training Plan</span>
            </Button>
            <Button
              onClick={handleCreateNew}
              className="h-10 rounded-[var(--app-radius-md)] px-3 text-xs font-semibold uppercase tracking-normal shadow-none"
            >
              <Plus size={12} strokeWidth={3} />
              <span className="truncate">New Routine</span>
            </Button>
          </div>

          <div className="flex flex-1 items-center gap-2 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] p-1.5 shadow-[var(--app-shadow-sm)]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={14} />
              <Input
                placeholder="Search routines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 rounded-[var(--app-radius-sm)] border-transparent bg-[var(--app-surface-muted)] pl-9 text-xs font-semibold shadow-none focus-visible:border-[var(--app-border-strong)] focus-visible:bg-[var(--app-surface)] focus-visible:ring-0"
              />
            </div>
            <div className="hidden xs:flex h-6 w-px bg-[var(--app-border)] mx-1" />
            <div className="hidden xs:block rounded-[var(--app-radius-sm)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground whitespace-nowrap">
              <span className="text-primary">{templateRows.length}</span>
            </div>
          </div>
        </div>
        )}
      />

      {templatesSaved && (
        <div className="fixed top-8 right-8 z-[100] animate-in slide-in-from-right-10 fade-in duration-300">
          <Badge className="flex items-center gap-2 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-foreground px-4 py-2 text-xs font-semibold text-background shadow-[var(--app-shadow-md)]">
             <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
             Synchronized
          </Badge>
        </div>
      )}

      {filteredTemplates.length === 0 ? (
        <Panel className="py-16 text-center border-dashed">
          <div className="mb-5 inline-block">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[var(--app-radius-lg)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] text-muted-foreground">
              <Sparkles size={32} strokeWidth={1.5} />
            </div>
          </div>
          <div className="max-w-md mx-auto px-6 space-y-2">
            <h3 className="text-xl font-semibold text-foreground tracking-normal">Library empty</h3>
            <p className="text-sm text-muted-foreground font-medium leading-6">
              No routines found. Save active sessions as routines to build your library.
            </p>
          </div>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredTemplates.map((t) => {
            // Find target muscles
            const groupMuscles = (t.groups || []).flatMap(g => (g.rows || []).map(r => r.muscle));
            const standaloneMuscles = (t.standaloneExercises || []).map(ex => ex.muscle);
            const muscles = Array.from(new Set([...groupMuscles, ...standaloneMuscles].filter(Boolean))).slice(0, 3);

            return (
            <Panel key={t.id} className="group relative flex flex-col overflow-hidden p-5 transition-colors active:scale-[0.99]" interactive>
              <div className="absolute top-4 right-4 md:top-5 md:right-5 flex items-center gap-1.5 z-20">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(t.id);
                  }}
                  className="h-8 w-8 rounded-[var(--app-radius-sm)] border border-[var(--app-border)] bg-[var(--app-surface)] text-muted-foreground shadow-none transition-all hover:bg-[var(--app-surface-muted)] hover:text-foreground md:opacity-0 md:group-hover:opacity-100 md:translate-y-1 md:group-hover:translate-y-0"
                >
                  <Pencil size={14} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTemplate(t.id);
                  }}
                  className="h-8 w-8 rounded-[var(--app-radius-sm)] border border-[var(--app-border)] bg-[var(--app-surface)] text-muted-foreground shadow-none transition-all hover:bg-destructive/10 hover:text-destructive md:opacity-0 md:group-hover:opacity-100 md:translate-y-1 md:group-hover:translate-y-0 delay-75"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
              
              <div className="flex items-start gap-4 mb-5 relative z-10">
                <div className="bg-foreground text-background h-10 w-10 md:h-11 md:w-11 flex items-center justify-center rounded-[var(--app-radius-md)] shadow-[var(--app-shadow-sm)] shrink-0 transition-transform group-hover:scale-105">
                  <Dumbbell className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div className="flex-1 pr-16 md:pr-10 pt-0.5">
                  <h3 className="text-base md:text-lg font-semibold text-foreground tracking-normal leading-tight break-words">{t.name}</h3>
                  <div className="flex flex-wrap items-center gap-1 mt-2">
                    {muscles.length > 0 ? muscles.map(m => (
                      <span key={m} className="rounded-[var(--app-radius-sm)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-normal text-muted-foreground">{m}</span>
                    )) : (
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-normal flex items-center gap-2">
                         Saved {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'recently'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-auto space-y-5 relative z-10">
                <div className="flex items-center justify-between px-2">
                  <span className="flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-foreground" />
                    Overview
                  </span>
                  <Badge variant="secondary" className="rounded-[var(--app-radius-sm)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-1 text-[10px] font-semibold uppercase tracking-normal text-foreground shadow-none">
                    {(t.groups?.length || 0) + (t.standaloneExercises?.length || 0)} SECTIONS
                  </Badge>
                </div>
                
                <div className="bg-[var(--app-surface-muted)] rounded-[var(--app-radius-md)] p-3 md:p-4 space-y-2.5 md:space-y-3 border border-[var(--app-border)] transition-colors">
                  {(() => {
                    const combined = [
                      ...(t.standaloneExercises || []).map(ex => ({ name: ex.exercise || 'Unnamed', more: 0 })),
                      ...(t.groups || []).map(g => ({ name: g.rows?.[0]?.exercise || 'Unnamed', more: (g.rows || []).length - 1 }))
                    ];
                    return (
                      <>
                        {combined.slice(0, 3).map((item, iIdx) => (
                          <div key={iIdx} className="flex items-center gap-4 group/ex text-ellipsis overflow-hidden">
                            <div className="w-2 h-2 rounded-full bg-[var(--app-border-strong)] shrink-0" />
                            <span className="truncate text-xs font-semibold tracking-normal text-muted-foreground group-hover/ex:text-foreground">
                              {item.name}
                              {item.more > 0 && (
                                <span className="ml-2 rounded-[var(--app-radius-sm)] border border-[var(--app-border)] bg-[var(--app-accent-soft)] px-2 py-0.5 text-[9px] font-semibold text-foreground">
                                  +{item.more}
                                </span>
                              )}
                            </span>
                          </div>
                        ))}
                        {combined.length > 3 && (
                          <div className="pt-3 mt-2 border-t border-border/50 flex items-center justify-center">
                            <p className="text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">
                              + {combined.length - 3} OTHERS
                            </p>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </Panel>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

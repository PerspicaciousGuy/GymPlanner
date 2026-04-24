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
    const newT = saveTemplate("New Routine", session.groups);
    onEdit(newT.id);
  };

  const filteredTemplates = templateRows.filter(t => 
    (t.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">

          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight leading-none uppercase">Routines</h1>
          <p className="text-sm text-muted-foreground font-medium tracking-tight">Manage workout templates and session structures.</p>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center gap-3 w-full md:w-auto">
          <div className="grid grid-cols-2 gap-2 shrink-0">
            <Button
              onClick={onOpenTrainingPlan}
              variant="outline"
              className="h-10 px-3 rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Repeat size={12} strokeWidth={3} />
              <span className="truncate">Training Plan</span>
            </Button>
            <Button
              onClick={handleCreateNew}
              className="h-10 px-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-black uppercase text-[9px] tracking-widest shadow-md shadow-primary/10 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={12} strokeWidth={3} />
              <span className="truncate">New Routine</span>
            </Button>
          </div>

          <div className="flex flex-1 items-center gap-2 bg-card p-1.5 rounded-xl border border-border shadow-sm backdrop-blur-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={14} />
              <Input
                placeholder="Search routines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 rounded-lg border-border bg-muted/50 hover:bg-muted text-[11px] font-bold transition-all focus-visible:bg-card focus-visible:border-primary focus-visible:ring-primary/5 shadow-none"
              />
            </div>
            <div className="hidden xs:flex h-6 w-[1px] bg-border mx-1" />
            <div className="hidden xs:block px-3 py-1.5 text-[9px] font-black text-muted-foreground uppercase tracking-widest bg-muted rounded-lg border border-border/50 whitespace-nowrap">
              <span className="text-primary">{templateRows.length}</span>
            </div>
          </div>
        </div>
      </div>

      {templatesSaved && (
        <div className="fixed top-8 right-8 z-[100] animate-in slide-in-from-right-10 fade-in duration-300">
          <Badge className="bg-emerald-500 text-white border-none shadow-xl shadow-emerald-200/50 font-black px-6 py-3 rounded-2xl text-xs flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
             SYNCHRONIZED TO CLOUD
          </Badge>
        </div>
      )}

      {filteredTemplates.length === 0 ? (
        <div className="py-12 md:py-24 text-center bg-card rounded-[3.5rem] border border-dashed border-border/60 shadow-inner group transition-all hover:bg-muted/30">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl opacity-40 animate-pulse" />
            <div className="relative bg-card w-20 h-20 rounded-[2.5rem] flex items-center justify-center mx-auto text-muted-foreground shadow-2xl border border-border rotate-12 transition-transform group-hover:rotate-0">
              <Sparkles size={32} strokeWidth={1.5} />
            </div>
          </div>
          <div className="max-w-md mx-auto px-6 space-y-2">
            <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Library Empty</h3>
            <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
              No routines found. Save active sessions as routines to build your library.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredTemplates.map((t) => {
            // Find target muscles
            const muscles = Array.from(new Set(
              (t.groups || []).flatMap(g => (g.rows || []).map(r => r.muscle).filter(Boolean))
            )).slice(0, 3);

            return (
            <div key={t.id} className="bg-card rounded-[2rem] border border-border shadow-sm hover:shadow-xl hover:border-primary/20 transition-all group relative overflow-hidden active:scale-[0.99] flex flex-col p-5 md:p-6">
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-48 h-48 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              
              <div className="absolute top-4 right-4 md:top-5 md:right-5 flex items-center gap-1.5 z-20">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(t.id);
                  }}
                  className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-all shadow-sm bg-card border border-border md:opacity-0 md:group-hover:opacity-100 md:translate-y-1 md:group-hover:translate-y-0"
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
                  className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all shadow-sm bg-card border border-border md:opacity-0 md:group-hover:opacity-100 md:translate-y-1 md:group-hover:translate-y-0 delay-75"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
              
              <div className="flex items-start gap-4 mb-5 relative z-10">
                <div className="bg-primary text-primary-foreground h-10 w-10 md:h-12 md:w-12 flex items-center justify-center rounded-xl shadow-lg shadow-primary/10 shrink-0 transform group-hover:-rotate-6 transition-transform group-hover:scale-110">
                  <Dumbbell className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div className="flex-1 pr-16 md:pr-10 pt-0.5">
                  <h3 className="text-base md:text-lg font-black text-foreground tracking-tight leading-none group-hover:text-primary transition-colors uppercase break-words">{t.name}</h3>
                  <div className="flex flex-wrap items-center gap-1 mt-2">
                    {muscles.length > 0 ? muscles.map(m => (
                      <span key={m} className="px-1.5 py-0.5 bg-muted text-[7px] font-black text-foreground/70 rounded-md border border-border uppercase tracking-widest">{m}</span>
                    )) : (
                      <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
                         Saved {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'recently'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-auto space-y-5 relative z-10">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(212,255,0,0.5)]" />
                    Overview
                  </span>
                  <Badge variant="secondary" className="bg-muted text-foreground border border-border font-black text-[10px] px-3 py-1 rounded-xl uppercase tracking-wider shadow-sm">
                    {t.groups?.length || 0} SECTIONS
                  </Badge>
                </div>
                
                <div className="bg-muted/50 rounded-[1.5rem] md:rounded-[2rem] p-3 md:p-4 space-y-2.5 md:space-y-3 border border-border/50 group-hover:bg-card group-hover:border-primary/20 transition-all">
                  {(t.groups || []).slice(0, 3).map((group, gIdx) => (
                    <div key={gIdx} className="flex items-center gap-4 group/ex text-ellipsis overflow-hidden">
                      <div className="w-2 h-2 rounded-full bg-border group-hover/ex:bg-primary transition-colors shrink-0" />
                      <span className="text-xs font-black text-muted-foreground truncate tracking-tight group-hover/ex:text-foreground">
                        {group.rows?.[0]?.exercise || 'Unnamed'}
                        {(group.rows || []).length > 1 && (
                          <span className="text-primary ml-2 font-black text-[9px] bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                            +{(group.rows || []).length - 1} MORE
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                  {(t.groups || []).length > 3 && (
                    <div className="pt-3 mt-2 border-t border-border/50 flex items-center justify-center">
                      <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em]">
                        + {(t.groups || []).length - 3} OTHERS
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

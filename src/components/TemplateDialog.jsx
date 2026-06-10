import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Trash2, 
  Plus, 
  ChevronRight, 
  Search,
  Clock,
  Dumbbell,
  Calendar
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadTemplates, deleteTemplate, saveTemplate } from '../utils/storage';

export default function TemplateDialog({ open, onOpenChange, mode = 'load', currentGroups = [], currentStandaloneExercises = [], onSelect }) {
  const [templates, setTemplates] = useState([]);
  const [templateName, setTemplateName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (open) {
      setTemplates(loadTemplates());
      setTemplateName('');
      setSearchQuery('');
    }
  }, [open]);

  const handleSave = () => {
    if (!templateName.trim()) return;
    saveTemplate(templateName.trim(), currentGroups, currentStandaloneExercises);
    onOpenChange(false);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    deleteTemplate(id);
    setTemplates(loadTemplates());
  };

  const safeTemplates = Array.isArray(templates) ? templates : [];
  const filteredTemplates = safeTemplates.filter(t => 
    t && t.name && t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] max-w-md overflow-hidden rounded-[var(--app-radius-lg)] border border-[var(--app-border)] bg-[var(--app-surface)] p-0 shadow-[var(--app-shadow-md)]">
        <DialogHeader className="relative overflow-hidden border-b border-[var(--app-border)] bg-foreground p-8 pb-10 text-background">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="rounded-[var(--app-radius-md)] border border-background/10 bg-background/15 p-2.5">
                <Sparkles size={22} className="text-background" />
              </div>
              <DialogTitle className="text-3xl font-semibold leading-none tracking-normal">
                {mode === 'save' ? 'Save Routine' : 'Load Routine'}
              </DialogTitle>
            </div>
            <DialogDescription className="max-w-[90%] text-sm font-medium leading-relaxed text-background/75">
              {mode === 'save' 
                ? 'Capture your current session setup into a reusable elite protocol.' 
                : 'Choose a master routine to instantly pre-fill your training session.'}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="relative z-20 max-h-[60vh] space-y-6 overflow-y-auto p-6 scrollbar-none">
          {mode === 'save' ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-3">
                <label className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
                  <div className="h-1 w-1 rounded-full bg-foreground" />
                  Routine Identity
                </label>
                <div className="relative group">
                  <Input 
                    autoFocus
                    placeholder="e.g. Hypertrophy: Lower A" 
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="h-14 rounded-[var(--app-radius-md)] border-[var(--app-border)] bg-[var(--app-surface-muted)] text-base font-semibold text-foreground shadow-[var(--app-shadow-sm)] transition-colors focus-visible:border-[var(--app-border-strong)] focus-visible:bg-[var(--app-surface)] focus-visible:ring-0"
                  />
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground transition-colors group-focus-within:text-foreground">
                    Required
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-4 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-5">
                <div className="shrink-0 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] p-2.5 text-foreground shadow-[var(--app-shadow-sm)]">
                  <Dumbbell size={20} />
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-normal text-foreground">Session Summary</p>
                  <p className="text-[11px] font-medium leading-relaxed text-muted-foreground">
                    Will preserve <span className="font-semibold text-foreground">{currentGroups.length} {currentGroups.length === 1 ? 'group' : 'groups'}</span> and <span className="font-semibold text-foreground">{currentStandaloneExercises.length} standalone {currentStandaloneExercises.length === 1 ? 'exercise' : 'exercises'}</span> with all target sets, reps, and load benchmarks.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-foreground" size={16} />
                <Input 
                  placeholder="Search your library..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 rounded-[var(--app-radius-md)] border-[var(--app-border)] bg-[var(--app-surface-muted)] pl-12 text-xs font-semibold shadow-[var(--app-shadow-sm)] transition-colors hover:bg-[var(--app-surface-raised)] focus-visible:border-[var(--app-border-strong)] focus-visible:bg-[var(--app-surface)] focus-visible:ring-0"
                />
              </div>

              <div className="space-y-3">
                {filteredTemplates.length === 0 ? (
                  <div className="py-16 text-center space-y-4">
                    <div className="inline-block">
                      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[var(--app-radius-lg)] border border-[var(--app-border)] bg-[var(--app-surface)] text-muted-foreground shadow-[var(--app-shadow-sm)]">
                        <Dumbbell size={32} strokeWidth={1.5} />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold tracking-normal text-foreground">No Routines Found</p>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">Save a workout session as a routine to see it here</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {filteredTemplates.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => onSelect(t)}
                        className="group relative flex w-full items-center justify-between overflow-hidden rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[var(--app-shadow-sm)] transition-[box-shadow,border-color,background-color,transform] hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface-raised)] hover:shadow-[var(--app-shadow-md)] active:scale-[0.98]"
                      >
                        <div className="text-left relative z-10">
                          <p className="text-[15px] font-semibold tracking-normal text-foreground transition-colors">{t.name}</p>
                          <div className="flex items-center gap-4 mt-1.5">
                            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">
                              <Calendar size={12} /> {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'Unknown Date'}
                            </span>
                            <div className="h-1 w-1 rounded-full bg-[var(--app-border)]" />
                            <span className="rounded-[var(--app-radius-sm)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-normal text-foreground">
                              {(t.groups || []).length} Sections
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 relative z-10">
                          <div 
                            onClick={(e) => handleDelete(t.id, e)}
                            className="translate-x-2 rounded-[var(--app-radius-sm)] p-2.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:translate-x-0 group-hover:opacity-100"
                            title="Delete Routine"
                          >
                            <Trash2 size={16} />
                          </div>
                          <div className="rounded-[var(--app-radius-md)] bg-[var(--app-surface-muted)] p-3 text-muted-foreground shadow-[var(--app-shadow-sm)] transition-colors group-hover:bg-foreground group-hover:text-background">
                            <ChevronRight size={18} strokeWidth={3} />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="relative z-30 border-t border-[var(--app-border)] bg-[var(--app-surface)] p-6">
          {mode === 'save' ? (
            <div className="flex gap-4 w-full">
              <Button 
                variant="ghost" 
                onClick={() => onOpenChange(false)}
                className="h-11 flex-1 rounded-[var(--app-radius-md)] border border-[var(--app-border)] text-[10px] font-semibold uppercase tracking-normal text-muted-foreground transition-colors hover:bg-[var(--app-surface-muted)] hover:text-foreground"
              >
                Dismiss
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!templateName.trim()}
                className="h-11 flex-[1.5] rounded-[var(--app-radius-md)] bg-foreground text-[10px] font-semibold uppercase tracking-normal text-background shadow-[var(--app-shadow-sm)] transition-colors hover:bg-foreground/90"
              >
                Save Routine
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="h-11 w-full rounded-[var(--app-radius-md)] border-[var(--app-border)] text-[10px] font-semibold uppercase tracking-normal text-muted-foreground shadow-[var(--app-shadow-sm)] transition-colors hover:bg-[var(--app-surface-muted)] hover:text-foreground"
            >
              Close Window
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

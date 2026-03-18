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
  X
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadTemplates, deleteTemplate, updateTemplate } from '../utils/storage';
import { cn } from "@/lib/utils";

export default function RoutinesPage() {
  const [templateRows, setTemplateRows] = useState(() => loadTemplates());
  const [templatesSaved, setTemplatesSaved] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const flashSaved = () => {
    setTemplatesSaved(true);
    setTimeout(() => setTemplatesSaved(false), 1800);
  };

  const removeTemplate = (id) => {
    deleteTemplate(id);
    setTemplateRows(loadTemplates());
    flashSaved();
  };

  const handleUpdateTemplate = (id, newName, newGroups) => {
    updateTemplate(id, newName.trim(), newGroups);
    setTemplateRows(loadTemplates());
    flashSaved();
    setEditingTemplate(null);
  };

  const filteredTemplates = templateRows.filter(t => 
    (t.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-black tracking-[0.3em] uppercase text-[9px] px-3 py-1 rounded-full animate-pulse">
            Institutional Library
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black text-foreground tracking-tighter leading-none italic uppercase italic">Protocols</h1>
          <p className="text-base text-slate-500 font-black tracking-widest uppercase text-[10px] opacity-70">Architecture for peak performance repository.</p>
        </div>

        <div className="flex items-center gap-4 bg-card/50 p-2.5 rounded-[2rem] border border-white/5 shadow-2xl backdrop-blur-xl">
           <div className="relative group min-w-[280px]">
             <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary transition-all duration-300" size={18} />
             <Input 
               placeholder="IDENTIFY PROTOCOL..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="pl-12 h-14 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 text-[11px] font-black uppercase tracking-widest transition-all focus-visible:bg-white/10 focus-visible:border-primary/30 focus-visible:ring-primary/5 shadow-none placeholder:text-slate-700"
             />
           </div>
           <div className="h-10 w-[1px] bg-white/5 mx-1" />
           <div className="px-5 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] bg-white/5 rounded-2xl border border-white/10">
             RECORDS: <span className="text-primary">{templateRows.length}</span>
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

      {/* Grid of Routines */}
      {filteredTemplates.length === 0 ? (
        <div className="py-40 text-center bg-white/2 rounded-[4rem] border border-dashed border-white/10 shadow-inner group transition-all hover:bg-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative inline-block mb-10">
            <div className="absolute inset-0 bg-primary/20 rounded-[3.5rem] blur-3xl opacity-40 animate-pulse" />
            <div className="relative bg-card w-32 h-32 rounded-[3.5rem] flex items-center justify-center mx-auto text-primary shadow-2xl border border-white/5 rotate-12 transition-transform group-hover:rotate-0 group-hover:scale-110 duration-700">
              <Sparkles size={56} strokeWidth={3} />
            </div>
          </div>
          <div className="max-w-md mx-auto space-y-4 px-8">
            <h3 className="text-4xl font-black text-foreground tracking-tighter uppercase italic">Repository Empty</h3>
            <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.3em] leading-relaxed italic opacity-70">
              No structural protocols detected. Commit active sessions to the library to establish your training architecture.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTemplates.map((t) => (
            <div key={t.id} className="bg-card rounded-[3.5rem] border border-white/5 shadow-2xl p-10 hover:shadow-primary/10 hover:border-primary/30 transition-all duration-500 group relative overflow-hidden active:scale-[0.985] flex flex-col group/protocol">
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
              
              <div className="absolute top-8 right-8 flex items-center gap-3 relative z-30">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setEditingTemplate(t)}
                  className="h-11 w-11 text-slate-600 hover:text-primary hover:bg-primary/10 rounded-2xl transition-all shadow-xl bg-card border border-white/5 opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 duration-300"
                >
                  <Pencil size={18} strokeWidth={3} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => removeTemplate(t.id)}
                  className="h-11 w-11 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all shadow-xl bg-card border border-white/5 opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 duration-300 delay-75"
                >
                  <Trash2 size={18} strokeWidth={3} />
                </Button>
              </div>
              
              <div className="flex items-start gap-6 mb-10 relative z-10">
                <div className="bg-primary text-primary-foreground p-6 rounded-[2.5rem] shadow-[0_10px_30px_rgba(212,255,0,0.3)] shrink-0 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                  <Dumbbell size={32} strokeWidth={3} />
                </div>
                <div className="flex-1 pr-14 pt-2">
                  <h3 className="text-3xl font-black text-foreground tracking-tighter leading-none group-hover:text-primary transition-colors uppercase italic break-words">{t.name}</h3>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                      <Calendar size={12} className="text-slate-800" />
                      Established: <span className="text-slate-400">{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'UNKNOWN'}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-auto space-y-6 relative z-10">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_12px_rgba(212,255,0,0.8)]" />
                    Protocol Payload
                  </span>
                  <Badge variant="secondary" className="bg-white/5 text-primary border border-white/10 font-black text-[10px] px-4 py-2 rounded-xl uppercase tracking-widest shadow-xl">
                    {t.groups?.length || 0} COMPONENTS
                  </Badge>
                </div>
                
                <div className="bg-white/2 rounded-[3.2rem] p-8 space-y-5 border border-white/5 group-hover:bg-white/5 group-hover:border-primary/10 transition-all group-hover:shadow-[0_0_40px_rgba(0,0,0,0.2)]">
                  {(t.groups || []).slice(0, 3).map((group, gIdx) => (
                    <div key={gIdx} className="flex items-center gap-4 group/ex">
                      <div className="w-3 h-3 rounded-full bg-slate-800 group-hover/ex:bg-primary transition-all duration-300 shrink-0 shadow-inner group-hover/ex:scale-110" />
                      <span className="text-[12.5px] font-black text-slate-500 truncate tracking-tight group-hover/ex:text-foreground italic uppercase">
                        {group.rows?.[0]?.exercise || 'UNDEFINED LOAD'}
                        {(group.rows || []).length > 1 && (
                          <span className="text-primary ml-3 font-black text-[9px] bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 tracking-widest">
                            +{(group.rows || []).length - 1} MORE
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                  {(t.groups || []).length > 3 && (
                    <div className="pt-5 mt-2 border-t border-white/5 flex items-center justify-center">
                      <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em]">
                        + {(t.groups || []).length - 3} OVERLOAD VECTORS
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Hover Glow Effect */}
              <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/[0.01] transition-colors pointer-events-none" />
            </div>
          ))}
        </div>
      )}

      {/* Editor Dialog */}
      <TemplateEditorDialog 
        open={!!editingTemplate}
        onOpenChange={(open) => !open && setEditingTemplate(null)}
        template={editingTemplate}
        onSave={handleUpdateTemplate}
      />
    </div>
  );
}

function TemplateEditorDialog({ open, onOpenChange, template, onSave }) {
  const [name, setName] = useState('');
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    if (template) {
      setName(template.name || '');
      setGroups(JSON.parse(JSON.stringify(template.groups || [])));
    }
  }, [template]);

  const handleGroupTextChange = (gIdx, rIdx, field, value) => {
    const next = [...groups];
    if (!next[gIdx].rows) next[gIdx].rows = [];
    next[gIdx].rows[rIdx] = { ...next[gIdx].rows[rIdx], [field]: value };
    setGroups(next);
  };

  const removeGroup = (gIdx) => {
    setGroups(groups.filter((_, i) => i !== gIdx));
  };

  const removeRowFromGroup = (gIdx, rIdx) => {
    const next = [...groups];
    next[gIdx].rows = next[gIdx].rows.filter((_, i) => i !== rIdx);
    if (next[gIdx].rows.length === 0) {
      setGroups(groups.filter((_, i) => i !== gIdx));
    } else {
      setGroups(next);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[94vw] max-w-2xl rounded-[3.5rem] border-white/5 shadow-2xl p-0 overflow-hidden bg-card/95 backdrop-blur-2xl">
        <DialogHeader className="p-12 pb-14 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-80 h-80 bg-white/20 rounded-full blur-3xl opacity-40 shadow-2xl" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-56 h-56 bg-black/10 rounded-full blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-6 mb-5">
              <div className="bg-black/10 p-4 rounded-3xl backdrop-blur-lg border border-white/10 shadow-2xl">
                <Pencil size={32} className="text-primary-foreground drop-shadow-lg" strokeWidth={3} />
              </div>
              <DialogTitle className="text-4xl font-black tracking-tighter leading-none italic uppercase">
                Refine Protocol
              </DialogTitle>
            </div>
            <DialogDescription className="text-primary-foreground/80 font-black text-[11px] uppercase tracking-[0.3em] leading-relaxed max-w-[85%]">
              Architectural overide of elite program structural integrity.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="p-10 space-y-10 max-h-[60vh] overflow-y-auto scrollbar-none">
          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] px-3 flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_#d4ff00]" />
               PROTOCOL DESIGNATION
            </label>
            <Input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-20 rounded-[2.5rem] border-white/5 bg-white/5 font-black text-foreground text-2xl focus-visible:bg-white/10 focus-visible:border-primary/40 transition-all shadow-inner px-8 italic uppercase tracking-tighter"
              placeholder="Designate program..."
            />
          </div>

          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] px-3 flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_#d4ff00]" />
               INFRASTRUCTURE DATA
            </label>
            <div className="space-y-6">
              {groups.map((group, gIdx) => (
                <div key={gIdx} className="border border-white/5 rounded-[3.5rem] p-10 bg-white/2 shadow-2xl hover:border-primary/20 transition-all group/card relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-bl-[6rem] -mr-24 -mt-24 group-hover/card:bg-primary/10 transition-all" />
                  
                  <div className="flex items-center justify-between mb-8 relative z-10">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] bg-primary/10 px-4 py-2 rounded-2xl border border-primary/20">COMPONENT {gIdx + 1}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeGroup(gIdx)}
                      className="h-10 w-10 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                    >
                      <Trash2 size={18} strokeWidth={3} />
                    </Button>
                  </div>
                  <div className="space-y-3 relative z-10">
                      <div key={rIdx} className="flex items-center gap-4 group/row">
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-800 group-hover/row:bg-primary transition-all duration-300 shadow-inner" />
                        <Input 
                          value={row.exercise || ''}
                          onChange={(e) => handleGroupTextChange(gIdx, rIdx, 'exercise', e.target.value)}
                          className="h-12 rounded-xl border-white/5 bg-white/5 hover:bg-white/10 focus-visible:bg-white/15 text-[11px] font-black text-foreground leading-none py-0 shadow-none transition-all flex-1 uppercase tracking-widest italic"
                          placeholder="IDENTIFY LOAD..."
                        />
                        <div className="flex items-center gap-3 pr-2">
                           <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5 group-hover/row:border-primary/20 transition-all">
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">S</span>
                              <input 
                                value={row.sets || ''} 
                                onChange={(e) => handleGroupTextChange(gIdx, rIdx, 'sets', e.target.value)}
                                className="w-8 bg-transparent text-xs font-black text-foreground text-center outline-none italic"
                              />
                           </div>
                           <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5 group-hover/row:border-primary/20 transition-all">
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">R</span>
                              <input 
                                value={row.reps || ''} 
                                onChange={(e) => handleGroupTextChange(gIdx, rIdx, 'reps', e.target.value)}
                                className="w-10 bg-transparent text-xs font-black text-foreground text-center outline-none italic"
                              />
                           </div>
                           <button 
                             onClick={() => removeRowFromGroup(gIdx, rIdx)}
                             className="opacity-0 group-hover/row:opacity-100 transition-all text-slate-600 hover:text-red-500 p-2 rounded-xl hover:bg-red-500/10"
                           >
                             <X size={16} strokeWidth={4} />
                           </button>
                        </div>
                      </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="p-12 bg-white/5 border-t border-white/5 sm:justify-start gap-6">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="flex-1 h-18 rounded-3xl font-black text-slate-600 uppercase text-[11px] tracking-[0.35em] hover:bg-white/5 hover:text-white transition-all border border-white/5 bg-white/2"
          >
            Abort
          </Button>
          <Button 
            onClick={() => onSave(template.id, name, groups)}
            className="flex-[2] h-18 rounded-3xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[11px] tracking-[0.4em] shadow-[0_20px_40px_rgba(212,255,0,0.2)] hover:shadow-[0_25px_50px_rgba(212,255,0,0.3)] transition-all transform active:scale-[0.97]"
          >
            RE-ESTABLISH PROTOCOL
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

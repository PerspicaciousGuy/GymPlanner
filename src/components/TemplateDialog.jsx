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
import { cn } from "@/lib/utils";

export default function TemplateDialog({ open, onOpenChange, mode = 'load', currentGroups = [], onSelect }) {
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
    saveTemplate(templateName.trim(), currentGroups);
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
      <DialogContent className="w-[94vw] max-w-md rounded-[3.5rem] border-white/5 shadow-2xl p-0 overflow-hidden bg-card/95 backdrop-blur-2xl border">
        <DialogHeader className="p-10 pb-12 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-72 h-72 bg-white/20 rounded-full blur-3xl opacity-40 shadow-2xl" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-56 h-56 bg-black/10 rounded-full blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-6 mb-5">
              <div className="bg-black/10 p-4 rounded-3xl backdrop-blur-lg border border-white/10 shadow-2xl">
                <Sparkles size={32} className="text-primary-foreground drop-shadow-lg" strokeWidth={3} />
              </div>
              <DialogTitle className="text-4xl font-black tracking-tighter leading-none italic uppercase">
                {mode === 'save' ? 'Snapshot' : 'Recall'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-primary-foreground/80 font-black text-[11px] uppercase tracking-[0.3em] leading-relaxed max-w-[85%]">
              {mode === 'save' 
                ? 'Finalize structural integrity into a permanent protocol.' 
                : 'Inject a master architecture into the current session.'}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="p-10 -mt-8 relative z-20 space-y-10 max-h-[60vh] overflow-y-auto scrollbar-none">
          {mode === 'save' ? (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] px-3 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_#d4ff00]" />
                  PROTOCOL DESIGNATION
                </label>
                <div className="relative group">
                  <Input 
                    autoFocus
                    placeholder="IDENTIFY PROGRAM..." 
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="h-20 rounded-[2.5rem] border-white/5 bg-white/5 font-black text-foreground text-2xl focus-visible:bg-white/10 focus-visible:border-primary/40 transition-all shadow-inner px-8 italic uppercase tracking-tighter"
                  />
                </div>
              </div>
              
              <div className="bg-white/2 rounded-[3.2rem] p-10 border border-white/5 flex items-start gap-8 shadow-2xl relative overflow-hidden group/alert">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl opacity-20 -mr-16 -mt-16" />
                <div className="bg-primary p-4 rounded-3xl shadow-[0_10px_20px_rgba(212,255,0,0.3)] text-primary-foreground shrink-0 scale-110">
                  <Dumbbell size={28} strokeWidth={3} />
                </div>
                <div className="pt-2">
                  <p className="text-[12px] font-black text-foreground uppercase tracking-[0.2em] mb-2 italic">Architecture Summary</p>
                  <p className="text-[11px] text-slate-500 font-black leading-relaxed uppercase tracking-widest opacity-80">
                    Establishing <span className="text-primary">{currentGroups.length} STRUCTURAL BLOCKS</span> with primary benchmarks and elite load vectors.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-700">
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary transition-all duration-300" size={18} strokeWidth={3} />
                <Input 
                  placeholder="IDENTIFY PROTOCOL..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-14 h-16 rounded-[2rem] border-white/5 bg-white/5 text-[11px] font-black uppercase tracking-widest transition-all focus-visible:bg-white/10 focus-visible:border-primary/30 focus-visible:ring-primary/5 shadow-2xl placeholder:text-slate-700 italic"
                />
              </div>

              <div className="space-y-4">
                {filteredTemplates.length === 0 ? (
                  <div className="py-20 text-center space-y-6">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl animate-pulse" />
                      <div className="relative bg-card w-24 h-24 rounded-[3rem] shadow-2xl border border-white/5 flex items-center justify-center mx-auto text-slate-700 rotate-12 transition-transform hover:rotate-0 duration-500">
                        <Dumbbell size={36} strokeWidth={3} />
                      </div>
                    </div>
                    <div className="max-w-[80%] mx-auto">
                      <p className="text-xl font-black text-foreground tracking-tighter uppercase italic">Repository Empty</p>
                      <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em] mt-3 leading-relaxed">
                        No protocols identified. Finalize a session to populate master storage.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 pb-4">
                    {filteredTemplates.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => onSelect(t)}
                        className="w-full p-8 rounded-[3rem] border border-white/5 bg-white/2 shadow-2xl hover:border-primary/20 hover:bg-white/5 transition-all flex items-center justify-between group relative overflow-hidden active:scale-[0.985]"
                      >
                        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
                        
                        <div className="text-left relative z-10 space-y-2">
                          <p className="font-black text-foreground text-xl tracking-tighter uppercase italic group-hover:text-primary transition-colors">{t.name}</p>
                          <div className="flex items-center gap-5">
                            <span className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                              <Calendar size={12} className="text-slate-800" /> {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'UNKNOWN'}
                            </span>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-800 group-hover:bg-primary shadow-[0_0_8px_rgba(212,255,0,0.5)] transition-all" />
                            <span className="text-[9px] text-primary font-black uppercase tracking-[0.3em] px-3 py-1 bg-primary/10 rounded-xl border border-primary/20">
                              {(t.groups || []).length} COMPONENTS
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 relative z-10">
                          <div 
                            onClick={(e) => handleDelete(t.id, e)}
                            className="p-3 text-slate-700 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 duration-300"
                            title="Purge Protocol"
                          >
                            <Trash2 size={18} strokeWidth={3} />
                          </div>
                          <div className="p-4 bg-white/5 border border-white/5 text-slate-700 rounded-3xl group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all shadow-xl group-hover:shadow-primary/20 group-hover:rotate-0 -rotate-12 group-hover:scale-110 duration-500">
                            <ChevronRight size={20} strokeWidth={4} />
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

        <DialogFooter className="p-10 bg-white/2 border-t border-white/5 relative z-30 flex-row items-center gap-5">
          {mode === 'save' ? (
            <>
              <Button 
                variant="ghost" 
                onClick={() => onOpenChange(false)}
                className="flex-1 h-16 rounded-[1.8rem] font-black text-slate-600 uppercase tracking-[0.4em] text-[10px] hover:bg-white/5 hover:text-white transition-all border border-white/5 bg-white/2 italic shadow-inner"
              >
                Abort
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!templateName.trim()}
                className="flex-[2] h-16 rounded-[1.8rem] bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-[0.4em] text-[11px] shadow-[0_15px_30px_rgba(212,255,0,0.2)] hover:shadow-[0_20px_40px_rgba(212,255,0,0.3)] transition-all transform active:scale-95 italic"
              >
                Establish Protocol
              </Button>
            </>
          ) : (
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="w-full h-16 rounded-[1.8rem] font-black text-slate-600 border-white/5 bg-white/2 uppercase tracking-[0.4em] text-[11px] hover:bg-white/5 hover:text-white transition-all shadow-xl italic"
            >
              Close Hub
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
      <DialogContent className="w-[92vw] max-w-md rounded-[2.5rem] border-none shadow-[0_24px_48px_-12px_rgba(79,70,229,0.18)] p-0 overflow-hidden bg-white/98 backdrop-blur-md">
        <DialogHeader className="p-8 pb-10 bg-indigo-500 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-3">
              <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-sm border border-white/10">
                <Sparkles size={22} className="text-white drop-shadow-sm" />
              </div>
              <DialogTitle className="text-3xl font-black tracking-tight leading-none">
                {mode === 'save' ? 'Save Routine' : 'Load Routine'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-indigo-50/90 font-semibold text-sm leading-relaxed max-w-[90%]">
              {mode === 'save' 
                ? 'Capture your current session setup into a reusable elite protocol.' 
                : 'Choose a master routine to instantly pre-fill your training session.'}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="p-6 -mt-6 relative z-20 space-y-6 max-h-[60vh] overflow-y-auto scrollbar-none">
          {mode === 'save' ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-indigo-500" />
                  Routine Identity
                </label>
                <div className="relative group">
                  <Input 
                    autoFocus
                    placeholder="e.g. Hypertrophy: Lower A" 
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus-visible:bg-white focus-visible:border-indigo-400 focus-visible:ring-indigo-500/10 transition-all font-black text-slate-800 text-base shadow-sm group-hover:shadow-md"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300 uppercase tracking-widest pointer-events-none group-focus-within:text-indigo-400 transition-colors">
                    Required
                  </div>
                </div>
              </div>
              
              <div className="bg-indigo-50/50 rounded-[2rem] p-5 border border-indigo-100/50 flex items-start gap-4">
                <div className="bg-white p-2.5 rounded-xl shadow-sm border border-indigo-50 text-indigo-500 shrink-0">
                  <Dumbbell size={20} />
                </div>
                <div>
                  <p className="text-[11px] font-black text-slate-800 uppercase tracking-wider mb-1">Session Summary</p>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Will preserve <span className="text-indigo-600 font-bold">{currentGroups.length} exercise {currentGroups.length === 1 ? 'group' : 'groups'}</span> with all target sets, reps, and load benchmarks.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                <Input 
                  placeholder="Search your library..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 rounded-2xl border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-xs font-bold transition-all focus-visible:bg-white focus-visible:border-indigo-400 focus-visible:ring-indigo-500/10 shadow-sm"
                />
              </div>

              <div className="space-y-3">
                {filteredTemplates.length === 0 ? (
                  <div className="py-16 text-center space-y-4">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-indigo-100 rounded-full blur-xl opacity-50" />
                      <div className="relative bg-white w-20 h-20 rounded-[2rem] shadow-xl border border-slate-50 flex items-center justify-center mx-auto text-slate-200">
                        <Dumbbell size={32} strokeWidth={1.5} />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800 tracking-tight">No Routines Found</p>
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-1">Save a workout session as a routine to see it here</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {filteredTemplates.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => onSelect(t)}
                        className="w-full p-5 rounded-[2rem] border border-slate-100 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] hover:border-indigo-100 hover:bg-indigo-50/20 hover:shadow-xl hover:shadow-indigo-500/5 transition-all flex items-center justify-between group relative overflow-hidden active:scale-[0.98]"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/0 to-indigo-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="text-left relative z-10">
                          <p className="font-black text-slate-800 text-[15px] tracking-tight group-hover:text-indigo-600 transition-colors">{t.name}</p>
                          <div className="flex items-center gap-4 mt-1.5">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                              <Calendar size={12} className="text-slate-300" /> {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'Unknown Date'}
                            </span>
                            <div className="w-1 h-1 rounded-full bg-slate-200" />
                            <span className="text-[10px] text-indigo-500 font-black uppercase tracking-[0.1em] px-2 py-0.5 bg-indigo-50 rounded-full border border-indigo-100/50">
                              {(t.groups || []).length} Sections
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 relative z-10">
                          <div 
                            onClick={(e) => handleDelete(t.id, e)}
                            className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0"
                            title="Delete Routine"
                          >
                            <Trash2 size={16} />
                          </div>
                          <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm group-hover:shadow-indigo-200 group-hover:rotate-0 -rotate-12">
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

        <DialogFooter className="p-6 bg-white border-t border-slate-50 relative z-30">
          {mode === 'save' ? (
            <div className="flex gap-4 w-full">
              <Button 
                variant="ghost" 
                onClick={() => onOpenChange(false)}
                className="flex-1 h-11 rounded-2xl font-black text-slate-400 uppercase tracking-[0.2em] text-[10px] hover:bg-slate-50 hover:text-slate-600 transition-all border border-slate-100"
              >
                Dismiss
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!templateName.trim()}
                className="flex-[1.5] h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-indigo-100 hover:shadow-indigo-200 transition-all border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1"
              >
                Save Routine
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="w-full h-11 rounded-2xl font-black text-slate-400 border-slate-200 uppercase tracking-[0.2em] text-[10px] hover:bg-slate-50 hover:text-slate-600 transition-all shadow-sm"
            >
              Close Window
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

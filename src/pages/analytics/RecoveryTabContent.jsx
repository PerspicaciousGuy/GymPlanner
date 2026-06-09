import { Activity, Zap } from 'lucide-react';
import { TabsContent } from "@/components/ui/tabs";
import { Panel } from "@/components/layout/Panel";
import InteractiveMuscleMap from '../../components/InteractiveMuscleMap/InteractiveMuscleMap';

const recoveryLegendItemClass = "flex flex-col items-center gap-1";
const recoveryLegendLabelClass = "text-[9px] font-semibold uppercase tracking-normal text-muted-foreground";
const recoveryStatusDotClass = "h-2.5 w-2.5 rounded-full";

function getRecoveryStatusClasses(status) {
  if (status === 'fatigued') {
    return {
      dot: "bg-rose-500",
      badge: "bg-rose-500/10 text-rose-600",
    };
  }

  if (status === 'recovering') {
    return {
      dot: "bg-amber-500",
      badge: "bg-amber-500/10 text-amber-600",
    };
  }

  return {
    dot: "bg-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-600",
  };
}

export function RecoveryTabContent({ recoveryData }) {
  return (
    <TabsContent value="recovery" className="outline-none">
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Panel className="lg:col-span-2 p-6 md:p-8">
                  <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold tracking-normal text-foreground">Anatomy Recovery</h3>
                      <p className="mt-1 text-xs font-medium uppercase tracking-normal text-muted-foreground">Real-time fatigue heatmap</p>
                    </div>
                    <div className="flex gap-4 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3">
                      <div className={recoveryLegendItemClass}>
                        <div className={`${recoveryStatusDotClass} bg-rose-500`} />
                        <span className={recoveryLegendLabelClass}>Rest</span>
                      </div>
                      <div className={recoveryLegendItemClass}>
                        <div className={`${recoveryStatusDotClass} bg-amber-500`} />
                        <span className={recoveryLegendLabelClass}>Healing</span>
                      </div>
                      <div className={recoveryLegendItemClass}>
                        <div className={`${recoveryStatusDotClass} bg-emerald-500`} />
                        <span className={recoveryLegendLabelClass}>Ready</span>
                      </div>
                    </div>
                  </div>

                  <InteractiveMuscleMap
                    muscleStats={recoveryData}
                    size={180}
                  />

                  <div className="mt-8 flex items-start gap-4 rounded-[var(--app-radius-md)] border border-primary/10 bg-primary/5 p-5">
                    <div className="rounded-[var(--app-radius-sm)] bg-primary/10 p-2">
                      <Activity className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-normal text-foreground">Recovery Science</p>
                      <p className="mt-1 text-[11px] font-medium leading-relaxed text-muted-foreground">
                        Status is calculated based on time-decay since your last logged set. Large muscle groups typically require 48-72 hours
                        for full neurological and tissue recovery.
                      </p>
                    </div>
                  </div>
                </Panel>

                <div className="space-y-6">
                  <Panel className="p-6 md:p-8 h-full flex flex-col">
                    <h3 className="mb-6 text-sm font-semibold uppercase tracking-normal text-foreground">Status Feed</h3>

                    <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar flex-grow">
                      {Object.entries(recoveryData || {}).length > 0 ? (
                        Object.entries(recoveryData)
                          .sort((a, b) => a[1].hoursSince - b[1].hoursSince)
                          .map(([muscle, data]) => {
                            const statusClasses = getRecoveryStatusClasses(data.status);

                            return (
                            <div key={muscle} className="group flex items-center justify-between rounded-[var(--app-radius-md)] border border-transparent bg-[var(--app-surface-muted)] p-4 transition-all hover:border-[var(--app-border)]">
                              <div className="flex items-center gap-3">
                                <div className={`${recoveryStatusDotClass} ${statusClasses.dot}`} />
                                <div>
                                  <p className="text-[11px] font-semibold uppercase tracking-normal text-foreground">{muscle.replace('-', ' ')}</p>
                                  <p className="text-[9px] font-medium text-muted-foreground">Trained {data.hoursSince}h ago</p>
                                </div>
                              </div>
                              <div className={`rounded-[var(--app-radius-sm)] px-2 py-1 text-[9px] font-semibold uppercase tracking-normal ${statusClasses.badge}`}>
                                {data.status}
                              </div>
                            </div>
                          );
                          })
                      ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                          <Activity className="w-10 h-10 mb-4" />
                          <p className="text-xs font-semibold uppercase tracking-normal">No Recent Activity</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-8 pt-8 border-t border-border/50">
                      <div className="relative overflow-hidden rounded-[var(--app-radius-lg)] bg-foreground p-6 text-background shadow-[var(--app-shadow-sm)]">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                          <Zap className="w-12 h-12" />
                        </div>
                        <h4 className="mb-3 text-xs font-semibold uppercase tracking-normal">Fresh Capacity</h4>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(recoveryData || {})
                            .filter((entry) => entry[1].status === 'recovered')
                            .slice(0, 3)
                            .map(([m]) => (
                              <span key={m} className="rounded-[var(--app-radius-sm)] bg-white/15 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-normal">
                                {m.replace('-', ' ')}
                              </span>
                            ))}
                          {Object.entries(recoveryData || {}).filter((entry) => entry[1].status === 'recovered').length === 0 && (
                            <span className="text-[10px] font-semibold text-background/70">Processing recovery...</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Panel>
                </div>
              </div>
            </div>
          </TabsContent>
  );
}

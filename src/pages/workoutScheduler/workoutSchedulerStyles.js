export const statusBadgeClass = "flex items-center gap-1.5 rounded-[var(--app-radius-sm)] border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-normal";

export const contextBadgeClasses = {
  missed: "border-destructive/20 bg-destructive/10 text-destructive",
  upcoming: "border-[var(--app-border)] bg-[var(--app-surface-muted)] text-muted-foreground",
  today: "border-[var(--app-border)] bg-[var(--app-accent-soft)] text-foreground",
  shifted: "border-[var(--app-border-strong)] bg-[var(--app-surface-muted)] text-[var(--app-text-soft)]",
  rest: "border-[var(--app-border)] bg-[var(--app-surface-muted)] text-muted-foreground",
  cycle: "border-[var(--app-border)] bg-[var(--app-accent-soft)] text-foreground",
};

export const dayBadgeBaseClass = "flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full border text-center shadow-[var(--app-shadow-sm)] md:h-16 md:w-16";

export const dayBadgeStateClasses = {
  missed: "border-destructive/15 bg-destructive/10 text-destructive",
  today: "border-[var(--app-border)] bg-[var(--app-accent-soft)] text-foreground",
  upcoming: "border-[var(--app-border)] bg-[var(--app-surface-muted)] text-foreground",
  default: "border-[var(--app-border)] bg-[var(--app-surface-muted)] text-foreground",
};

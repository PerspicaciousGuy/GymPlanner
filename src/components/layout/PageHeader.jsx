import { cn } from "@/lib/utils";

export function PageHeader({ title, eyebrow, description, actions, meta, className }) {
  return (
    <header className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="min-w-0 space-y-2">
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-normal text-[var(--app-text-soft)]">
            {eyebrow}
          </p>
        )}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-normal text-foreground md:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="max-w-2xl text-sm font-medium leading-6 text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {meta && <div className="flex flex-wrap items-center gap-2">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}


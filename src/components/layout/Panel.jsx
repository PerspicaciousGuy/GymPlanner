import { createElement } from "react";
import { cn } from "@/lib/utils";

export function Panel({ children, className, as: Comp = "section", interactive = false, ...props }) {
  return createElement(
    Comp,
    {
      ...props,
      className: cn(
        "rounded-[var(--app-radius-lg)] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--app-shadow-sm)]",
        interactive && "transition-colors hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface-raised)]",
        className
      ),
    },
    children
  );
}

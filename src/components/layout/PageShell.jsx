import { cn } from "@/lib/utils";

export function PageShell({ children, className, size = "wide" }) {
  const sizeClass = {
    narrow: "max-w-4xl",
    default: "max-w-6xl",
    wide: "max-w-[1500px]",
    full: "max-w-none",
  }[size] || "max-w-[1500px]";

  return (
    <div className={cn("mx-auto flex w-full flex-col gap-6 pb-24 md:pb-8", sizeClass, className)}>
      {children}
    </div>
  );
}


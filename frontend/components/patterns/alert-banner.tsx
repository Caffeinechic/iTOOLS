import { cn } from "@/lib/utils";

export function AlertBanner({
  children,
  variant = "error",
  className,
}: {
  children: React.ReactNode;
  variant?: "error" | "warning" | "info";
  className?: string;
}) {
  const variants = {
    error: "border-destructive/25 bg-destructive/10 text-destructive",
    warning: "border-amber-300 bg-amber-50 text-amber-900",
    info: "border-brand-accent/25 bg-brand-accent/10 text-brand-deep",
  };

  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border px-3.5 py-2.5 text-sm leading-relaxed",
        variants[variant],
        className
      )}
    >
      {children}
    </div>
  );
}

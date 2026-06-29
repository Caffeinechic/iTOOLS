import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function FormField({
  id,
  label,
  children,
  className,
  dark = false,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label
        htmlFor={id}
        className={cn(
          "text-sm font-medium",
          dark ? "text-white/70" : "text-[hsl(var(--label-fg))]"
        )}
      >
        {label}
      </Label>
      {children}
    </div>
  );
}

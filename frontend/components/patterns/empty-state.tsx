import { type LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="py-10 px-6 text-center rounded-2xl border border-dashed border-border/80 bg-secondary/25">
      <div className="w-11 h-11 rounded-xl stat-icon-wrap flex items-center justify-center mx-auto mb-4">
        <Icon className="w-5 h-5 text-muted-foreground" strokeWidth={1.75} />
      </div>
      <h3 className="text-sm font-semibold text-brand-deep">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

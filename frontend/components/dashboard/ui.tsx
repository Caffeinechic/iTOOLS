import { type LucideIcon } from "lucide-react";

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--itools-navy-deep)] tracking-tight font-display">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-[var(--itools-muted)] mt-1 max-w-xl">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </div>
  );
}

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
    <div className="py-16 px-6 text-center rounded-2xl border border-dashed border-[var(--itools-border)] bg-white">
      <div className="w-12 h-12 rounded-xl bg-[var(--itools-surface)] flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6 text-[var(--itools-muted)]" />
      </div>
      <h3 className="text-sm font-semibold text-[var(--itools-navy-deep)]">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--itools-muted)] mt-1 max-w-sm mx-auto">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export const cardClass = "bg-white border-[var(--itools-border)] rounded-2xl shadow-none";
export const btnPrimary =
  "bg-[var(--itools-navy)] hover:bg-[var(--itools-navy-deep)] text-white rounded-xl text-sm font-semibold h-9 px-4";
export const inputClass =
  "h-10 rounded-xl border-[var(--itools-border)] bg-white focus-visible:ring-[var(--itools-navy)]/20 focus-visible:border-[var(--itools-navy)]";

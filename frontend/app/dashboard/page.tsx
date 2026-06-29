"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, StatCard } from "@/components/patterns";
import { pageStackClass, panelCardClass } from "@/lib/tokens";
import { useStatsStore, useNotificationStore, usePipelineStore, useAuthStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ArrowRight, Columns3, Bell, ListTodo, Clock, CheckCircle2, AlertCircle } from "lucide-react";

export default function DashboardOverviewPage() {
  const { user } = useAuthStore();
  const { stats, loading, fetchStats } = useStatsStore();
  const { notifications, fetchNotifications } = useNotificationStore();
  const { pipelines, fetchPipelines } = usePipelineStore();

  useEffect(() => {
    fetchStats();
    fetchNotifications();
    fetchPipelines();
  }, [fetchStats, fetchNotifications, fetchPipelines]);

  const firstName = user?.name?.split(" ")[0];

  if (loading || !stats) {
    return (
      <div className={pageStackClass}>
        <Skeleton className="h-8 w-48 rounded-2xl lg:hidden" />
        <div className="content-grid sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { title: "Total tasks", value: stats.total, icon: ListTodo },
    { title: "In progress", value: stats.inProgress + stats.review, icon: Clock },
    { title: "Completed", value: stats.done, icon: CheckCircle2 },
    { title: "Overdue", value: stats.overdue, icon: AlertCircle, highlight: stats.overdue > 0 },
  ];

  return (
    <div className={pageStackClass}>
      <div className="sm:hidden">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Overview</p>
        <h2 className="text-2xl font-semibold text-brand-deep font-display mt-1.5">
          {firstName ? `Hi, ${firstName}` : "Overview"}
        </h2>
      </div>

      <div className="content-grid sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <StatCard
            key={stat.title}
            label={stat.title}
            value={stat.value}
            icon={stat.icon}
            highlight={stat.highlight}
          />
        ))}
      </div>

      <div className="content-grid-wide lg:grid-cols-2">
        <Card className={cn(panelCardClass, "overflow-hidden border-0 shadow-none")}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-brand-deep font-display">
              Pipelines
            </CardTitle>
            <Link href="/dashboard/pipelines">
              <Button variant="ghost" size="sm" className="h-8 rounded-full text-xs text-muted-foreground -mr-1">
                View all <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {pipelines.slice(0, 4).map((p) => {
              const total = p._count?.tasks || 0;
              const done = p.statusCounts?.DONE || 0;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <Link key={p.id} href={`/dashboard/pipelines/${p.id}`} className="block group">
                  <div className="p-4 rounded-2xl bg-secondary/35 border border-transparent hover:border-border/70 hover:bg-secondary/55 transition-all">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <p className="text-sm font-medium text-brand-deep truncate">{p.title}</p>
                      <Badge variant="secondary" className="text-[10px] shrink-0 rounded-full">
                        {p.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 flex-1 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-brand-accent transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground tabular-nums w-8 text-right">
                        {pct}%
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
            {pipelines.length === 0 && (
              <EmptyState
                icon={Columns3}
                title="No pipelines yet"
                action={
                  <Link href="/dashboard/pipelines">
                    <Button variant="brand" size="sm">
                      Open pipelines
                    </Button>
                  </Link>
                }
              />
            )}
          </CardContent>
        </Card>

        <Card className={cn(panelCardClass, "overflow-hidden border-0 shadow-none")}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-brand-deep font-display">
              Recent activity
            </CardTitle>
            <Link href="/dashboard/notifications">
              <Button variant="ghost" size="sm" className="h-8 rounded-full text-xs text-muted-foreground -mr-1">
                View all <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5 max-h-[320px] overflow-auto scrollbar-subtle pr-1">
              {notifications.slice(0, 5).map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    "p-4 rounded-2xl text-sm transition-colors",
                    notif.isRead
                      ? "bg-secondary/30 text-muted-foreground"
                      : "bg-card border border-border/60 shadow-sm"
                  )}
                >
                  <p className={cn("line-clamp-2 leading-relaxed", !notif.isRead && "text-brand-deep font-medium")}>
                    {notif.message}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    {new Date(notif.sentAt).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))}
              {notifications.length === 0 && (
                <EmptyState icon={Bell} title="All caught up" description="No new notifications." />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

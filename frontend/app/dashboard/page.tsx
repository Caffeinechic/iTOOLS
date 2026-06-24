"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, EmptyState, cardClass } from "@/components/dashboard/ui";
import { useStatsStore, useNotificationStore, usePipelineStore } from "@/lib/store";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ListTodo,
  ArrowRight,
  Megaphone,
  Columns3,
  Users,
  Bell,
} from "lucide-react";

export default function DashboardOverviewPage() {
  const { stats, loading, fetchStats } = useStatsStore();
  const { notifications, fetchNotifications } = useNotificationStore();
  const { pipelines, fetchPipelines } = usePipelineStore();

  useEffect(() => {
    fetchStats();
    fetchNotifications();
    fetchPipelines();
  }, [fetchStats, fetchNotifications, fetchPipelines]);

  if (loading || !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-[var(--itools-border)] rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-28 ${cardClass}`} />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { title: "Total tasks", value: stats.total, icon: ListTodo },
    { title: "In progress", value: stats.inProgress + stats.review, icon: Clock },
    { title: "Completed", value: stats.done, icon: CheckCircle2 },
    { title: "Overdue", value: stats.overdue, icon: AlertCircle, alert: stats.overdue > 0 },
  ];

  const quickLinks = [
    { href: "/dashboard/pipelines", label: "Pipelines", icon: Columns3 },
    { href: "/dashboard/members", label: "Members", icon: Users },
    { href: "/dashboard/communications", label: "Communications", icon: Megaphone },
    { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="Committee activity, tasks, and recent updates in one place."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className={cardClass}>
            <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
              <CardTitle className="text-xs font-medium text-[var(--itools-muted)]">
                {stat.title}
              </CardTitle>
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  stat.alert ? "bg-red-50 text-red-600" : "bg-[var(--itools-surface)] text-[var(--itools-navy)]"
                }`}
              >
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[var(--itools-navy-deep)] font-[family-name:var(--font-display)]">
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-[var(--itools-border)] text-[var(--itools-navy-deep)] hover:bg-[var(--itools-surface)] h-9 gap-2"
            >
              <link.icon className="w-3.5 h-3.5" />
              {link.label}
            </Button>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className={cardClass}>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold text-[var(--itools-navy-deep)] font-[family-name:var(--font-display)]">
                Active pipelines
              </CardTitle>
              <p className="text-xs text-[var(--itools-muted)] mt-0.5">Open workflows</p>
            </div>
            <Link href="/dashboard/pipelines">
              <Button variant="ghost" size="sm" className="text-xs text-[var(--itools-navy)] h-8">
                View all <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {pipelines.slice(0, 4).map((p) => {
              const total = p._count?.tasks || 0;
              const done = p.statusCounts?.DONE || 0;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <Link key={p.id} href={`/dashboard/pipelines/${p.id}`} className="block group">
                  <div className="p-3 rounded-xl border border-[var(--itools-border)] hover:border-[var(--itools-navy)]/30 hover:bg-[var(--itools-surface)] transition-colors">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="text-sm font-medium text-[var(--itools-navy-deep)] truncate group-hover:text-[var(--itools-navy)]">
                        {p.title}
                      </p>
                      <Badge variant="secondary" className="text-[10px] shrink-0 uppercase">
                        {p.type}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-[11px] text-[var(--itools-muted)] mb-1.5">
                      <span>{total} tasks</span>
                      <span>{pct}% complete</span>
                    </div>
                    <div className="h-1.5 w-full bg-[var(--itools-surface)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--itools-navy)] rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
            {pipelines.length === 0 && (
              <EmptyState
                icon={Columns3}
                title="No pipelines yet"
                description="Create a workflow to start tracking committee tasks."
                action={
                  <Link href="/dashboard/pipelines">
                    <Button className="bg-[var(--itools-navy)] hover:bg-[var(--itools-navy-deep)] rounded-xl">
                      Go to pipelines
                    </Button>
                  </Link>
                }
              />
            )}
          </CardContent>
        </Card>

        <Card className={cardClass}>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold text-[var(--itools-navy-deep)] font-[family-name:var(--font-display)]">
                Recent activity
              </CardTitle>
              <p className="text-xs text-[var(--itools-muted)] mt-0.5">Latest notifications</p>
            </div>
            <Link href="/dashboard/notifications">
              <Button variant="ghost" size="sm" className="text-xs text-[var(--itools-navy)] h-8">
                View all <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[320px] overflow-auto pr-1">
              {notifications.slice(0, 6).map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 rounded-xl border transition-colors ${
                    notif.isRead
                      ? "border-[var(--itools-border)] bg-[var(--itools-surface)]/40"
                      : "border-[var(--itools-navy)]/20 bg-white"
                  }`}
                >
                  <p className="text-sm text-[var(--itools-navy-deep)] line-clamp-2">{notif.message}</p>
                  <p className="text-[11px] text-[var(--itools-muted)] mt-1">
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
                <EmptyState icon={Bell} title="No recent activity" description="Updates will appear here." />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

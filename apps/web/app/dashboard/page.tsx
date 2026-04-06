"use client";

import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStatsStore, useNotificationStore } from "@/lib/store";
import { CheckCircle2, Clock, AlertCircle, ListTodo } from "lucide-react";

export default function DashboardOverviewPage() {
  const { stats, loading, fetchStats } = useStatsStore();
  const { notifications, fetchNotifications } = useNotificationStore();

  useEffect(() => {
    fetchStats();
    fetchNotifications();
  }, [fetchStats, fetchNotifications]);

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Overview</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-zinc-900/50 animate-pulse border border-zinc-800" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Tasks",
      value: stats.total,
      icon: ListTodo,
      color: "text-blue-400",
      desc: "Across all pipelines",
    },
    {
      title: "In Progress",
      value: stats.inProgress + stats.review,
      icon: Clock,
      color: "text-amber-400",
      desc: "Tasks currently active",
    },
    {
      title: "Completed",
      value: stats.done,
      icon: CheckCircle2,
      color: "text-emerald-400",
      desc: "Successfully finished",
    },
    {
      title: "Overdue",
      value: stats.overdue,
      icon: AlertCircle,
      color: "text-red-400",
      desc: "Needs immediate attention",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Overview</h1>
          <p className="text-zinc-400 mt-1">Here's what's happening in your committee today.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-zinc-400">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stat.value}</div>
              <p className="text-xs text-zinc-500 mt-1">{stat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg text-zinc-200">Recent Activity</CardTitle>
            <CardDescription className="text-zinc-500">Latest updates across your workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[300px] overflow-auto pr-2 custom-scrollbar">
              {notifications.slice(0, 5).map((notif) => (
                <div key={notif.id} className="flex gap-3">
                  <div className="mt-0.5 space-y-1">
                    <p className="text-sm text-zinc-300">{notif.message}</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(notif.sentAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <p className="text-sm text-zinc-500 italic">No recent activity.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

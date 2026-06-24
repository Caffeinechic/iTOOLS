"use client";

import { useEffect } from "react";
import { Bell, CheckCircle2, AlertCircle, Landmark, ListTodo } from "lucide-react";
import { useNotificationStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, EmptyState, cardClass } from "@/components/dashboard/ui";

export default function NotificationsPage() {
  const { notifications, loading, fetchNotifications, markRead, markAllRead } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-10 w-48" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className={`h-20 ${cardClass}`} />
          ))}
        </div>
      </div>
    );
  }

  const unreadExist = notifications.some((n) => !n.isRead);

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Notifications" description="Task updates and committee alerts.">
        {unreadExist && (
          <Button
            variant="outline"
            className="rounded-xl border-[var(--itools-border)] text-sm h-9"
            onClick={() => markAllRead()}
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" /> Mark all read
          </Button>
        )}
      </PageHeader>

      <div className="space-y-2">
        {notifications.map((n) => (
          <Card
            key={n.id}
            className={`${cardClass} transition-colors ${
              n.isRead ? "opacity-80" : "border-[var(--itools-navy)]/20"
            }`}
          >
            <CardContent className="p-4 flex gap-3">
              <div
                className={`rounded-lg p-2 h-fit shrink-0 ${
                  n.isRead ? "bg-[var(--itools-surface)] text-[var(--itools-muted)]" : "bg-[var(--itools-navy)] text-white"
                }`}
              >
                {n.type === "BUDGET" ? (
                  <Landmark className="w-4 h-4" />
                ) : n.type === "TASK_ASSIGNED" ? (
                  <ListTodo className="w-4 h-4" />
                ) : n.type === "SYSTEM" ? (
                  <AlertCircle className="w-4 h-4" />
                ) : (
                  <Bell className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex justify-between items-start gap-3">
                  <p className={`text-sm ${n.isRead ? "text-[var(--itools-muted)]" : "text-[var(--itools-navy-deep)] font-medium"}`}>
                    {n.message}
                  </p>
                  <time className="text-[11px] text-[var(--itools-muted)] whitespace-nowrap shrink-0">
                    {new Date(n.sentAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </time>
                </div>
                {n.sender && <p className="text-xs text-[var(--itools-muted)]">From {n.sender.name}</p>}
                {!n.isRead && (
                  <Button
                    variant="link"
                    onClick={() => markRead(n.id)}
                    className="h-auto p-0 text-xs text-[var(--itools-navy)] font-medium"
                  >
                    Mark as read
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {notifications.length === 0 && (
          <EmptyState
            icon={Bell}
            title="You're all caught up"
            description="We'll notify you when there's an update on your tasks or pipelines."
          />
        )}
      </div>
    </div>
  );
}

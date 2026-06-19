"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCircle2, AlertCircle } from "lucide-react";
import { useNotificationStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotificationsPage() {
  const { notifications, loading, fetchNotifications, markRead, markAllRead } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Notifications</h1>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-white border border-zinc-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const unreadExist = notifications.some(n => !n.isRead);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Notifications</h1>
          <p className="text-zinc-500 mt-1">Stay updated with activities across iTools</p>
        </div>
        {unreadExist && (
          <Button 
            variant="outline" 
            className="border-zinc-200 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50"
            onClick={() => markAllRead()}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" /> Mark all as read
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <Card 
            key={n.id} 
            className={`transition-colors shadow-sm ${
              n.isRead ? 'bg-zinc-50 border-zinc-200/80' : 'bg-white border-indigo-200/80'
            }`}
          >
            <CardContent className="p-4 flex gap-4">
              <div className={`mt-0.5 rounded-full p-2 h-fit ${n.isRead ? 'bg-zinc-100 text-zinc-500' : 'bg-indigo-50 text-indigo-600'}`}>
                {n.type === 'SYSTEM' ? <AlertCircle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start">
                  <p className={`text-sm ${n.isRead ? 'text-zinc-500' : 'text-zinc-800 font-medium'}`}>
                    {n.message}
                  </p>
                  <span className="text-[11px] text-zinc-500 whitespace-nowrap ml-4">
                    {new Date(n.sentAt).toLocaleString()}
                  </span>
                </div>
                {n.sender && (
                  <p className="text-xs text-zinc-500">From: {n.sender.name}</p>
                )}
                {!n.isRead && (
                  <Button 
                    variant="link" 
                    onClick={() => markRead(n.id)}
                    className="h-auto p-0 text-[11px] text-indigo-400 mt-2 hover:text-indigo-300"
                  >
                    Mark as read
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {notifications.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
            <Bell className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-700">You're all caught up!</h3>
            <p className="text-zinc-500 mt-1 max-w-sm mx-auto">We'll notify you here when there's an update on your tasks or pipelines.</p>
          </div>
        )}
      </div>
    </div>
  );
}

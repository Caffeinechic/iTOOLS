"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Sidebar } from "@/features/sidebar";
import { useAuthStore, useNotificationStore } from "@/lib/store";
import { connectSocket, disconnectSocket } from "@/lib/socket";

function DashboardLoading() {
  return (
    <div className="h-screen workspace-bg flex w-full overflow-hidden">
      <div className="hidden lg:block w-[22.25rem] shrink-0 sidebar-rail" />
      <div className="workspace-main flex-1">
        <div className="workspace-header">
          <Skeleton className="h-8 w-48 rounded-xl" />
        </div>
        <div className="workspace-content">
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading, fetchUser, logout } = useAuthStore();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();

  useEffect(() => {
    fetchUser();
    fetchUnreadCount();
  }, [fetchUser, fetchUnreadCount]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      const socket = connectSocket(user.id, user.committeeId);
      socket.on("notification:new", () => fetchUnreadCount());
      return () => disconnectSocket();
    }
  }, [user, fetchUnreadCount]);

  if (loading) return <DashboardLoading />;

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  const firstName = user?.name?.split(" ")[0] || "there";

  const sidebarProps = {
    roleTier: user?.role?.tier,
    userName: user?.name,
    userEmail: user?.email,
    roleName: user?.role?.name,
    committeeName: user?.committee?.name,
    initials,
    notificationCount: unreadCount,
    onLogout: logout,
  };

  return (
    <div className="h-screen workspace-bg flex w-full overflow-hidden">
      <Sidebar {...sidebarProps} className="hidden lg:flex shrink-0" />

      <div className="workspace-main flex-1 min-w-0 min-h-0 flex flex-col">
        <header className="workspace-header">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="lg:hidden h-10 w-10 rounded-full shrink-0"
                  aria-label="Open menu"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[min(100vw,22.25rem)] p-0 border-0">
                <Sidebar {...sidebarProps} mobile className="w-full" />
              </SheetContent>
            </Sheet>

            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Workspace
              </p>
              <h1 className="text-lg sm:text-xl font-semibold text-brand-deep truncate font-display">
                Welcome, {firstName}
              </h1>
            </div>
          </div>

          <Link href="/dashboard/notifications" className="shrink-0">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full relative"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-accent rounded-full ring-2 ring-card" />
              )}
            </Button>
          </Link>
        </header>

        <main className="workspace-content min-h-0">{children}</main>
      </div>
    </div>
  );
}

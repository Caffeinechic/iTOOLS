"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Columns3,
  Users,
  Bell,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  Landmark,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BrandLogo } from "@/components/auth/brand-logo";
import { DashboardBreadcrumb } from "@/components/dashboard/breadcrumb";
import { committeeShortName } from "@/lib/committees";
import { useAuthStore, useNotificationStore } from "@/lib/store";
import { connectSocket, disconnectSocket } from "@/lib/socket";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/pipelines", label: "Pipelines", icon: Columns3 },
  { href: "/dashboard/communications", label: "Communications", icon: Megaphone },
  { href: "/dashboard/budget", label: "Budget", icon: Landmark },
  { href: "/dashboard/members", label: "Members", icon: Users },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
];

function NavLink({
  item,
  isActive,
  collapsed,
}: {
  item: (typeof navItems)[0];
  isActive: boolean;
  collapsed: boolean;
}) {
  const link = (
    <Link
      href={item.href}
      className={`group relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 ${
        collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
      } ${
        isActive
          ? "bg-white/15 text-white shadow-sm"
          : "text-white/55 hover:text-white hover:bg-white/10"
      }`}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-white rounded-r-full" />
      )}
      <item.icon
        className={`w-[18px] h-[18px] shrink-0 transition-transform duration-200 ${
          isActive ? "scale-105" : "group-hover:scale-105"
        }`}
      />
      {!collapsed && (
        <>
          <span className="flex-1">{item.label}</span>
          {item.label === "Notifications" && <NotificationBadge />}
        </>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent
          side="right"
          sideOffset={12}
          className="bg-[var(--itools-navy-deep)] text-white border-white/10 font-medium"
        >
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

function SidebarContent({
  collapsed,
  onToggle,
  userTier,
  committeeName,
  roleName,
}: {
  collapsed: boolean;
  onToggle?: () => void;
  userTier?: string;
  committeeName?: string;
  roleName?: string;
}) {
  const pathname = usePathname();
  const items = [
    ...navItems,
    ...(userTier === "MASTER"
      ? [{ href: "/dashboard/settings", label: "System", icon: Settings }]
      : []),
  ];

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#1a2744] to-[var(--itools-navy)] text-white shadow-xl">
      <div
        className={`flex items-center shrink-0 border-b border-white/8 ${
          collapsed ? "justify-center py-4" : "gap-3 px-4 py-4"
        }`}
      >
        <BrandLogo size={collapsed ? "sm" : "md"} inverted className={collapsed ? "!w-10 !h-8" : ""} />
        {onToggle && !collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-8 w-8 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
            onClick={onToggle}
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 px-2.5 py-3">
        <TooltipProvider>
          <nav className="space-y-1">
            {items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <NavLink key={item.href} item={item} isActive={isActive} collapsed={collapsed} />
              );
            })}
          </nav>
        </TooltipProvider>
      </ScrollArea>

      {collapsed && onToggle && (
        <div className="px-2.5 pb-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="w-full h-9 rounded-xl text-white/50 hover:text-white hover:bg-white/10"
            onClick={onToggle}
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {!collapsed && (
        <div className="p-3 shrink-0 border-t border-white/8">
          <div className="rounded-xl bg-white/6 border border-white/10 px-3 py-3 backdrop-blur-sm">
            <p className="text-[10px] text-white/45 font-medium uppercase tracking-wider leading-relaxed">
              {committeeName || "IEEE Student Branch"}
            </p>
            <p className="text-xs text-white/90 font-semibold mt-1">{roleName || "Executive Committee"}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationBadge() {
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  if (!unreadCount) return null;
  return (
    <Badge className="ml-auto h-5 min-w-[20px] text-[10px] px-1.5 bg-white/20 text-white hover:bg-white/20 border-0">
      {unreadCount > 9 ? "9+" : unreadCount}
    </Badge>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const { user, loading, fetchUser, logout } = useAuthStore();
  const { fetchUnreadCount } = useNotificationStore();

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--itools-surface)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-[var(--itools-navy)] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[var(--itools-muted)] font-medium">Loading workspace…</p>
        </div>
      </div>
    );
  }

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  const committeeLabel = user?.committee
    ? committeeShortName({ id: "", name: user.committee.name })
    : "IEEE Student Branch";

  return (
    <div className="min-h-screen bg-[var(--itools-surface)] flex">
      <aside
        className={`hidden lg:flex flex-col shrink-0 sticky top-0 h-screen transition-all duration-300 ease-in-out z-40 ${
          collapsed ? "w-[68px]" : "w-[248px]"
        }`}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          userTier={user?.role?.tier}
          committeeName={committeeLabel}
          roleName={user?.role?.name}
        />
      </aside>

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="h-14 shrink-0 flex items-center justify-between px-4 lg:px-6 border-b border-[var(--itools-border)] bg-white/90 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden h-9 w-9 text-[var(--itools-muted)]"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[248px] p-0 border-0">
                <SidebarContent
                  collapsed={false}
                  userTier={user?.role?.tier}
                  committeeName={committeeLabel}
                  roleName={user?.role?.name}
                />
              </SheetContent>
            </Sheet>

            {collapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex h-9 w-9 text-[var(--itools-muted)]"
                onClick={() => setCollapsed(false)}
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}

            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-[var(--itools-navy-deep)] font-display">
                {user?.committee?.name || "Committee workspace"}
              </p>
              <p className="text-[11px] text-[var(--itools-muted)]">{user?.role?.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/dashboard/notifications">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg text-[var(--itools-muted)] hover:text-[var(--itools-navy)] relative"
              >
                <Bell className="h-4 w-4" />
                <NotificationDot />
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-9 gap-2 px-2 rounded-lg hover:bg-[var(--itools-surface)]"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-[var(--itools-navy)] text-white text-[10px] font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline text-sm font-medium text-[var(--itools-navy-deep)]">
                    {user?.name}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl">
                <DropdownMenuLabel>
                  <p className="text-sm font-semibold">{user?.name}</p>
                  <p className="text-xs text-[var(--itools-muted)] font-normal">{user?.email}</p>
                  {user?.role && (
                    <Badge variant="outline" className="mt-2 text-[10px]">
                      {user.role.name}
                    </Badge>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer rounded-lg">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-5 lg:p-8 max-w-[1400px] mx-auto w-full">
            <DashboardBreadcrumb />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function NotificationDot() {
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  if (!unreadCount) return null;
  return (
    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
  );
}

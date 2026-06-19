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
  Shield,
  ChevronLeft,
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
import { useAuthStore, useNotificationStore } from "@/lib/store";
import { connectSocket, disconnectSocket } from "@/lib/socket";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/pipelines", label: "Pipelines", icon: Columns3 },
  { href: "/dashboard/members", label: "Members", icon: Users },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
];

function SidebarContent({ collapsed, onToggle }: { collapsed: boolean; onToggle?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 shrink-0">
        <div className="w-10 h-10 bg-[#0f172a] rounded-[14px] flex items-center justify-center shadow-md shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">iTools</h2>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Control Panel</p>
          </div>
        )}
        {onToggle && !collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-7 w-7 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100"
            onClick={onToggle}
          >
            <ChevronLeft className="h-4 h-4" />
          </Button>
        )}
      </div>

      <Separator className="bg-slate-100" />

      {/* Nav Link List */}
      <ScrollArea className="flex-1 px-3 py-6">
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <TooltipProvider key={item.href} delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3.5 px-4 py-3 rounded-full text-sm font-semibold transition-all duration-200 group ${
                        isActive
                          ? "border border-slate-900 text-slate-900 bg-white shadow-sm"
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-slate-900" : "text-slate-400 group-hover:text-slate-700"}`} />
                      {!collapsed && <span className="tracking-wide">{item.label}</span>}
                      {!collapsed && item.label === "Notifications" && <NotificationBadge />}
                    </Link>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right" className="bg-slate-900 text-white border-slate-800 rounded-lg text-xs">
                      {item.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator className="bg-slate-100" />
 
      {/* Footer Info Box */}
      {!collapsed && (
        <div className="p-4 shrink-0">
          <div className="rounded-[18px] bg-slate-50 border border-slate-100 p-3.5 text-center">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Student Branch</p>
            <p className="text-xs text-slate-700 font-extrabold mt-0.5">VITB 2025-2026</p>
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
    <Badge variant="destructive" className="ml-auto h-5 min-w-[20px] text-[10px] px-1.5 bg-red-500 hover:bg-red-500 font-bold">
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
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      const socket = connectSocket(user.id, user.committeeId);
      socket.on("notification:new", () => fetchUnreadCount());
      return () => {
        disconnectSocket();
      };
    }
  }, [user, fetchUnreadCount]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f7f9] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Loading iTools...</p>
        </div>
      </div>
    );
  }

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <div className="min-h-screen bg-[#f4f7f9] flex">
      {/* Desktop Sidebar (Floating Card) */}
      <aside
        className={`hidden lg:flex flex-col transition-all duration-300 shrink-0 sticky top-0 h-screen ${
          collapsed ? "w-[100px]" : "w-[260px]"
        }`}
      >
        <div className="m-4 mr-2 flex-1 bg-white border border-slate-200/50 rounded-[28px] shadow-sm overflow-hidden">
          <SidebarContent collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        </div>
      </aside>
 
      {/* Main Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-transparent flex items-center justify-between px-6 lg:px-8 mt-2 z-30 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9 rounded-full text-slate-500 hover:bg-white hover:text-slate-900 border border-slate-100">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[260px] p-0 bg-white border-slate-200/50">
                <SidebarContent collapsed={false} />
              </SheetContent>
            </Sheet>

            {/* Collapse toggle for desktop */}
            {collapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex h-9 w-9 rounded-full text-slate-400 hover:text-slate-900 hover:bg-white border border-slate-250/20"
                onClick={() => setCollapsed(false)}
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3.5">
            {/* Notification bell */}
            <Link href="/dashboard/notifications">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-400 hover:text-slate-900 hover:bg-white border border-slate-250/20 relative shadow-sm">
                <Bell className="h-4.5 w-4.5" />
                <NotificationDot />
              </Button>
            </Link>

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 gap-2 px-3 rounded-full bg-white hover:bg-slate-50 border border-slate-200/80 shadow-sm text-slate-700 hover:text-slate-900">
                  <Avatar className="h-7 w-7 border border-slate-100">
                    <AvatarFallback className="bg-slate-100 text-slate-800 text-[10px] font-extrabold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {user?.name && <span className="hidden sm:inline text-xs font-bold tracking-wide text-slate-800">{user.name}</span>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border-slate-200/80 rounded-2xl shadow-lg p-1">
                <DropdownMenuLabel className="text-slate-800 px-3 py-2.5">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{user?.name}</span>
                    <span className="text-xs text-slate-400 font-normal mt-0.5">{user?.email}</span>
                    {user?.role && (
                      <Badge variant="outline" className="mt-1.5 w-fit text-[9px] border-slate-200 text-slate-600 bg-slate-50">
                        {user.role.name}
                      </Badge>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuItem className="text-slate-600 hover:text-slate-950 px-3 py-2 cursor-pointer rounded-xl font-medium" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2.5" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8 max-w-[1600px] mx-auto w-full h-full">
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
    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white" />
  );
}

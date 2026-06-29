"use client";

import Link from "next/link";
import { ChevronUp, LogOut, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SidebarProfile({
  name,
  email,
  roleName,
  committeeName,
  initials,
  onLogout,
  isMaster,
}: {
  name?: string;
  email?: string;
  roleName?: string;
  committeeName?: string;
  initials: string;
  onLogout: () => void;
  isMaster?: boolean;
}) {
  return (
    <div className="sidebar-inset shrink-0 pb-4 pt-3 border-t border-border/60 bg-[hsl(var(--sidebar-bg))]">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full h-auto p-3 justify-start gap-3 rounded-2xl border border-border/50 bg-card shadow-sm hover:bg-secondary/50 hover:border-border/70"
          >
            <Avatar className="h-10 w-10 shrink-0 ring-2 ring-background">
              <AvatarFallback className="bg-brand text-primary-foreground text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-sm font-semibold text-brand-deep truncate leading-tight">
                {name ?? "Account"}
              </p>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                {roleName ?? "Member"}
              </p>
            </div>
            <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-[15.5rem] rounded-2xl mb-2">
          <DropdownMenuLabel className="font-normal py-2">
            <p className="text-sm font-semibold text-brand-deep">{name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{email}</p>
            {committeeName && (
              <p className="text-xs text-muted-foreground mt-1.5 leading-snug">{committeeName}</p>
            )}
            {roleName && (
              <Badge variant="outline" className="mt-2 text-[10px] rounded-full font-medium">
                {roleName}
              </Badge>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {isMaster && (
            <DropdownMenuItem asChild className="cursor-pointer rounded-xl">
              <Link href="/dashboard/settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={onLogout} className="cursor-pointer rounded-xl text-destructive focus:text-destructive">
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

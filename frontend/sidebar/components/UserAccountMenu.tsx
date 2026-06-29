"use client";

import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
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
import { cn } from "@/lib/utils";

export function UserAccountMenu({
  name,
  email,
  roleName,
  committeeName,
  initials,
  onLogout,
  isMaster,
  compact = false,
  className,
}: {
  name?: string;
  email?: string;
  roleName?: string;
  committeeName?: string;
  initials: string;
  onLogout: () => void;
  isMaster?: boolean;
  /** Icon-only trigger for the top header */
  compact?: boolean;
  className?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            compact
              ? "h-10 rounded-full px-1.5 gap-2"
              : "w-full h-auto py-2 px-2 justify-start gap-2.5 rounded-xl hover:bg-secondary/80",
            className
          )}
        >
          <Avatar className={cn("shrink-0", compact ? "h-8 w-8" : "h-8 w-8")}>
            <AvatarFallback className="bg-brand text-primary-foreground text-[10px] font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!compact && (
            <div className="min-w-0 flex-1 text-left">
              <p className="text-sm font-medium text-brand-deep truncate">{name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{roleName}</p>
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={compact ? "bottom" : "top"}
        align={compact ? "end" : "start"}
        className="w-56 rounded-2xl"
      >
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-semibold">{name}</p>
          <p className="text-xs text-muted-foreground">{email}</p>
          {committeeName && (
            <p className="text-xs text-muted-foreground mt-1">{committeeName}</p>
          )}
          {roleName && (
            <Badge variant="outline" className="mt-2 text-[10px] rounded-full">
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
        <DropdownMenuItem onClick={onLogout} className="cursor-pointer rounded-xl">
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

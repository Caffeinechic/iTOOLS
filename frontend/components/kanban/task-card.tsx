"use client";

import { Task } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlignLeft, Paperclip, MessageSquare, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cardClass } from "@/components/dashboard/ui";

export function TaskCard({ task }: { task: Task }) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL": return "text-red-600 bg-red-50 border-red-100";
      case "HIGH": return "text-orange-600 bg-orange-50 border-orange-100";
      case "MEDIUM": return "text-blue-600 bg-blue-50 border-blue-100";
      case "LOW": return "text-slate-600 bg-slate-50 border-slate-100";
      default: return "text-slate-600 bg-slate-50 border-slate-100";
    }
  };

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== "DONE";

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <Card className={`${cardClass} hover:border-[var(--itools-navy)]/25 cursor-grab active:cursor-grabbing transition-colors group overflow-hidden`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-3">
          <Badge variant="outline" className={`text-[9px] font-semibold px-2 py-0.5 rounded-lg border ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </Badge>
          {task.assignee && (
            <Avatar className="w-6 h-6 border border-[var(--itools-border)]">
              <AvatarFallback className="text-[9px] bg-[var(--itools-surface)] text-[var(--itools-navy-deep)] font-semibold">
                {getInitials(task.assignee.name)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
        
        <h4 className="text-sm font-semibold text-[var(--itools-navy-deep)] leading-snug mb-3 line-clamp-2">
          {task.title}
        </h4>

        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="flex items-center gap-3 text-[var(--itools-muted)] text-xs">
            {task.description && (
              <div className="flex items-center gap-1">
                <AlignLeft className="w-3.5 h-3.5" />
              </div>
            )}
            {task._count && task._count.comments > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="text-[10px]">{task._count.comments}</span>
              </div>
            )}
            {task._count && task._count.files > 0 && (
              <div className="flex items-center gap-1">
                <Paperclip className="w-3.5 h-3.5" />
                <span className="text-[10px]">{task._count.files}</span>
              </div>
            )}
          </div>
          
          {task.deadline && (
            <div className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-lg ${isOverdue ? "bg-red-50 text-red-600" : "text-[var(--itools-muted)]"}`}>
              <Clock className="w-3 h-3" />
              <span>{new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

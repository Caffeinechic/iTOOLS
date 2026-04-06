"use client";

import { Task } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlignLeft, Paperclip, MessageSquare, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function TaskCard({ task }: { task: Task }) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL": return "text-red-400 bg-red-400/10 border-red-400/20";
      case "HIGH": return "text-orange-400 bg-orange-400/10 border-orange-400/20";
      case "MEDIUM": return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      case "LOW": return "text-zinc-400 bg-zinc-400/10 border-zinc-400/20";
      default: return "text-zinc-400 bg-zinc-400/10 border-zinc-400/20";
    }
  };

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== "DONE";

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <Card className="bg-zinc-900/70 border-zinc-700 hover:border-indigo-500/50 cursor-grab active:cursor-grabbing transition-colors group shadow-sm">
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 rounded font-semibold ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </Badge>
          {task.assignee && (
            <Avatar className="w-6 h-6 border border-zinc-700">
              <AvatarFallback className="text-[10px] bg-zinc-800 text-zinc-300">
                {getInitials(task.assignee.name)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
        
        <h4 className="text-sm font-medium text-zinc-200 leading-tight mb-3 line-clamp-2">
          {task.title}
        </h4>

        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="flex items-center gap-3 text-zinc-500 text-xs">
            {task.description && (
              <div className="flex items-center gap-1">
                <AlignLeft className="w-3.5 h-3.5" />
              </div>
            )}
            {task._count && task._count.comments > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{task._count.comments}</span>
              </div>
            )}
            {task._count && task._count.files > 0 && (
              <div className="flex items-center gap-1">
                <Paperclip className="w-3.5 h-3.5" />
                <span>{task._count.files}</span>
              </div>
            )}
          </div>
          
          {task.deadline && (
            <div className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${isOverdue ? 'bg-red-500/10 text-red-400' : 'text-zinc-500'}`}>
              <Clock className="w-3 h-3" />
              <span>{new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

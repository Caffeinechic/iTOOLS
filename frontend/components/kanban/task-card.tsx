"use client";

import { Task } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlignLeft, Paperclip, MessageSquare, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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
    <Card className="bg-white border-slate-200/60 rounded-[20px] shadow-sm hover:shadow-md hover:border-slate-300/80 cursor-grab active:cursor-grabbing transition-all duration-300 group overflow-hidden">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-3">
          <Badge variant="outline" className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border tracking-wide ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </Badge>
          {task.assignee && (
            <Avatar className="w-6 h-6 border border-slate-100">
              <AvatarFallback className="text-[9px] bg-slate-100 text-slate-700 font-bold">
                {getInitials(task.assignee.name)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
        
        <h4 className="text-xs font-extrabold text-slate-800 leading-snug mb-3 line-clamp-2 tracking-wide">
          {task.title}
        </h4>

        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="flex items-center gap-3.5 text-slate-400 text-xs font-semibold">
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
            <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${isOverdue ? 'bg-red-50 text-red-600' : 'text-slate-400'}`}>
              <Clock className="w-3 h-3" />
              <span>{new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

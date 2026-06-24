"use client";

import { useEffect, useState } from "react";
import { Task, TaskComment, useTaskStore } from "@/lib/store";
import { apiFetch } from "@/lib/api";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, MessageSquare, Send } from "lucide-react";
import { btnPrimary } from "@/components/dashboard/ui";

interface TaskDetailSheetProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
}

export function TaskDetailSheet({ task, open, onClose }: TaskDetailSheetProps) {
  const { updateTask } = useTaskStore();
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!task || !open) return;
    setLoading(true);
    apiFetch<{ data: Task & { comments: TaskComment[] } }>(`/tasks/${task.id}`)
      .then((res) => setComments(res.data.comments || []))
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [task, open]);

  if (!task) return null;

  const priorityColor = (p: string) => {
    if (p === "CRITICAL") return "bg-red-50 text-red-600 border-red-100";
    if (p === "HIGH") return "bg-orange-50 text-orange-600 border-orange-100";
    if (p === "MEDIUM") return "bg-blue-50 text-blue-600 border-blue-100";
    return "bg-[var(--itools-surface)] text-[var(--itools-muted)] border-[var(--itools-border)]";
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSending(true);
    try {
      const res = await apiFetch<{ data: TaskComment }>(`/tasks/${task.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: newComment.trim() }),
      });
      setComments((prev) => [...prev, res.data]);
      setNewComment("");
    } finally {
      setSending(false);
    }
  };

  const statuses = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md bg-white border-[var(--itools-border)] overflow-y-auto">
        <SheetHeader className="space-y-3 pb-4 border-b border-[var(--itools-border)]">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={`text-[9px] font-semibold ${priorityColor(task.priority)}`}>
              {task.priority}
            </Badge>
            <Badge variant="outline" className="text-[9px] font-semibold bg-[var(--itools-surface)] text-[var(--itools-muted)]">
              {task.status.replace("_", " ")}
            </Badge>
          </div>
          <SheetTitle className="text-left text-lg font-bold text-[var(--itools-navy-deep)] leading-snug font-[family-name:var(--font-display)]">
            {task.title}
          </SheetTitle>
          {task.description && (
            <p className="text-sm text-[var(--itools-muted)] text-left leading-relaxed">{task.description}</p>
          )}
        </SheetHeader>

        <div className="py-4 space-y-4">
          {task.assignee && (
            <div className="flex items-center gap-2">
              <Avatar className="w-7 h-7">
                <AvatarFallback className="text-[10px] bg-[var(--itools-surface)] font-semibold">
                  {task.assignee.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs font-semibold text-[var(--itools-navy-deep)]">{task.assignee.name}</p>
                <p className="text-[10px] text-[var(--itools-muted)]">Assignee</p>
              </div>
            </div>
          )}
          {task.deadline && (
            <div className="flex items-center gap-2 text-xs text-[var(--itools-muted)]">
              <Clock className="w-3.5 h-3.5" />
              Due {new Date(task.deadline).toLocaleDateString()}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--itools-muted)]">Status</p>
            <div className="flex flex-wrap gap-1.5">
              {statuses.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={task.status === s ? "default" : "outline"}
                  className={`rounded-lg text-[10px] h-7 font-medium ${
                    task.status === s ? "bg-[var(--itools-navy)] hover:bg-[var(--itools-navy-deep)]" : ""
                  }`}
                  onClick={() => updateTask(task.id, { status: s })}
                >
                  {s.replace("_", " ")}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-xs font-medium text-[var(--itools-muted)]">
              <MessageSquare className="w-3.5 h-3.5" />
              Comments ({comments.length})
            </div>
            {loading ? (
              <p className="text-xs text-[var(--itools-muted)]">Loading comments...</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {comments.map((c) => (
                  <div key={c.id} className="bg-[var(--itools-surface)] rounded-xl p-3 border border-[var(--itools-border)]">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-semibold text-[var(--itools-navy-deep)]">{c.user?.name}</span>
                      <span className="text-[9px] text-[var(--itools-muted)]">
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--itools-muted)]">{c.content}</p>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-xs text-[var(--itools-muted)] italic">No comments yet.</p>
                )}
              </div>
            )}
            <form onSubmit={handleComment} className="flex gap-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={2}
                className="rounded-xl text-xs resize-none flex-1 border-[var(--itools-border)]"
              />
              <Button
                type="submit"
                size="icon"
                disabled={sending || !newComment.trim()}
                className={`${btnPrimary} shrink-0 self-end rounded-xl`}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTaskStore, usePipelineStore, useAuthStore, Task } from "@/lib/store";
import { apiFetch } from "@/lib/api";
import { KanbanBoard, TaskDetailSheet } from "@/features/kanban";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus } from "lucide-react";
import { btnPrimary, cardClass, inputClass } from "@/components/dashboard/ui";

export default function PipelineKanbanPage() {
  const params = useParams();
  const router = useRouter();
  const pipelineId = params.id as string;
  const { tasks, loading, fetchTasks, addTask } = useTaskStore();
  const { pipelines, fetchPipelines } = usePipelineStore();
  const { user } = useAuthStore();

  const [pipeline, setPipeline] = useState<{ id: string; title: string; description?: string } | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [assignedTo, setAssignedTo] = useState("");

  useEffect(() => {
    fetchTasks(pipelineId);
    if (pipelines.length === 0) fetchPipelines();
  }, [pipelineId, fetchTasks, fetchPipelines, pipelines.length]);

  useEffect(() => {
    if (pipelines.length > 0) {
      const p = pipelines.find((p) => p.id === pipelineId);
      if (p) setPipeline(p);
    }
  }, [pipelines, pipelineId]);

  useEffect(() => {
    if (addOpen && user?.role?.tier && ["MASTER", "LEADERSHIP"].includes(user.role.tier)) {
      apiFetch<{ data: { id: string; name: string }[] }>("/users")
        .then((res) => setMembers(res.data.map((m) => ({ id: m.id, name: m.name }))))
        .catch(() => setMembers([]));
    }
  }, [addOpen, user]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await addTask({
        title: title.trim(),
        pipelineId,
        description: description.trim() || undefined,
        priority,
        assignedTo: assignedTo || undefined,
      });
      setAddOpen(false);
      setTitle("");
      setDescription("");
      setAssignedTo("");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !pipeline) {
    return (
      <div className="space-y-6 h-full flex flex-col">
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="flex-1 flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className={`flex-1 ${cardClass}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl border-[var(--itools-border)] text-[var(--itools-muted)] hover:text-[var(--itools-navy-deep)]"
            onClick={() => router.push("/dashboard/pipelines")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--itools-navy-deep)] tracking-tight font-[family-name:var(--font-display)]">
              {pipeline.title}
            </h1>
            {pipeline.description && (
              <p className="text-sm text-[var(--itools-muted)] mt-0.5">{pipeline.description}</p>
            )}
          </div>
        </div>
        <Button onClick={() => setAddOpen(true)} className={btnPrimary}>
          <Plus className="w-4 h-4 mr-1.5" /> Add task
        </Button>
      </div>

      <div className="flex-1 min-h-0">
        <KanbanBoard tasks={tasks} pipelineId={pipelineId} onTaskSelect={setSelectedTask} />
      </div>

      <TaskDetailSheet
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="rounded-2xl border-[var(--itools-border)]">
          <DialogHeader>
            <DialogTitle className="font-bold text-[var(--itools-navy-deep)]">New task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddTask} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[var(--itools-muted)]">Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[var(--itools-muted)]">Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={`${inputClass} resize-none`} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[var(--itools-muted)]">Priority</Label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className={`w-full ${inputClass} px-3 py-2 text-sm`}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              {members.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[var(--itools-muted)]">Assign to</Label>
                  <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className={`w-full ${inputClass} px-3 py-2 text-sm`}>
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className={btnPrimary}>
                {saving ? "Creating..." : "Create task"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

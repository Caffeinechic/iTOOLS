"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePipelineStore, useAuthStore } from "@/lib/store";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Layers, ArrowRight, Kanban, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, EmptyState, AppSelect } from "@/components/patterns";
import { pageStackClass, panelCardClass, btnPrimary, inputClass } from "@/lib/tokens";

const cardClass = panelCardClass;

export default function PipelinesPage() {
  const { pipelines, loading, fetchPipelines } = usePipelineStore();
  const { user } = useAuthStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("GENERAL");
  const [saving, setSaving] = useState(false);

  const canCreate = user?.role?.tier === "MASTER" || user?.role?.tier === "LEADERSHIP";

  useEffect(() => {
    fetchPipelines();
  }, [fetchPipelines]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await apiFetch("/pipelines", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), description: description.trim(), type }),
      });
      await fetchPipelines();
      setCreateOpen(false);
      setTitle("");
      setDescription("");
      setType("GENERAL");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={pageStackClass}>
        <Skeleton className="h-10 w-48" />
        <div className="content-grid-wide sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className={`h-[200px] ${cardClass}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={pageStackClass}>
      <PageHeader title="Pipelines" description="Workflow boards for events, projects, and committee operations.">
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)} className={btnPrimary}>
            <Plus className="w-4 h-4 mr-1.5" /> New pipeline
          </Button>
        )}
      </PageHeader>

      <div className="content-grid-wide sm:grid-cols-2 lg:grid-cols-3">
        {pipelines.map((pipeline) => {
          const totalTasks = pipeline._count?.tasks || 0;
          const doneTasks = pipeline.statusCounts?.DONE || 0;
          const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

          return (
            <Card key={pipeline.id} className={`${cardClass} flex flex-col transition-colors hover:border-[var(--itools-navy)]/25 group`}>
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1 min-w-0">
                    <CardTitle className="text-base font-semibold text-[var(--itools-navy-deep)] font-[family-name:var(--font-display)] truncate">
                      {pipeline.title}
                    </CardTitle>
                    <CardDescription className="text-[var(--itools-muted)] text-sm line-clamp-2">
                      {pipeline.description || "No description."}
                    </CardDescription>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-[var(--itools-surface)] flex items-center justify-center shrink-0">
                    <Kanban className="w-4 h-4 text-[var(--itools-navy)]" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-[10px] uppercase">{pipeline.type}</Badge>
                    {pipeline.role && (
                      <Badge variant="outline" className="text-[10px]">{pipeline.role.name}</Badge>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-[var(--itools-muted)]">
                      <span>Progress</span>
                      <span className="font-medium text-[var(--itools-navy-deep)]">{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[var(--itools-surface)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--itools-navy)] rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-3 border-t border-[var(--itools-border)]">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center text-[var(--itools-muted)] text-xs font-medium">
                    <Layers className="w-4 h-4 mr-1.5" />
                    {totalTasks} tasks
                  </div>
                  <Link href={`/dashboard/pipelines/${pipeline.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 text-[var(--itools-navy)] rounded-lg text-xs font-semibold">
                      Open <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardFooter>
            </Card>
          );
        })}

        {pipelines.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              icon={Kanban}
              title="No pipelines yet"
              description="Create your first workflow to organize committee tasks on a Kanban board."
              action={
                canCreate ? (
                  <Button onClick={() => setCreateOpen(true)} className={btnPrimary}>
                    Create pipeline
                  </Button>
                ) : undefined
              }
            />
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-2xl border-[var(--itools-border)]">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-display)] text-[var(--itools-navy-deep)]">
              New pipeline
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={`${inputClass} min-h-[80px] resize-none`} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Type</Label>
              <AppSelect
                value={type}
                onValueChange={setType}
                options={[
                  { value: "GENERAL", label: "General" },
                  { value: "EVENT", label: "Event" },
                  { value: "WORKSHOP", label: "Workshop" },
                ]}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" disabled={saving} className={btnPrimary}>
                {saving ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

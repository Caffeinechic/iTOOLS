"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTaskStore, usePipelineStore, Task } from "@/lib/store";
import KanbanBoard from "@/components/kanban/kanban-board";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Plus } from "lucide-react";

export default function PipelineKanbanPage() {
  const params = useParams();
  const router = useRouter();
  const pipelineId = params.id as string;
  const { tasks, loading, fetchTasks } = useTaskStore();
  const { pipelines, fetchPipelines } = usePipelineStore();
  
  const [pipeline, setPipeline] = useState<any>(null);

  useEffect(() => {
    fetchTasks(pipelineId);
    if (pipelines.length === 0) {
      fetchPipelines();
    }
  }, [pipelineId, fetchTasks, fetchPipelines, pipelines.length]);

  useEffect(() => {
    if (pipelines.length > 0) {
      const p = pipelines.find(p => p.id === pipelineId);
      if (p) setPipeline(p);
    }
  }, [pipelines, pipelineId]);

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
          {[1,2,3,4].map(i => <Skeleton key={i} className="flex-1 rounded-xl bg-zinc-900/50" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full bg-zinc-900 text-zinc-400 hover:text-white"
            onClick={() => router.push("/dashboard/pipelines")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{pipeline.title}</h1>
            <p className="text-sm text-zinc-400">{pipeline.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2">
            <Plus className="w-4 h-4" /> Add Task
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <KanbanBoard tasks={tasks} pipelineId={pipelineId} />
      </div>
    </div>
  );
}

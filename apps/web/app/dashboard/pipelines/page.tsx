"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePipelineStore } from "@/lib/store";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Layers, ArrowRight, Kanban } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PipelinesPage() {
  const { pipelines, loading, fetchPipelines } = usePipelineStore();

  useEffect(() => {
    fetchPipelines();
  }, [fetchPipelines]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white tracking-tight">Pipelines</h1>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[200px] rounded-xl bg-zinc-900/50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Pipelines</h1>
          <p className="text-zinc-400 mt-1">Manage workflows and kanban boards</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]">
          + New Pipeline
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {pipelines.map((pipeline) => {
          const totalTasks = pipeline._count?.tasks || 0;
          const doneTasks = pipeline.statusCounts?.DONE || 0;
          const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

          return (
            <Card key={pipeline.id} className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-xl flex flex-col transition-all hover:bg-zinc-900/60 hover:border-indigo-500/30 group">
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-lg text-zinc-100 group-hover:text-indigo-400 transition-colors">
                      {pipeline.title}
                    </CardTitle>
                    <CardDescription className="text-zinc-500 line-clamp-2">
                      {pipeline.description || "No description provided."}
                    </CardDescription>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-zinc-800/80 flex items-center justify-center shrink-0">
                    <Kanban className="w-4 h-4 text-zinc-400" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-zinc-950/50 text-xs border-zinc-800 text-zinc-300">
                      {pipeline.type}
                    </Badge>
                    {pipeline.role && (
                      <Badge variant="outline" className="bg-indigo-950/20 text-xs border-indigo-500/20 text-indigo-400">
                        {pipeline.role.name}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Progress</span>
                      <span className="text-zinc-300 font-medium">{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t border-zinc-800/50">
                <div className="flex items-center justify-between w-full text-sm">
                  <div className="flex items-center text-zinc-500">
                    <Layers className="w-4 h-4 mr-1.5" />
                    <span>{totalTasks} Tasks</span>
                  </div>
                  <Link href={`/dashboard/pipelines/${pipeline.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 -mr-2">
                      Open Board <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </CardFooter>
            </Card>
          );
        })}

        {pipelines.length === 0 && !loading && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
            <Kanban className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-300">No pipelines found</h3>
            <p className="text-zinc-500 mt-1 max-w-sm mx-auto">Create your first workflow pipeline to start managing tasks and tracking progress.</p>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task, useTaskStore } from "@/lib/store";
import { TaskCard } from "./task-card";
import { useDroppable } from "@dnd-kit/core";

// Define the columns based on the valid statuses
export const COLUMNS = [
  { id: "TODO", title: "To Do", bg: "bg-zinc-50 border-zinc-200" },
  { id: "IN_PROGRESS", title: "In Progress", bg: "bg-blue-50/50 border-blue-100" },
  { id: "REVIEW", title: "Review", bg: "bg-purple-50/50 border-purple-100" },
  { id: "DONE", title: "Done", bg: "bg-emerald-50/50 border-emerald-100" }
];

function Column({ col, tasks }: { col: typeof COLUMNS[0], tasks: Task[] }) {
  const { setNodeRef, isOver } = useDroppable({
    id: col.id,
    data: {
      type: "Column",
      column: col,
    },
  });

  return (
    <div 
      className={`flex flex-col flex-1 shrink-0 min-w-[300px] max-w-[350px] rounded-xl border border-zinc-200 bg-zinc-50/50 overflow-hidden ${isOver ? 'ring-2 ring-indigo-400 bg-zinc-100' : ''}`}
    >
      <div className="p-3 border-b border-zinc-200 bg-white flex items-center justify-between">
        <h3 className="font-semibold text-sm text-zinc-800">{col.title} <span className="ml-2 text-xs font-normal text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">{tasks.length}</span></h3>
      </div>
      <div 
        ref={setNodeRef} 
        className="flex-1 p-2 overflow-y-auto custom-scrollbar flex flex-col gap-2 min-h-[150px]"
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <SortableTaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

function SortableTaskCard({ task }: { task: Task }) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging) {
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        className="opacity-30 border-2 border-dashed border-indigo-500/50 rounded-xl bg-indigo-500/10 h-[100px]" 
      />
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} />
    </div>
  );
}

export default function KanbanBoard({ tasks, pipelineId }: { tasks: Task[], pipelineId: string }) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const moveTask = useTaskStore(s => s.moveTask);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const columnsWithTasks = useMemo(() => {
    return COLUMNS.map(col => ({
      ...col,
      tasks: tasks.filter(t => t.status === col.id)
    }));
  }, [tasks]);

  const onDragStart = (e: DragStartEvent) => {
    if (e.active.data.current?.type === "Task") {
      setActiveTask(e.active.data.current.task);
    }
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = e;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === "Task";
    const isOverColumn = over.data.current?.type === "Column";
    const isOverTask = over.data.current?.type === "Task";

    if (!isActiveTask) return;

    const taskId = activeId as string;
    let newStatus = "";

    if (isOverColumn) {
      newStatus = overId as string;
    } else if (isOverTask) {
      newStatus = over.data.current?.task.status;
    }

    if (newStatus && active.data.current?.task.status !== newStatus) {
      moveTask(taskId, newStatus);
    }
  };

  return (
    <div className="w-full h-full flex gap-4 overflow-x-auto overflow-y-hidden pb-4 custom-scrollbar items-start">
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        {columnsWithTasks.map(col => (
          <Column key={col.id} col={col} tasks={col.tasks} />
        ))}
        
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

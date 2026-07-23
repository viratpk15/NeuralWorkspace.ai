import { useState } from "react";
import { useListAllTasks, useListProjects, useUpdateTask } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { KanbanSquare, CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListAllTasksQueryKey } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

const COLUMNS = [
  { id: "todo", title: "To Do", icon: Circle, color: "text-muted-foreground" },
  { id: "in_progress", title: "In Progress", icon: Clock, color: "text-blue-500" },
  { id: "review", title: "Review", icon: AlertCircle, color: "text-amber-500" },
  { id: "done", title: "Done", icon: CheckCircle2, color: "text-green-500" },
] as const;

const PRIORITY_COLORS = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  high: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  urgent: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function Planner() {
  const { data: tasks, isLoading } = useListAllTasks();
  const { data: projects } = useListProjects();
  const updateTask = useUpdateTask();
  const queryClient = useQueryClient();

  const handleStatusChange = (taskId: number, newStatus: string) => {
    updateTask.mutate(
      { id: taskId, data: { status: newStatus as any } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAllTasksQueryKey() });
        }
      }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-3">
          <KanbanSquare className="size-8 text-primary" />
          Project Planner
        </h1>
        <p className="text-muted-foreground">Manage tasks and track project milestones.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 overflow-hidden min-h-[500px]">
        {COLUMNS.map((col) => (
          <div key={col.id} className="flex flex-col bg-card/30 rounded-xl border border-border/50 overflow-hidden">
            <div className="p-3 border-b border-border/50 bg-card/50 flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium">
                <col.icon className={cn("size-4", col.color)} />
                {col.title}
              </div>
              <Badge variant="secondary" className="rounded-full">
                {tasks?.filter((t) => t.status === col.id).length || 0}
              </Badge>
            </div>
            
            <div className="flex-1 p-3 overflow-y-auto space-y-3">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)
              ) : (
                tasks
                  ?.filter((t) => t.status === col.id)
                  .map((task) => {
                    const project = projects?.find((p) => p.id === task.projectId);
                    return (
                      <Card key={task.id} className="cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors shadow-sm group">
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start mb-2 gap-2">
                            <h4 className="text-sm font-medium leading-tight">{task.title}</h4>
                          </div>
                          {task.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-auto">
                            <Badge variant="outline" className="text-[10px] bg-background/50 truncate max-w-[120px]">
                              {project?.name || "Unknown Project"}
                            </Badge>
                            <Badge variant="outline" className={cn("text-[10px] capitalize", PRIORITY_COLORS[task.priority])}>
                              {task.priority}
                            </Badge>
                          </div>
                          
                          {/* Quick Actions (visible on hover) */}
                          <div className="mt-3 pt-3 border-t border-border/50 flex gap-1 hidden group-hover:flex">
                            {COLUMNS.filter(c => c.id !== task.status).map(c => (
                              <button
                                key={c.id}
                                onClick={() => handleStatusChange(task.id, c.id)}
                                className="text-[10px] px-2 py-1 rounded bg-muted hover:bg-primary/20 hover:text-primary transition-colors flex-1"
                              >
                                {c.title}
                              </button>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

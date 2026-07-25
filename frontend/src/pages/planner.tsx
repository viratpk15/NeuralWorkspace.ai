import { useState } from "react";
import {
  useListAllTasks,
  useListProjects,
  useCreateProject,
  useCreateTask,
  useUpdateTask,
  getListAllTasksQueryKey,
  getListProjectsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Label,
} from "@/components/ui/label";
import {
  KanbanSquare,
  Plus,
  FolderOpen,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { TaskInputStatus, TaskInputPriority } from "@workspace/api-client-react";
import { StatusBadge, TaskPriorityBadge } from "@/components/status-indicator";

const COLUMNS = [
  { id: "todo" as const, title: "To Do" },
  { id: "in_progress" as const, title: "In Progress" },
  { id: "review" as const, title: "Review" },
  { id: "done" as const, title: "Done" },
];

// Priority colors now handled by TaskPriorityBadge component

function ProjectCreateForm({
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  onSubmit: (values: { name: string; description: string }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), description: description.trim() });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="new-project-name">Project Name</Label>
        <Input
          id="new-project-name"
          placeholder="E.g. API Redesign"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) submit();
          }}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-project-desc">Description</Label>
        <Textarea
          id="new-project-desc"
          placeholder="Brief project description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={!name.trim() || isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Project
        </Button>
      </DialogFooter>
    </div>
  );
}

function TaskCreateForm({
  projects,
  onCancel,
  isSubmitting,
  onSubmit,
}: {
  projects: { id: number; name: string }[];
  onCancel: () => void;
  isSubmitting: boolean;
  onSubmit: (values: {
    projectId: number;
    title: string;
    description: string;
    status: TaskInputStatus;
    priority: TaskInputPriority;
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskInputStatus>("todo");
  const [priority, setPriority] = useState<TaskInputPriority>("medium");
  const [projectId, setProjectId] = useState<string>(projects[0]?.id.toString() ?? "");

  const submit = () => {
    if (!title.trim() || !projectId) return;
    onSubmit({
      projectId: parseInt(projectId, 10),
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="task-title">Title</Label>
        <Input
          id="task-title"
          placeholder="E.g. Implement user authentication"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-desc">Description</Label>
        <Textarea
          id="task-desc"
          placeholder="Brief task description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Project</Label>
          <Select value={projectId} onValueChange={setProjectId} disabled={projects.length === 0}>
            <SelectTrigger>
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id.toString()}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as TaskInputStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COLUMNS.map((col) => (
                <SelectItem key={col.id} value={col.id}>
                  {col.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Priority</Label>
        <Select value={priority} onValueChange={(v) => setPriority(v as TaskInputPriority)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={!title.trim() || !projectId || isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Task
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function Planner() {
  const { data: tasks, isLoading: tasksLoading } = useListAllTasks();
  const { data: projects, isLoading: projectsLoading } = useListProjects();
  const createProject = useCreateProject();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const queryClient = useQueryClient();

  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  const handleStatusChange = (taskId: number, newStatus: TaskInputStatus) => {
    updateTask.mutate(
      { id: taskId, data: { status: newStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAllTasksQueryKey() });
        },
      },
    );
  };

  const handleCreateProject = (values: { name: string; description: string }) => {
    createProject.mutate(
      { data: { name: values.name.trim(), description: values.description.trim() } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          toast.success("Project created");
          setProjectDialogOpen(false);
        },
        onError: (error) => toast.error(error.message || "Failed to create project"),
      },
    );
  };

  const handleCreateTask = (values: {
    projectId: number;
    title: string;
    description: string;
    status: TaskInputStatus;
    priority: TaskInputPriority;
  }) => {
    createTask.mutate(
      {
        projectId: values.projectId,
        data: {
          title: values.title,
          description: values.description,
          status: values.status,
          priority: values.priority,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAllTasksQueryKey() });
          toast.success("Task created");
          setTaskDialogOpen(false);
        },
        onError: (error) => toast.error(error.message || "Failed to create task"),
      },
    );
  };

  const isLoading = tasksLoading || projectsLoading;
  const hasProjects = projects && projects.length > 0;
  const hasTasks = tasks && tasks.length > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 h-full flex flex-col">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-3">
            <KanbanSquare className="size-8 text-foreground" />
            Project Planner
          </h1>
          <p className="text-muted-foreground">Manage tasks and track project milestones.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setProjectDialogOpen(true)}>
            <FolderOpen className="size-4 mr-2" />
            New Project
          </Button>
          <Button onClick={() => setTaskDialogOpen(true)} disabled={!hasProjects}>
            <Plus className="size-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {!isLoading && !hasProjects && (
        <Card className="border-dashed flex-1">
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <FolderOpen className="size-12 text-muted-foreground mb-4 opacity-60" />
            <h3 className="text-lg font-medium mb-2">No projects yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Create your first project to start organizing tasks and tracking progress.
            </p>
            <Button onClick={() => setProjectDialogOpen(true)}>
              <Plus className="size-4 mr-2" />
              Create Your First Project
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && hasProjects && !hasTasks && (
        <Card className="border-dashed flex-1">
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <KanbanSquare className="size-12 text-muted-foreground mb-4 opacity-60" />
            <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Create your first task to start tracking work in your projects.
            </p>
            <Button onClick={() => setTaskDialogOpen(true)}>
              <Plus className="size-4 mr-2" />
              Create Your First Task
            </Button>
          </CardContent>
        </Card>
      )}

      {hasProjects && hasTasks && (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 overflow-hidden min-h-0">
          {COLUMNS.map((col) => (
            <div
              key={col.id}
              className="flex flex-col bg-card/30 rounded-xl border border-border/50 overflow-hidden"
            >
               <div className="p-3 border-b border-border/50 bg-card/50 flex items-center justify-between">
                 <div className="flex items-center gap-2 font-medium">
                   {col.title}
                 </div>
                 <Badge variant="secondary" className="rounded-full">
                   {tasks?.filter((t) => t.status === col.id).length || 0}
                 </Badge>
               </div>

              <div className="flex-1 p-3 overflow-y-auto space-y-3 min-h-0">
                {isLoading
                  ? Array(3)
                      .fill(0)
                      .map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)
                  : tasks
                      ?.filter((t) => t.status === col.id)
                      .map((task) => {
                        const project = projects?.find((p) => p.id === task.projectId);
                        return (
                          <Card
                            key={task.id}
                            className="cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors shadow-sm group"
                          >
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
                                <Badge
                                  variant="outline"
                                  className="text-[10px] bg-background/50 truncate max-w-[120px]"
                                >
                                  {project?.name || "Unknown Project"}
                                </Badge>
                                <TaskPriorityBadge priority={task.priority} size="sm" />
                                <StatusBadge status={task.status} type="task" showDot size="sm" />
                              </div>

                              <div className="mt-3 pt-3 border-t border-border/50 flex gap-1 hidden group-hover:flex">
                                {COLUMNS.filter((c) => c.id !== task.status).map((c) => (
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
                      })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
            <DialogDescription>Create a project to organize your tasks.</DialogDescription>
          </DialogHeader>
          <ProjectCreateForm
            onSubmit={handleCreateProject}
            onCancel={() => setProjectDialogOpen(false)}
            isSubmitting={createProject.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
            <DialogDescription>Create a task within an existing project.</DialogDescription>
          </DialogHeader>
          {projects && (
            <TaskCreateForm
              projects={projects}
              onCancel={() => setTaskDialogOpen(false)}
              isSubmitting={createTask.isPending}
              onSubmit={handleCreateTask}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

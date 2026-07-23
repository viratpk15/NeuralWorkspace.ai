import { useGetDashboardStats } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, CheckCircle2, MessageSquare, Database, Terminal, ListTodo, Bot, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { data: stats, isLoading, isError } = useGetDashboardStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="col-span-2 h-[400px] rounded-xl" />
          <Skeleton className="col-span-1 h-[400px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
        <Activity className="size-12 mb-4 text-destructive opacity-50" />
        <h2 className="text-xl font-semibold">Failed to load dashboard</h2>
        <p>There was an error fetching your workspace statistics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Command Center</h1>
        <p className="text-muted-foreground">Overview of your development workspace and agents.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur border-primary/20 hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Terminal className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground mt-1">Out of {stats.totalProjects} total</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur border-accent/20 hover:border-accent/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <CheckCircle2 className="size-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">Out of {stats.totalTasks} total</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-blue-500/20 hover:border-blue-500/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">AI Conversations</CardTitle>
            <MessageSquare className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConversations}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all agents</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-green-500/20 hover:border-green-500/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Memory Items</CardTitle>
            <Database className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMemoryItems}</div>
            <p className="text-xs text-muted-foreground mt-1">Context snippets saved</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 bg-card/40 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="size-5 text-primary" />
              Project Progress
            </CardTitle>
            <CardDescription>Status of your active development projects</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {stats.projectProgress.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No active projects.</p>
              </div>
            ) : (
              stats.projectProgress.map((project) => {
                const percent = project.totalTasks > 0 ? Math.round((project.completedTasks / project.totalTasks) * 100) : 0;
                return (
                  <div key={project.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{project.name}</span>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {project.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">{percent}%</span>
                    </div>
                    <Progress value={percent} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {project.completedTasks} of {project.totalTasks} tasks completed
                    </p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 bg-card/40 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-5 text-accent" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest actions in your workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {stats.recentActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No recent activity.</p>
                </div>
              ) : (
                stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex gap-3 relative">
                    <div className="mt-0.5">
                      <div className="size-2 rounded-full bg-primary ring-4 ring-background" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm text-foreground/90">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

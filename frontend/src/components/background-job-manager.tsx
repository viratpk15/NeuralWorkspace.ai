import { useState } from "react";
import { useBackgroundJobs } from "@/contexts/background-jobs-context";
import { JobStatusBadge } from "@/components/job-status-badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  List,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { JobType } from "@/hooks/use-sse-stream";

const JOB_TYPE_LABELS: Record<JobType, string> = {
  architecture: "Architecture Studio",
  documentation: "Documentation Studio",
  conversation: "AI Assistant",
};

const JOB_TYPE_PATHS: Record<JobType, string> = {
  architecture: "/architecture",
  documentation: "/docs-studio",
  conversation: "/assistant",
};

export function BackgroundJobManager() {
  const { activeJobs, jobs, removeJob, clearCompleted } = useBackgroundJobs();
  const [open, setOpen] = useState(false);

  const recentJobs = jobs.slice(0, 10);
  const hasActive = activeJobs.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "relative h-8 px-2",
            hasActive
              ? "text-primary hover:bg-primary/10"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          <List className="size-4" />
          {hasActive && (
            <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {activeJobs.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Background Tasks</h3>
            {jobs.some((j) => j.status === "completed" || j.status === "failed") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCompleted}
                className="h-6 px-2 text-xs"
              >
                <Trash2 className="size-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-80">
          {recentJobs.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <Clock className="size-6 mx-auto mb-2 opacity-30" />
              <p>No background tasks</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className={cn(
                    "p-3 rounded-lg border transition-colors",
                    job.status === "completed"
                      ? "bg-green-500/5 border-green-500/20"
                      : job.status === "failed"
                        ? "bg-red-500/5 border-red-500/20"
                        : job.status === "generating"
                          ? "bg-blue-500/5 border-blue-500/20"
                          : "bg-muted/30 border-border/50",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <JobStatusBadge status={job.status} showIcon={false} />
                        <span className="text-xs font-medium truncate">
                          {JOB_TYPE_LABELS[job.type]}
                        </span>
                      </div>
                      <p className="text-sm font-medium mt-1 truncate">{job.title}</p>
                      {job.error && (
                        <p className="text-xs text-destructive mt-1 line-clamp-2">
                          {job.error}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(job.createdAt, { addSuffix: true })}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {job.status !== "completed" && job.status !== "failed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeJob(job.id)}
                          className="h-5 w-5 p-0"
                          title="Cancel"
                        >
                          <X className="size-3" />
                        </Button>
                      )}
                      {(job.status === "completed" || job.status === "failed") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            window.location.href = JOB_TYPE_PATHS[job.type];
                            setOpen(false);
                          }}
                          className="h-5 w-5 p-0"
                          title="Go to page"
                        >
                          <ExternalLink className="size-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {job.status === "generating" && (
                    <>
                      <Progress value={job.progress} className="h-1 mt-2" />
                      <div className="flex items-center gap-1 mt-1">
                        <AlertCircle className="size-3 text-blue-500 animate-pulse" />
                        <span className="text-xs text-muted-foreground">
                          Generating... {job.progress}%
                        </span>
                      </div>
                    </>
                  )}

                  {job.status === "queued" && (
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="size-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Waiting in queue...</span>
                    </div>
                  )}

                  {job.status === "completed" && (
                    <div className="flex items-center gap-1 mt-1">
                      <CheckCircle2 className="size-3 text-green-500" />
                      <span className="text-xs text-muted-foreground">Done</span>
                    </div>
                  )}

                  {job.status === "failed" && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertCircle className="size-3 text-red-500" />
                      <span className="text-xs text-muted-foreground">Failed</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {hasActive && (
          <>
            <Separator />
            <div className="p-2 text-xs text-center text-muted-foreground">
              {activeJobs.length} active task{activeJobs.length !== 1 ? "s" : ""} running
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

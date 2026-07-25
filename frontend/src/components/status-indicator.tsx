import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Circle,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Pause,
  Archive,
  Zap,
  Code2,
  Layers,
  KanbanSquare,
  BookOpen,
  TestTube2,
  Bug,
  MessageSquare,
} from "lucide-react";

// ─── Project Status ──────────────────────────────────────────────

type ProjectStatus = "planning" | "active" | "paused" | "completed" | "archived";

interface ProjectStatusConfig {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  dotColor: string;
}

const PROJECT_STATUS_CONFIG: Record<ProjectStatus, ProjectStatusConfig> = {
  planning: {
    label: "Planning",
    icon: Circle,
    color: "text-muted-foreground",
    bgColor: "bg-muted/50",
    borderColor: "border-muted-foreground/30",
    dotColor: "bg-muted-foreground",
  },
  active: {
    label: "Active",
    icon: Zap,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30",
    dotColor: "bg-primary",
  },
  paused: {
    label: "Paused",
    icon: Pause,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    dotColor: "bg-amber-500",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    dotColor: "bg-emerald-500",
  },
  archived: {
    label: "Archived",
    icon: Archive,
    color: "text-muted-foreground",
    bgColor: "bg-muted/30",
    borderColor: "border-muted-foreground/20",
    dotColor: "bg-muted-foreground",
  },
};

// ─── Task Status ─────────────────────────────────────────────────

type TaskStatus = "todo" | "in_progress" | "review" | "done" | "cancelled";

interface TaskStatusConfig {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  dotColor: string;
}

const TASK_STATUS_CONFIG: Record<TaskStatus, TaskStatusConfig> = {
  todo: {
    label: "To Do",
    icon: Circle,
    color: "text-muted-foreground",
    bgColor: "bg-muted/50",
    borderColor: "border-muted-foreground/30",
    dotColor: "bg-muted-foreground",
  },
  in_progress: {
    label: "In Progress",
    icon: Loader2,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30",
    dotColor: "bg-primary",
  },
  review: {
    label: "Review",
    icon: AlertCircle,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    dotColor: "bg-amber-500",
  },
  done: {
    label: "Done",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    dotColor: "bg-emerald-500",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    color: "text-muted-foreground",
    bgColor: "bg-muted/50",
    borderColor: "border-muted-foreground/30",
    dotColor: "bg-muted-foreground",
  },
};

// ─── Job Status ──────────────────────────────────────────────────

type JobStatus = "queued" | "generating" | "completed" | "failed";

interface JobStatusConfig {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  dotColor: string;
}

const JOB_STATUS_CONFIG: Record<JobStatus, JobStatusConfig> = {
  queued: {
    label: "Queued",
    icon: Clock,
    color: "text-muted-foreground",
    bgColor: "bg-muted/50",
    borderColor: "border-muted-foreground/30",
    dotColor: "bg-muted-foreground",
  },
  generating: {
    label: "Generating",
    icon: Loader2,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30",
    dotColor: "bg-primary",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    dotColor: "bg-emerald-500",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive/30",
    dotColor: "bg-destructive",
  },
};

// ─── Agent Types ─────────────────────────────────────────────────

export type AgentType = "coding" | "architecture" | "planning" | "documentation" | "testing" | "debugging" | "general";

interface AgentTypeConfig {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const AGENT_TYPE_CONFIG: Record<AgentType, AgentTypeConfig> = {
  coding: {
    label: "Coding Agent",
    icon: Code2,
    color: "text-foreground",
    bgColor: "bg-muted",
  },
  architecture: {
    label: "Architecture Agent",
    icon: Layers,
    color: "text-foreground",
    bgColor: "bg-muted",
  },
  planning: {
    label: "Planning Agent",
    icon: KanbanSquare,
    color: "text-foreground",
    bgColor: "bg-muted",
  },
  documentation: {
    label: "Docs Agent",
    icon: BookOpen,
    color: "text-foreground",
    bgColor: "bg-muted",
  },
  testing: {
    label: "Testing Agent",
    icon: TestTube2,
    color: "text-foreground",
    bgColor: "bg-muted",
  },
  debugging: {
    label: "Debugging Agent",
    icon: Bug,
    color: "text-foreground",
    bgColor: "bg-muted",
  },
  general: {
    label: "General Assistant",
    icon: MessageSquare,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
};

// ─── Status Indicator Components ─────────────────────────────────

interface StatusBadgeProps {
  status: ProjectStatus | TaskStatus | JobStatus;
  type?: "project" | "task" | "job";
  showIcon?: boolean;
  showDot?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StatusBadge({
  status,
  type = "project",
  showIcon = true,
  showDot = true,
  size = "md",
  className,
}: StatusBadgeProps) {
  let config:
    | ProjectStatusConfig
    | TaskStatusConfig
    | JobStatusConfig
    | undefined;

  if (type === "project") {
    config = PROJECT_STATUS_CONFIG[status as ProjectStatus];
  } else if (type === "task") {
    config = TASK_STATUS_CONFIG[status as TaskStatus];
  } else {
    config = JOB_STATUS_CONFIG[status as JobStatus];
  }

  // Fallback for unknown statuses
  if (!config) {
    config = {
      label: typeof status === 'string' ? status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown',
      icon: Circle,
      color: "text-muted-foreground",
      bgColor: "bg-muted/50",
      borderColor: "border-muted-foreground/30",
      dotColor: "bg-muted-foreground",
    };
  }

  const Icon = config.icon;
  const isSpinning = status === "in_progress" || status === "generating";

  const sizeClasses = {
    sm: "text-[10px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-0.5 gap-1.5",
    lg: "text-sm px-3 py-1 gap-2",
  };

  const iconSize = {
    sm: "size-3",
    md: "size-3.5",
    lg: "size-4",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium border transition-all duration-200",
        sizeClasses[size],
        config.color,
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      {showDot && (
        <span className={cn("relative flex size-2 rounded-full", config.dotColor)}>
          {(status === "in_progress" || status === "generating") && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 bg-current" />
          )}
        </span>
      )}
      {showIcon && (
        <Icon className={cn(iconSize[size], isSpinning && "animate-spin")} />
      )}
      {config.label}
    </Badge>
  );
}

// ─── Agent Type Badge ────────────────────────────────────────────

interface AgentBadgeProps {
  agentType: AgentType;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AgentBadge({
  agentType,
  showIcon = true,
  size = "md",
  className,
}: AgentBadgeProps) {
  const config = AGENT_TYPE_CONFIG[agentType];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-[10px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-0.5 gap-1.5",
    lg: "text-sm px-3 py-1 gap-2",
  };

  const iconSize = {
    sm: "size-3",
    md: "size-3.5",
    lg: "size-4",
  };

  return (
    <Badge
      variant="secondary"
      className={cn(
        "font-medium transition-all duration-200",
        sizeClasses[size],
        config.color,
        config.bgColor,
        className
      )}
    >
      {showIcon && <Icon className={iconSize[size]} />}
      {config.label}
    </Badge>
  );
}

// ─── Workflow Stage Indicator ────────────────────────────────────

interface WorkflowStageProps {
  stageLabel: string;
  stageNumber: string;
  isActive?: boolean;
  isCompleted?: boolean;
  description?: string;
  className?: string;
}

export function WorkflowStage({
  stageLabel,
  stageNumber,
  isActive = false,
  isCompleted = false,
  description,
  className,
}: WorkflowStageProps) {
  return (
    <div className={cn("flex items-start gap-4", className)}>
      {/* Stage Number Circle */}
      <div className="relative">
        <div
          className={cn(
            "size-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300",
            isActive && "bg-primary text-primary-foreground shadow-lg shadow-primary/30",
            isCompleted && "bg-emerald-500/20 text-emerald-700 border-2 border-emerald-500/50",
            !isActive && !isCompleted && "bg-muted text-muted-foreground border border-border"
          )}
        >
          {isCompleted ? (
            <CheckCircle2 className="size-5" />
          ) : (
            stageNumber
          )}
        </div>
        {/* Connector Line */}
        {description && (
          <div className="hidden md:flex absolute left-[2.05rem] top-[2.5rem] -translate-x-1/2 flex-col items-center">
            <div className="w-px h-8 bg-border/50" />
          </div>
        )}
      </div>

      {/* Stage Content */}
      <div className="flex-1 min-w-0 pb-8">
        <div className="flex items-center gap-2 mb-1">
          <h3
            className={cn(
              "font-semibold transition-colors duration-300",
              isActive && "text-foreground",
              isCompleted && "text-emerald-700",
              !isActive && !isCompleted && "text-muted-foreground"
            )}
          >
            {stageLabel}
          </h3>
          {isActive && (
            <span className="relative flex size-2 rounded-full bg-primary">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 bg-primary" />
            </span>
          )}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Task Priority Badge ─────────────────────────────────────────

type TaskPriority = "low" | "medium" | "high" | "urgent";

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function TaskPriorityBadge({
  priority,
  size = "md",
  className,
}: TaskPriorityBadgeProps) {
  const config = {
    low: { label: "Low", color: "text-muted-foreground", bgColor: "bg-muted/50", borderColor: "border-muted-foreground/30" },
    medium: { label: "Medium", color: "text-foreground", bgColor: "bg-muted/50", borderColor: "border-foreground/20" },
    high: { label: "High", color: "text-foreground", bgColor: "bg-muted/50", borderColor: "border-foreground/30" },
    urgent: { label: "Urgent", color: "text-destructive", bgColor: "bg-destructive/10", borderColor: "border-destructive/30" },
  }[priority];

  const sizeClasses = {
    sm: "text-[10px] px-2 py-0.5",
    md: "text-xs px-2.5 py-0.5",
    lg: "text-sm px-3 py-1",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium capitalize border transition-all duration-200",
        sizeClasses[size],
        config.color,
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      {priority === "urgent" && (
        <span className="relative flex size-1.5 rounded-full bg-destructive mr-1" />
      )}
      {config.label}
    </Badge>
  );
}

// ─── Progress Indicator ──────────────────────────────────────────

interface ProgressIndicatorProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ProgressIndicator({
  value,
  max = 100,
  label,
  showPercentage = true,
  size = "md",
  className,
}: ProgressIndicatorProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  const getProgressColor = () => {
    if (percentage >= 100) return "bg-emerald-500";
    if (percentage >= 70) return "bg-primary";
    if (percentage >= 40) return "bg-amber-500";
    return "bg-muted-foreground";
  };

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          {showPercentage && (
            <span className="text-xs font-semibold text-foreground">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div className={cn("w-full bg-muted/50 rounded-full overflow-hidden border border-border/50", sizeClasses[size])}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            getProgressColor()
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
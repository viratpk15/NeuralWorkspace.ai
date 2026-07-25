import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import type { JobStatus } from "@/hooks/use-sse-stream";

interface JobStatusBadgeProps {
  status: JobStatus;
  className?: string;
  showIcon?: boolean;
}

const STATUS_CONFIG: Record<
  JobStatus,
  {
    label: string;
    icon: React.ElementType;
    variant: "default" | "secondary" | "outline" | "destructive";
    className: string;
  }
> = {
  queued: {
    label: "Queued",
    icon: Clock,
    variant: "outline",
    className: "text-muted-foreground",
  },
  generating: {
    label: "Generating",
    icon: AlertCircle,
    variant: "secondary",
    className: "text-foreground",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    variant: "default",
    className: "",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    variant: "destructive",
    className: "",
  },
};

export function JobStatusBadge({ status, className, showIcon = true }: JobStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, "text-xs font-medium", className)}
    >
      {showIcon && <Icon className="size-3 mr-1" />}
      {config.label}
    </Badge>
  );
}

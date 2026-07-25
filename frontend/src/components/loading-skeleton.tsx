import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function DocumentListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-3 rounded-lg border border-border/50 space-y-2 animate-pulse"
        >
          <Skeleton className="h-4 w-3/4" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-1/4" />
            <Skeleton className="h-3 w-1/6" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MarkdownSkeleton({ lines = 12 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4 bg-muted",
            i === 0 ? "w-3/4" : i % 3 === 0 ? "w-1/2" : "w-full",
          )}
        />
      ))}
    </div>
  );
}

export function ChatMessageSkeleton({ isUser = false }: { isUser?: boolean }) {
  return (
    <div
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3",
          isUser ? "bg-primary/20" : "bg-muted",
        )}
      >
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  );
}

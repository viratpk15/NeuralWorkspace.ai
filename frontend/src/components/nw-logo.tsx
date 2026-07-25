import { cn } from "@/lib/utils";

interface NWLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function NWLogo({ size = "md", className }: NWLogoProps) {
  const sizeClasses = {
    sm: "size-6",
    md: "size-8",
    lg: "size-12",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("relative flex items-center justify-center", sizeClasses[size])}>
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Background rounded square */}
          <rect width="40" height="40" rx="8" fill="currentColor" className="text-foreground/10" />
          
          {/* Neural network nodes */}
          <circle cx="12" cy="12" r="2.5" fill="currentColor" className="text-foreground" />
          <circle cx="28" cy="12" r="2.5" fill="currentColor" className="text-foreground" />
          <circle cx="20" cy="20" r="3" fill="currentColor" className="text-primary" />
          <circle cx="12" cy="28" r="2.5" fill="currentColor" className="text-foreground" />
          <circle cx="28" cy="28" r="2.5" fill="currentColor" className="text-foreground" />
          
          {/* Neural network connections */}
          <path d="M12 12L20 20M28 12L20 20M12 28L20 20M28 28L20 20" stroke="currentColor" strokeWidth="1.5" className="text-foreground/60" />
        </svg>
      </div>
      <span className={cn("font-bold tracking-tight text-foreground", textSizeClasses[size])}>
        NW
      </span>
    </div>
  );
}
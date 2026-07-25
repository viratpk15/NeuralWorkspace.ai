import * as React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  accentBorder?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, hover = true, accentBorder = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "glass",
          hover && "glass-hover transition-all duration-150",
          accentBorder && "border-foreground/10",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
GlassCard.displayName = "GlassCard";

export { GlassCard, type GlassCardProps };


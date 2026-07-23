import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Terminal,
  Bot,
  KanbanSquare,
  Layers,
  BookOpen,
  Database,
  MessageSquare,
  Workflow,
  Settings,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const SIDEBAR_ITEMS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/workspace", label: "Multi-Agent Workspace", icon: Terminal },
  { path: "/assistant", label: "Coding Assistant", icon: Bot },
  { path: "/planner", label: "Project Planner", icon: KanbanSquare },
  { path: "/architecture", label: "Architecture Studio", icon: Layers },
  { path: "/docs-studio", label: "Documentation Studio", icon: BookOpen },
  { path: "/memory", label: "Workspace Memory", icon: Database },
  { path: "/prompts", label: "Prompt Library", icon: MessageSquare },
  { path: "/workflow", label: "Development Workflow", icon: Workflow },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-16 lg:w-64 border-r border-border bg-sidebar flex flex-col justify-between shrink-0 transition-all duration-300 z-10">
        <div className="flex flex-col py-4 px-2 lg:px-4 space-y-6 overflow-hidden">
          <div className="flex items-center justify-center lg:justify-start lg:px-2 gap-3 mb-2">
            <div className="size-8 rounded-md bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
              <Bot className="size-5 text-primary" />
            </div>
            <span className="font-semibold text-lg tracking-tight hidden lg:block truncate text-sidebar-foreground">
              Neural<span className="text-primary font-bold">Workspace</span>
            </span>
          </div>

          <nav className="flex flex-col gap-1 w-full">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));

              return (
                <Tooltip key={item.path} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.path}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group relative",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                      )}
                      <Icon className={cn("size-5 shrink-0", isActive ? "text-primary" : "opacity-80 group-hover:opacity-100")} />
                      <span className="text-sm font-medium hidden lg:block truncate">
                        {item.label}
                      </span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="lg:hidden bg-popover text-popover-foreground border-border shadow-md">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>
        </div>

        <div className="p-2 lg:p-4 border-t border-sidebar-border">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Link
                href="/settings"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors group",
                  location === "/settings"
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Settings className="size-5 shrink-0 opacity-80 group-hover:opacity-100" />
                <span className="text-sm font-medium hidden lg:block truncate">
                  Settings
                </span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="lg:hidden bg-popover text-popover-foreground border-border shadow-md">
              Settings
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-auto bg-background/50">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
        <div className="relative h-full z-0 p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

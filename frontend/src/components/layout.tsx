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
import { BackgroundJobManager } from "@/components/background-job-manager";
import { NWLogo } from "@/components/nw-logo";

const SIDEBAR_ITEMS = [
  { path: "/", label: "Neural Workspace", icon: LayoutDashboard },
  { path: "/workspace", label: "Workspace", icon: Terminal },
  { path: "/assistant", label: "AI Engineering Assistant", icon: Bot },
  { path: "/planner", label: "Project Planner", icon: KanbanSquare },
  { path: "/architecture", label: "Architecture Designer", icon: Layers },
  { path: "/docs-studio", label: "Documentation Generator", icon: BookOpen },
  { path: "/memory", label: "Knowledge Memory", icon: Database },
  { path: "/prompts", label: "Prompt Hub", icon: MessageSquare },
  { path: "/workflow", label: "Development Workflow", icon: Workflow },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-16 lg:w-64 border-r border-border bg-sidebar flex flex-col justify-between shrink-0 transition-all duration-150 z-10">
        <div className="flex flex-col py-4 px-2 lg:px-4 space-y-6 overflow-hidden">
          <div className="flex items-center justify-center lg:justify-start lg:px-2 gap-3 mb-2">
            <NWLogo size="md" />
          </div>

          <nav className="flex flex-col gap-0.5 w-full">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                location === item.path || (item.path !== "/" && location.startsWith(item.path));

              return (
                <Tooltip key={item.path} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.path}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 group relative",
                        isActive
                          ? "bg-muted text-foreground"
                          : "text-sidebar-foreground/60 hover:bg-accent hover:text-sidebar-foreground",
                      )}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-foreground rounded-full" />
                      )}
                      <Icon
                        className={cn(
                          "size-5 shrink-0",
                          isActive ? "text-foreground" : "opacity-60 group-hover:opacity-100",
                        )}
                      />
                      <span className="text-sm font-medium hidden lg:block truncate">
                        {item.label}
                      </span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="lg:hidden"
                  >
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>
        </div>

        <div className="p-2 lg:p-4 border-t border-border">
          {/* Background Task Indicator */}
          <div className="flex items-center justify-center lg:justify-start lg:px-2 mb-2">
            <BackgroundJobManager />
            <span className="text-xs text-sidebar-foreground/40 hidden lg:block ml-2">
              Background Tasks
            </span>
          </div>

          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Link
                href="/settings"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 group",
                  location === "/settings"
                    ? "bg-muted text-foreground"
                    : "text-sidebar-foreground/60 hover:bg-accent hover:text-sidebar-foreground",
                )}
              >
                <Settings className="size-5 shrink-0 opacity-60 group-hover:opacity-100" />
                <span className="text-sm font-medium hidden lg:block truncate">Settings</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="lg:hidden"
            >
              Settings
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-auto bg-background">
        <div className="relative h-full z-0 p-4 md:p-8 animate-in fade-in duration-150">
          {children}
        </div>
      </main>
    </div>
  );
}

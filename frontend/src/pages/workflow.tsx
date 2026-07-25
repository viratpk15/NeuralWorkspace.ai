import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Workflow, ArrowRight, ChevronRight, Zap } from "lucide-react";
import { Link } from "wouter";

const STAGES = [
  {
    id: "idea",
    label: "Idea",
    desc: "Conceptualize and scope",
    path: "/planner",
    number: "01",
    detail: "Define your vision, goals, and initial requirements.",
  },
  {
    id: "plan",
    label: "Planning",
    desc: "Define requirements",
    path: "/planner",
    number: "02",
    detail: "Break down features into actionable tasks and milestones.",
  },
  {
    id: "arch",
    label: "Architecture",
    desc: "Design the system",
    path: "/architecture",
    number: "03",
    detail: "Generate system designs, database schemas, and API specs.",
  },
  {
    id: "code",
    label: "Coding",
    desc: "Implement features",
    path: "/assistant",
    number: "04",
    detail: "AI-powered coding assistance with real-time feedback.",
  },
  {
    id: "test",
    label: "Testing",
    desc: "Verify & QA",
    path: "/workspace",
    number: "05",
    detail: "Write tests, identify edge cases, and validate output.",
  },
  {
    id: "docs",
    label: "Documentation",
    desc: "Write guides",
    path: "/docs-studio",
    number: "06",
    detail: "Generate READMEs, API docs, and deployment guides.",
  },
  {
    id: "deploy",
    label: "Deployment",
    desc: "Ship to production",
    path: "/planner",
    number: "07",
    detail: "Plan your deployment strategy and release pipeline.",
  },
];

export default function WorkflowPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Workflow className="size-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Development Workflow
          </h1>
          <p className="text-muted-foreground mt-1">
            Your AI-assisted pipeline from concept to deployment
          </p>
        </div>
      </div>

      {/* Vertical Workflow */}
      <div className="space-y-3">
        {STAGES.map((stage, i) => (
          <div key={stage.id} className="relative">
            <Link href={stage.path}>
              <Card className="group cursor-pointer border-border/50 hover:border-primary/50 hover:shadow-md transition-all">
                <CardContent className="p-5 flex items-center gap-5">
                  {/* Step Number */}
                  <div className="shrink-0">
                    <div className="size-14 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <span className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                        {stage.number}
                      </span>
                    </div>
                  </div>

                  {/* Arrow connector */}
                  {i < STAGES.length - 1 && (
                    <div className="hidden sm:flex absolute left-[4.1rem] top-[5.5rem] -translate-x-1/2 flex-col items-center">
                      <ChevronRight className="size-4 text-muted-foreground -rotate-90" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                        {stage.label}
                      </h3>
                      <span className="text-xs text-muted-foreground font-medium">
                        {stage.desc}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {stage.detail}
                    </p>
                  </div>

                  {/* Arrow icon */}
                  <div className="shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
                    <ArrowRight className="size-5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        ))}
      </div>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="size-5 text-primary" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-foreground/80 leading-relaxed">
          <p>
            Neural Workspace provides a complete AI-powered development environment. Each stage of
            your workflow is supported by specialized agents:
          </p>
          <ul className="space-y-3 pl-4">
            <li className="flex gap-3">
              <span className="shrink-0 size-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">1</span>
              <div>
                <strong>Planning Agent:</strong> Helps you define requirements, break down features,
                and organize tasks.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 size-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">2</span>
              <div>
                <strong>Architecture Agent:</strong> Generates system designs, database schemas, API
                specifications, and tech recommendations.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 size-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">3</span>
              <div>
                <strong>Coding Agent:</strong> Assists with implementation, code reviews, and
                debugging.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 size-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">4</span>
              <div>
                <strong>Testing Agent:</strong> Helps write tests, identify edge cases, and verify
                functionality.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 size-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">5</span>
              <div>
                <strong>Documentation Agent:</strong> Generates READMEs, API docs, developer guides,
                and deployment instructions.
              </div>
            </li>
          </ul>
          <p className="pt-2">
            Use <strong>Workspace Memory</strong> to give agents persistent context about your
            project, team conventions, and architectural decisions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

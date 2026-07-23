import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Workflow, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const STAGES = [
  { id: "idea", label: "Idea", desc: "Conceptualize and scope", path: "/planner", color: "text-purple-500", bg: "bg-purple-500/10" },
  { id: "plan", label: "Planning", desc: "Define requirements", path: "/planner", color: "text-green-500", bg: "bg-green-500/10" },
  { id: "arch", label: "Architecture", desc: "Design the system", path: "/architecture", color: "text-purple-500", bg: "bg-purple-500/10" },
  { id: "code", label: "Coding", desc: "Implement features", path: "/assistant", color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "test", label: "Testing", desc: "Verify & QA", path: "/workspace", color: "text-cyan-500", bg: "bg-cyan-500/10" },
  { id: "docs", label: "Documentation", desc: "Write guides", path: "/docs-studio", color: "text-amber-500", bg: "bg-amber-500/10" },
  { id: "deploy", label: "Deployment", desc: "Ship to production", path: "/planner", color: "text-red-500", bg: "bg-red-500/10" },
];

export default function WorkflowPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-3">
          <Workflow className="size-8 text-primary" />
          Development Workflow
        </h1>
        <p className="text-muted-foreground">Your AI-assisted software development pipeline from concept to deployment.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 items-stretch justify-center">
        {STAGES.map((stage, i) => (
          <div key={stage.id} className="flex items-center gap-3 flex-1">
            <Link href={stage.path} className="flex-1">
              <Card className="bg-card/50 backdrop-blur hover:border-primary/50 transition-all hover:scale-105 h-full cursor-pointer">
                <CardHeader className="pb-3">
                  <div className={`inline-flex size-10 items-center justify-center rounded-lg ${stage.bg} mb-2`}>
                    <span className={`text-lg font-bold ${stage.color}`}>{i + 1}</span>
                  </div>
                  <CardTitle className="text-lg">{stage.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{stage.desc}</p>
                </CardContent>
              </Card>
            </Link>
            {i < STAGES.length - 1 && (
              <ArrowRight className="size-5 text-muted-foreground hidden lg:block" />
            )}
          </div>
        ))}
      </div>

      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-foreground/80 leading-relaxed">
          <p>Neural Workspace provides a complete AI-powered development environment. Each stage of your workflow is supported by specialized agents:</p>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li><strong>Planning Agent:</strong> Helps you define requirements, break down features, and organize tasks.</li>
            <li><strong>Architecture Agent:</strong> Generates system designs, database schemas, API specifications, and tech recommendations.</li>
            <li><strong>Coding Agent:</strong> Assists with implementation, code reviews, and debugging.</li>
            <li><strong>Testing Agent:</strong> Helps write tests, identify edge cases, and verify functionality.</li>
            <li><strong>Documentation Agent:</strong> Generates READMEs, API docs, developer guides, and deployment instructions.</li>
          </ul>
          <p className="pt-2">Use <strong>Workspace Memory</strong> to give agents persistent context about your project, team conventions, and architectural decisions.</p>
        </CardContent>
      </Card>
    </div>
  );
}

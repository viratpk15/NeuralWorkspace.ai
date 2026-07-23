import { useState } from "react";
import { 
  useListDocumentation, 
  useGenerateDocumentation, 
  getListDocumentationQueryKey,
  DocumentationGenerateInputDocType,
  DocumentationItem
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Wand2, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const DOC_TYPES = [
  { id: "readme", label: "README" },
  { id: "api_docs", label: "API Documentation" },
  { id: "architecture", label: "Architecture Overview" },
  { id: "developer_guide", label: "Developer Guide" },
  { id: "deployment", label: "Deployment Guide" },
  { id: "setup", label: "Setup Instructions" },
];

export default function DocsStudio() {
  const { data: docs, isLoading } = useListDocumentation();
  const generateDoc = useGenerateDocumentation();
  const queryClient = useQueryClient();

  const [prompt, setPrompt] = useState("");
  const [docType, setDocType] = useState<DocumentationGenerateInputDocType>("readme");
  const [projectName, setProjectName] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<DocumentationItem | null>(null);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    
    generateDoc.mutate(
      { data: { prompt, docType, projectName: projectName || "New Project" } },
      {
        onSuccess: (newDoc) => {
          queryClient.invalidateQueries({ queryKey: getListDocumentationQueryKey() });
          setSelectedDoc(newDoc);
          setPrompt("");
          toast.success("Documentation generated!");
        },
        onError: () => {
          toast.error("Failed to generate documentation.");
        }
      }
    );
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  };

  const downloadMarkdown = (doc: DocumentationItem) => {
    const blob = new Blob([doc.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title.replace(/\s+/g, '-').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 h-[calc(100vh-6rem)] flex flex-col">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-3">
          <BookOpen className="size-8 text-amber-500" />
          Documentation Studio
        </h1>
        <p className="text-muted-foreground">Generate project documentation with AI.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <Card className="col-span-1 flex flex-col bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Generator</CardTitle>
            <CardDescription>Describe your project to generate docs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 flex flex-col min-h-0 overflow-y-auto">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project Name</label>
              <Input placeholder="E.g. Task Manager API" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Document Type</label>
              <Select value={docType} onValueChange={(v: any) => setDocType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 flex-1 flex flex-col min-h-0">
              <label className="text-sm font-medium">Project Details</label>
              <Textarea placeholder="Describe features, tech stack, setup steps..." className="flex-1 min-h-[150px] resize-none" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
            </div>

            <Button className="w-full" onClick={handleGenerate} disabled={!prompt.trim() || generateDoc.isPending}>
              {generateDoc.isPending ? (
                <span className="flex items-center gap-2"><Wand2 className="size-4 animate-spin" /> Generating...</span>
              ) : (
                <span className="flex items-center gap-2"><Wand2 className="size-4" /> Generate Documentation</span>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-2 flex flex-col bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Document Viewer</CardTitle>
              <CardDescription>{selectedDoc ? selectedDoc.title : "Select or generate a document"}</CardDescription>
            </div>
            {selectedDoc && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(selectedDoc.content)}>
                  <Copy className="size-4 mr-2" /> Copy
                </Button>
                <Button variant="outline" size="sm" onClick={() => downloadMarkdown(selectedDoc)}>
                  <Download className="size-4 mr-2" /> Download
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="flex-1 flex gap-4 min-h-0 p-4 pt-0">
            <div className="w-1/3 border-r border-border/50 pr-4 flex flex-col">
              <h3 className="text-sm font-medium mb-3 text-muted-foreground">Saved Documents</h3>
              <div className="space-y-2 overflow-y-auto flex-1 pr-2">
                {isLoading ? (
                  <Skeleton className="h-16 w-full" />
                ) : docs?.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No documents saved.</p>
                ) : (
                  docs?.map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedDoc?.id === doc.id ? "bg-primary/10 border-primary/30" : "bg-background/50 border-border hover:bg-muted"
                      }`}
                    >
                      <div className="font-medium text-sm truncate">{doc.title}</div>
                      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                        <span className="capitalize">{doc.docType.replace('_', ' ')}</span>
                        <span>{format(new Date(doc.createdAt), "MMM d")}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="w-2/3 pl-2 overflow-y-auto">
              {selectedDoc ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {selectedDoc.content.split('\n\n').map((para, i) => {
                    if (para.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold">{para.slice(2)}</h1>;
                    if (para.startsWith('## ')) return <h2 key={i} className="text-xl font-semibold mt-6 mb-3">{para.slice(3)}</h2>;
                    if (para.startsWith('### ')) return <h3 key={i} className="text-lg font-medium mt-4 mb-2">{para.slice(4)}</h3>;
                    if (para.startsWith('```')) {
                      const lines = para.split('\n');
                      const code = lines.slice(1, -1).join('\n');
                      return (
                        <pre key={i} className="bg-zinc-950 p-4 rounded-lg overflow-x-auto my-4 border border-zinc-800">
                          <code className="text-zinc-50 font-mono text-sm">{code}</code>
                        </pre>
                      );
                    }
                    return <p key={i} className="my-2 leading-relaxed">{para}</p>;
                  })}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                  <BookOpen className="size-16 mb-4" />
                  <p>Generate or select a documentation file</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  useListDocumentation,
  getListDocumentationQueryKey,
  DocumentationGenerateInputDocType,
  DocumentationItem,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { BookOpen, Wand2, Copy, Download, FileText, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  startGlobalStream,
  useGlobalSSEStream,
  abortGlobalStream,
  reconnectActiveJobs,
} from "@/hooks/use-sse-stream";
import { useBackgroundJobs } from "@/contexts/background-jobs-context";
import { Spinner } from "@/components/ui/spinner";
import { MarkdownViewer } from "@/components/markdown-viewer";
import { JobStatusBadge } from "@/components/job-status-badge";
import { DocumentListSkeleton, MarkdownSkeleton } from "@/components/loading-skeleton";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";

const DOC_TYPES = [
  { id: "readme", label: "README", icon: FileText },
  { id: "api_docs", label: "API Documentation", icon: BookOpen },
  { id: "architecture", label: "Architecture Overview", icon: BookOpen },
  { id: "developer_guide", label: "Developer Guide", icon: BookOpen },
  { id: "deployment", label: "Deployment Guide", icon: BookOpen },
  { id: "setup", label: "Setup Instructions", icon: BookOpen },
] as const;

export default function DocsStudio() {
  const queryClient = useQueryClient();
  const { addJob, jobs, updateJob } = useBackgroundJobs();

  const { data: docs, isLoading } = useListDocumentation({
    query: {
      queryKey: getListDocumentationQueryKey(),
      refetchInterval: false,
      refetchOnWindowFocus: false,
    },
  });

  const [prompt, setPrompt] = useState("");
  const [docType, setDocType] = useState<DocumentationGenerateInputDocType>("readme");
  const [projectName, setProjectName] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<DocumentationItem | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  // Reconnect active jobs on mount
  useEffect(() => {
    reconnectActiveJobs();
  }, []);

  // Subscribe to the global stream state for the active job
  const globalStream = useGlobalSSEStream(activeJobId);

  // Find the active documentation job from context
  const activeJob = useMemo(
    () =>
      jobs.find(
        (j) => j.type === "documentation" && (j.status === "queued" || j.status === "generating"),
      ),
    [jobs],
  );

  // On mount, check if there's already an active job and reconnect
  useEffect(() => {
    if (activeJob && !activeJobId) {
      setActiveJobId(activeJob.id);
    }
  }, [activeJob, activeJobId]);

  // Update job progress as content streams in
  useEffect(() => {
    if (activeJobId && globalStream.streamedContent) {
      const progress = Math.min(
        95,
        Math.round((globalStream.streamedContent.length / 8000) * 100),
      );
      updateJob(activeJobId, { progress });
    }
  }, [activeJobId, globalStream.streamedContent, updateJob]);

  // When global stream completes with a result, show the document
  useEffect(() => {
    if (globalStream.result) {
      const response = globalStream.result as { document?: DocumentationItem };
      if (response?.document) {
        setSelectedDoc(response.document);
        queryClient.invalidateQueries({ queryKey: getListDocumentationQueryKey() });
        toast.success(`"${response.document.title}" generated successfully!`);
      }
    }
  }, [globalStream.result, queryClient]);

  // Restore selected doc from completed jobs on mount
  useEffect(() => {
    if (selectedDoc) return;
    const completedJob = jobs.find(
      (j) => j.type === "documentation" && j.status === "completed" && j.result,
    );
    if (completedJob) {
      const result = completedJob.result as { document?: DocumentationItem };
      if (result?.document) {
        setSelectedDoc(result.document);
      }
    }
  }, [jobs, selectedDoc]);

  const isGenerating = globalStream.isStreaming || !!activeJob;

  const handleGenerate = useCallback(() => {
    if (!prompt.trim() || isGenerating) return;

    const body = {
      prompt,
      docType,
      projectName: projectName || "New Project",
    };

    // Create a background job immediately
    const job = addJob({
      type: "documentation",
      title: `${DOC_TYPES.find((t) => t.id === docType)?.label || "Documentation"} - ${projectName || "New Project"}`,
      prompt,
      status: "queued",
      streamUrl: "/api/documentation/generate/stream",
      streamBody: body,
    });

    // Start the global SSE stream (persists across navigations)
    startGlobalStream({
      url: "/api/documentation/generate/stream",
      body,
      jobId: job.id,
      onError: (error: string) => {
        toast.error("Generation failed", { description: error });
      },
    });

    setActiveJobId(job.id);

    // Reset the form immediately
    setPrompt("");
    setProjectName("");
    setDocType("readme");
  }, [prompt, docType, projectName, isGenerating, addJob]);

  const handleCancel = useCallback(() => {
    if (activeJobId) {
      abortGlobalStream(activeJobId);
      updateJob(activeJobId, { status: "failed", progress: 0, error: "Cancelled by user" });
      setActiveJobId(null);
      toast.info("Generation cancelled");
    }
  }, [activeJobId, updateJob]);

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  };

  const downloadMarkdown = (doc: DocumentationItem) => {
    const blob = new Blob([doc.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.title.replace(/\s+/g, "-").toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const streamedDoc = globalStream.streamedContent;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-3">
            <BookOpen className="size-8 text-foreground" />
            Documentation Studio
          </h1>
          <p className="text-muted-foreground">Generate project documentation with AI.</p>
        </div>
        {isGenerating && (
          <Button variant="destructive" size="sm" onClick={handleCancel}>
            <XCircle className="size-4 mr-2" /> Cancel
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Generator Panel */}
        <Card className="col-span-1 flex flex-col bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Generator</CardTitle>
            <CardDescription>Describe your project to generate docs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 flex flex-col min-h-0 overflow-y-auto">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project Name</label>
              <Input
                placeholder="E.g. Task Manager API"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Document Type</label>
              <Select
                value={docType}
                onValueChange={(v: DocumentationGenerateInputDocType) => setDocType(v)}
                disabled={isGenerating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 flex-1 flex flex-col min-h-0">
              <label className="text-sm font-medium">Project Details</label>
              <Textarea
                placeholder="Describe features, tech stack, setup steps..."
                className="flex-1 min-h-[150px] resize-none"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <Spinner className="size-4" />
                  {activeJob?.status === "queued" ? "Queued..." : "Generating..."}
                </span>
              ) : globalStream.error ? (
                <span className="flex items-center gap-2">
                  <Wand2 className="size-4" />
                  Retry
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Wand2 className="size-4" />
                  Generate Documentation
                </span>
              )}
            </Button>

            {/* Progress Section */}
            {isGenerating && activeJob && (
              <div className="space-y-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium truncate">
                    {activeJob.title}
                  </span>
                  <JobStatusBadge status={activeJob.status} showIcon={false} />
                </div>
                {streamedDoc && (
                  <p className="text-xs text-muted-foreground truncate">
                    Generated {streamedDoc.length} characters...
                  </p>
                )}
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300 rounded-full"
                    style={{
                      width: `${
                        activeJob.status === "queued"
                          ? 5
                          : activeJob.progress || Math.min(95, Math.round((streamedDoc.length / 8000) * 100))
                      }%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="capitalize">{docType.replace(/_/g, " ")}</span>
                  <span>
                    {activeJob.status === "queued"
                      ? "Waiting..."
                      : `${activeJob.progress || Math.min(95, Math.round((streamedDoc.length / 8000) * 100))}%`}
                  </span>
                </div>
              </div>
            )}
            {isGenerating && !activeJob && (
              <p className="text-xs text-muted-foreground text-center animate-pulse">
                Generating documentation... This may take a moment.
              </p>
            )}
            {globalStream.error && (
              <div className="text-xs text-destructive text-center p-2 rounded-md bg-destructive/10">
                {globalStream.error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Document Viewer */}
        <Card className="col-span-1 lg:col-span-2 flex flex-col bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Document Viewer</CardTitle>
              <CardDescription>
                {selectedDoc
                  ? selectedDoc.title
                  : isGenerating
                    ? "Generating document..."
                    : "Select or generate a document to view"}
              </CardDescription>
            </div>
            {selectedDoc && !isGenerating && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(selectedDoc.content)}
                >
                  <Copy className="size-4 mr-2" /> Copy
                </Button>
                <Button variant="outline" size="sm" onClick={() => downloadMarkdown(selectedDoc)}>
                  <Download className="size-4 mr-2" /> Download
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="flex-1 flex gap-4 min-h-0 p-4 pt-0">
            {/* History Sidebar */}
            <div className="w-1/3 border-r border-border/50 pr-4 flex flex-col">
              <h3 className="text-sm font-medium mb-3 text-muted-foreground flex items-center gap-2">
                <FileText className="size-3.5" />
                Saved Documents
                {docs && docs.length > 0 && (
                  <span className="text-xs text-muted-foreground/60">({docs.length})</span>
                )}
              </h3>
              <div className="space-y-2 overflow-y-auto flex-1 pr-2">
                {/* Active generating job indicator */}
                {isGenerating && activeJob && (
                  <div className="w-full text-left p-3 rounded-lg border border-dashed border-amber-500/50 bg-amber-500/5 animate-pulse">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm truncate text-amber-500">
                        {activeJob.title}
                      </span>
                      <Spinner className="size-3.5 shrink-0" />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span className="truncate">{activeJob.prompt.substring(0, 25)}...</span>
                      <span className="shrink-0">
                        {streamedDoc ? `${streamedDoc.length} chars` : "Generating..."}
                      </span>
                    </div>
                  </div>
                )}
                {isLoading ? (
                  <DocumentListSkeleton count={5} />
                ) : docs?.length === 0 && !isGenerating ? (
                  <EmptyState
                    icon={BookOpen}
                    title="No documents yet"
                    description="Generate your first documentation file to see it here."
                  />
                ) : (
                  docs?.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border transition-all duration-150",
                        selectedDoc?.id === doc.id
                          ? "bg-primary/10 border-primary/30 shadow-sm"
                          : "bg-background/50 border-border hover:bg-muted hover:border-muted-foreground/20",
                      )}
                    >
                      <div className="font-medium text-sm truncate">{doc.title}</div>
                      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                        <span className="capitalize">{doc.docType.replace(/_/g, " ")}</span>
                        <span>{format(new Date(doc.createdAt), "MMM d, yyyy")}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Markdown Viewer */}
            <div className="w-2/3 pl-2 flex flex-col min-h-0">
              {(isGenerating || globalStream.streamedContent) && (
                <div className="flex-1 flex flex-col min-h-0">
                  {streamedDoc ? (
                    <>
                      <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1 text-amber-500">
                          <Spinner className="size-3" />
                          Generating...
                        </span>
                        <span className="text-muted-foreground/50">|</span>
                        <span>{streamedDoc.length} characters</span>
                        <span className="text-muted-foreground/50">|</span>
                        <span>
                          {Math.min(95, Math.round((streamedDoc.length / 8000) * 100))}% complete
                        </span>
                      </div>
                      <div className="flex-1 overflow-y-auto rounded-lg border border-amber-500/20 bg-background/50 p-4">
                        <MarkdownViewer content={streamedDoc} />
                      </div>
                    </>
                  ) : (
                    <MarkdownSkeleton lines={15} />
                  )}
                </div>
              )}
              {!isGenerating && selectedDoc && (
                <MarkdownViewer content={selectedDoc.content} className="flex-1 overflow-y-auto" />
              )}
              {!isGenerating && !selectedDoc && (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                  <BookOpen className="size-16 mb-4" />
                  <p className="text-lg font-medium mb-1">No document selected</p>
                  <p className="text-sm">Generate or select a documentation file</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


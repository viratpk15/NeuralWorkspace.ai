import { useState, useRef, useCallback, useEffect } from "react";

export type JobType = "architecture" | "documentation" | "conversation";
export type JobStatus = "queued" | "generating" | "completed" | "failed";

export interface BackgroundJob {
  id: string;
  type: JobType;
  title: string;
  prompt: string;
  status: JobStatus;
  progress: number;
  result: unknown | null;
  error: string | null;
  createdAt: number;
  updatedAt: number;
  streamUrl?: string;
  streamBody?: Record<string, unknown>;
}

export interface SSEStreamOptions {
  url: string;
  body: Record<string, unknown>;
  onChunk?: (chunk: string) => void;
  onDone?: (data: Record<string, unknown>) => void;
  onError?: (error: string) => void;
  onComplete?: (data: Record<string, unknown>) => void;
  jobId?: string;
}

const STORAGE_KEY = "neural-workspace:background-jobs";
const MAX_RECONNECT_ATTEMPTS = 3;

// ─── Background Job Persistence ──────────────────────────────────

export function loadJobs(): BackgroundJob[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveJobs(jobs: BackgroundJob[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  } catch {
    // localStorage quota exceeded
  }
}

export function persistJob(job: BackgroundJob): void {
  const jobs = loadJobs();
  const idx = jobs.findIndex((j) => j.id === job.id);
  if (idx >= 0) jobs[idx] = job;
  else jobs.unshift(job);
  saveJobs(jobs);
}

export function updateJob(id: string, updates: Partial<BackgroundJob>): BackgroundJob | null {
  const jobs = loadJobs();
  const idx = jobs.findIndex((j) => j.id === id);
  if (idx < 0) return null;
  const updated = { ...jobs[idx], ...updates, updatedAt: Date.now() };
  jobs[idx] = updated;
  saveJobs(jobs);
  return updated;
}

export function removeJob(id: string): void {
  saveJobs(loadJobs().filter((j) => j.id !== id));
}

export function getActiveJobs(): BackgroundJob[] {
  return loadJobs().filter((j) => j.status === "queued" || j.status === "generating");
}

export function getJob(id: string): BackgroundJob | null {
  return loadJobs().find((j) => j.id === id) ?? null;
}

export function getAllJobs(): BackgroundJob[] {
  return loadJobs();
}

export function clearCompletedJobs(): void {
  saveJobs(loadJobs().filter((j) => j.status !== "completed" && j.status !== "failed"));
}

// ─── Global SSE Stream Manager ───────────────────────────────────
// Streams are managed at module level so they survive component unmounts.

interface ActiveStream {
  controller: AbortController;
  accumulatedContent: string;
  options: SSEStreamOptions;
}

const activeStreams = new Map<string, ActiveStream>();
const streamCallbacks = new Map<string, Set<{
  onChunk?: (chunk: string) => void;
  onDone?: (data: Record<string, unknown>) => void;
  onError?: (error: string) => void;
  onComplete?: (data: Record<string, unknown>) => void;
  onStatusChange?: (isStreaming: boolean, content: string, error: string | null) => void;
}>>();

const streamedContents = new Map<string, string>();
const streamErrors = new Map<string, string | null>();
const streamingStates = new Map<string, boolean>();

const STREAM_EVENT = "neural-workspace:stream-update";

function notifyStreamUpdate() {
  window.dispatchEvent(new Event(STREAM_EVENT));
}

function runStreamCallbacks(jobId: string) {
  const callbacks = streamCallbacks.get(jobId);
  if (!callbacks) return;
  const content = streamedContents.get(jobId) ?? "";
  const error = streamErrors.get(jobId) ?? null;
  const isStreaming = streamingStates.get(jobId) ?? false;
  for (const cb of callbacks) {
    cb.onStatusChange?.(isStreaming, content, error);
  }
}

export function subscribeToStream(
  jobId: string,
  callbacks: {
    onChunk?: (chunk: string) => void;
    onDone?: (data: Record<string, unknown>) => void;
    onError?: (error: string) => void;
    onComplete?: (data: Record<string, unknown>) => void;
    onStatusChange?: (isStreaming: boolean, content: string, error: string | null) => void;
  },
): () => void {
  if (!streamCallbacks.has(jobId)) {
    streamCallbacks.set(jobId, new Set());
  }
  streamCallbacks.get(jobId)!.add(callbacks);
  return () => {
    streamCallbacks.get(jobId)?.delete(callbacks);
  };
}

export function getStreamState(jobId: string): {
  isStreaming: boolean;
  streamedContent: string;
  error: string | null;
} {
  return {
    isStreaming: streamingStates.get(jobId) ?? false,
    streamedContent: streamedContents.get(jobId) ?? "",
    error: streamErrors.get(jobId) ?? null,
  };
}

async function attemptStream(jobId: string, url: string, body: Record<string, unknown>, attempt: number) {
  // Apply API base URL if configured (for production deployments)
  const { getBaseUrl } = await import("@workspace/api-client-react");
  const baseUrl = getBaseUrl();
  const fullUrl = baseUrl && url.startsWith("/") ? `${baseUrl}${url}` : url;
  const active = activeStreams.get(jobId);
  if (!active) return;

  streamingStates.set(jobId, true);
  notifyStreamUpdate();
  updateJob(jobId, { status: "generating", progress: Math.min(10, Math.round((active.accumulatedContent.length / 8000) * 100)) });

  try {
    const response = await fetch(fullUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: active.controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Request failed");
      const errorMsg = `HTTP ${response.status}: ${errorText}`;

      if (attempt < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
        setTimeout(() => attemptStream(jobId, fullUrl, body, attempt + 1), delay);
        return;
      }

      streamingStates.set(jobId, false);
      streamErrors.set(jobId, errorMsg);
      notifyStreamUpdate();
      updateJob(jobId, { status: "failed", progress: 0, error: errorMsg });
      activeStreams.delete(jobId);
      streamCallbacks.get(jobId)?.forEach((cb) => cb.onError?.(errorMsg));
      return;
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n").filter(Boolean)) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));

            if (data.code) {
              const errorMsg = data.message || "Stream error";
              streamingStates.set(jobId, false);
              streamErrors.set(jobId, errorMsg);
              notifyStreamUpdate();
              updateJob(jobId, { status: "failed", progress: 0, error: errorMsg });
              activeStreams.delete(jobId);
              streamCallbacks.get(jobId)?.forEach((cb) => cb.onError?.(errorMsg));
              return;
            }

            if (data.content) {
              active.accumulatedContent += data.content;
              streamedContents.set(jobId, active.accumulatedContent);
              const progress = Math.min(95, Math.round((active.accumulatedContent.length / 8000) * 100));
              updateJob(jobId, { progress });
              notifyStreamUpdate();
              runStreamCallbacks(jobId);
              active.options.onChunk?.(data.content);
            }

            if (data.done) {
              const finalData = { ...data };
              delete finalData.done;
              streamingStates.set(jobId, false);
              streamErrors.set(jobId, null);
              notifyStreamUpdate();
              updateJob(jobId, { status: "completed", progress: 100, result: finalData });
              activeStreams.delete(jobId);
              streamCallbacks.get(jobId)?.forEach((cb) => {
                cb.onComplete?.(finalData);
                cb.onDone?.(finalData);
              });
              return;
            }
          } catch (e) {
            console.error("Failed to parse SSE chunk", e, line);
          }
        }
      }
    }

    // Stream ended without done event
    streamingStates.set(jobId, false);
    streamErrors.set(jobId, null);
    notifyStreamUpdate();
    updateJob(jobId, { status: "completed", progress: 100, result: { content: active.accumulatedContent } });
    activeStreams.delete(jobId);
    streamCallbacks.get(jobId)?.forEach((cb) => cb.onComplete?.({ content: active.accumulatedContent }));
  } catch (err) {
    if ((err as Error)?.name === "AbortError") {
      streamingStates.set(jobId, false);
      notifyStreamUpdate();
      activeStreams.delete(jobId);
      return;
    }

    const message = err instanceof Error ? err.message : "Stream failed";

    if (attempt < MAX_RECONNECT_ATTEMPTS) {
      const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
      setTimeout(() => attemptStream(jobId, fullUrl, body, attempt + 1), delay);
      return;
    }

    streamingStates.set(jobId, false);
    streamErrors.set(jobId, message);
    notifyStreamUpdate();
    updateJob(jobId, { status: "failed", progress: 0, error: message });
    activeStreams.delete(jobId);
    streamCallbacks.get(jobId)?.forEach((cb) => cb.onError?.(message));
  }
}

/**
 * Start a global SSE stream that persists across page navigations.
 * The job is tracked in localStorage and reconnected on page load.
 */
export function startGlobalStream(options: SSEStreamOptions): string {
  const { url, body, jobId } = options;
  const id = jobId ?? crypto.randomUUID();

  // Abort any existing stream for this job
  const existing = activeStreams.get(id);
  if (existing) {
    existing.controller.abort();
  }

  const controller = new AbortController();
  activeStreams.set(id, {
    controller,
    accumulatedContent: "",
    options,
  });

  streamedContents.set(id, "");
  streamErrors.set(id, null);
  streamingStates.set(id, true);

  attemptStream(id, url, body, 0);
  return id;
}

/**
 * Abort a global SSE stream.
 */
export function abortGlobalStream(jobId: string): void {
  const active = activeStreams.get(jobId);
  if (active) {
    active.controller.abort();
    activeStreams.delete(jobId);
  }
  streamingStates.set(jobId, false);
  notifyStreamUpdate();
}

/**
 * Reconnect all active jobs from localStorage on app startup.
 * Called once when the app mounts.
 */
export function reconnectActiveJobs(): void {
  const activeJobs = getActiveJobs();
  for (const job of activeJobs) {
    if (job.streamUrl && job.streamBody && !activeStreams.has(job.id)) {
      startGlobalStream({
        url: job.streamUrl,
        body: job.streamBody,
        jobId: job.id,
      });
    }
  }
}

/**
 * Use a global SSE stream from any component.
 * Automatically subscribes/unsubscribes on mount/unmount.
 * The stream itself persists globally even when the component unmounts.
 */
export function useGlobalSSEStream(jobId: string | null) {
  const [state, setState] = useState({
    isStreaming: false,
    streamedContent: "",
    error: null as string | null,
    result: null as Record<string, unknown> | null,
  });

  useEffect(() => {
    if (!jobId) {
      setState({ isStreaming: false, streamedContent: "", error: null, result: null });
      return;
    }

    const initial = getStreamState(jobId);
    setState({
      isStreaming: initial.isStreaming,
      streamedContent: initial.streamedContent,
      error: initial.error,
      result: null,
    });

    const unsubscribe = subscribeToStream(jobId, {
      onStatusChange: (isStreaming, content, error) => {
        setState({ isStreaming, streamedContent: content, error, result: null });
      },
      onDone: (data) => {
        setState((prev) => ({ ...prev, result: data }));
      },
    });

    const handler = () => {
      const s = getStreamState(jobId);
      setState({
        isStreaming: s.isStreaming,
        streamedContent: s.streamedContent,
        error: s.error,
        result: null,
      });
    };

    window.addEventListener(STREAM_EVENT, handler);
    return () => {
      unsubscribe();
      window.removeEventListener(STREAM_EVENT, handler);
    };
  }, [jobId]);

  return state;
}

// ─── Local SSE Stream Hook (for conversation streams) ────────────

export function useSSEStream() {
  const [state, setState] = useState({
    isStreaming: false,
    streamedContent: "",
    error: null as string | null,
    result: null as Record<string, unknown> | null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(async (options: SSEStreamOptions) => {
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setState({ isStreaming: true, streamedContent: "", error: null, result: null });

    try {
      // Apply API base URL if configured (for production deployments)
      const { getBaseUrl } = await import("@workspace/api-client-react");
      const baseUrl = getBaseUrl();
      const fullUrl = baseUrl && options.url.startsWith("/") ? `${baseUrl}${options.url}` : options.url;

      const response = await fetch(fullUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options.body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Request failed");
        const msg = `HTTP ${response.status}: ${errorText}`;
        setState({ isStreaming: false, streamedContent: "", error: msg, result: null });
        options.onError?.(msg);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let content = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n").filter(Boolean)) {
            if (!line.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                content += data.content;
                setState((prev) => ({ ...prev, streamedContent: content }));
                options.onChunk?.(data.content);
              }
              if (data.done) {
                const finalData = { ...data };
                delete finalData.done;
                setState({ isStreaming: false, streamedContent: content, error: null, result: Object.keys(finalData).length > 0 ? finalData : null });
                options.onComplete?.(finalData);
                options.onDone?.(finalData);
                return;
              }
            } catch (e) {
              console.error("Failed to parse SSE", e, line);
            }
          }
        }
      }

      setState({ isStreaming: false, streamedContent: content, error: null, result: null });
      options.onComplete?.({ content });
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Stream failed";
      setState({ isStreaming: false, streamedContent: "", error: msg, result: null });
      options.onError?.(msg);
    }
  }, []);

  const abort = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setState({ isStreaming: false, streamedContent: "", error: null, result: null });
  }, []);

  return { ...state, start, abort, reset: abort };
}

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import {
  BackgroundJob,
  getAllJobs,
  removeJob,
  clearCompletedJobs,
  persistJob,
  updateJob,
} from "@/hooks/use-sse-stream";

interface BackgroundJobsContextValue {
  jobs: BackgroundJob[];
  activeJobs: BackgroundJob[];
  addJob: (job: Partial<Omit<BackgroundJob, "id" | "createdAt" | "updatedAt">> & Partial<Pick<BackgroundJob, "id" | "createdAt" | "updatedAt">>) => BackgroundJob;
  updateJob: (id: string, updates: Partial<BackgroundJob>) => void;
  removeJob: (id: string) => void;
  clearCompleted: () => void;
  refreshJobs: () => void;
}

const BackgroundJobsContext = createContext<BackgroundJobsContextValue | undefined>(undefined);

const STORAGE_EVENT = "neural-workspace:jobs-changed";

function dispatchStorageEvent() {
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

export function BackgroundJobsProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<BackgroundJob[]>(() => getAllJobs());

  const refreshJobs = useCallback(() => {
    setJobs(getAllJobs());
  }, []);

  // Listen for storage changes (from other tabs or direct localStorage writes)
  useEffect(() => {
    const handler = () => refreshJobs();
    window.addEventListener(STORAGE_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(STORAGE_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, [refreshJobs]);

  const addJob = useCallback(
    (jobData: Omit<BackgroundJob, "id" | "createdAt" | "updatedAt"> & Partial<Pick<BackgroundJob, "id" | "createdAt" | "updatedAt">>): BackgroundJob => {
      const now = Date.now();
      const job: BackgroundJob = {
        id: jobData.id ?? crypto.randomUUID(),
        type: jobData.type,
        title: jobData.title,
        prompt: jobData.prompt,
        status: jobData.status ?? "queued",
        progress: jobData.progress ?? 0,
        result: jobData.result ?? null,
        error: jobData.error ?? null,
        createdAt: jobData.createdAt ?? now,
        updatedAt: now,
        streamUrl: jobData.streamUrl,
        streamBody: jobData.streamBody,
      };
      persistJob(job);
      dispatchStorageEvent();
      setJobs((prev) => {
        const idx = prev.findIndex((j) => j.id === job.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = job;
          return copy;
        }
        return [job, ...prev];
      });
      return job;
    },
    [],
  );

  const updateJobState = useCallback(
    (id: string, updates: Partial<BackgroundJob>) => {
      updateJob(id, updates);
      dispatchStorageEvent();
      setJobs((prev) =>
        prev.map((j) => (j.id === id ? { ...j, ...updates, updatedAt: Date.now() } : j)),
      );
    },
    [],
  );

  const removeJobState = useCallback((id: string) => {
    removeJob(id);
    dispatchStorageEvent();
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }, []);

  const clearCompletedState = useCallback(() => {
    clearCompletedJobs();
    dispatchStorageEvent();
    setJobs((prev) => prev.filter((j) => j.status !== "completed" && j.status !== "failed"));
  }, []);

  const activeJobs = jobs.filter((j) => j.status === "queued" || j.status === "generating");

  const value: BackgroundJobsContextValue = {
    jobs,
    activeJobs,
    addJob,
    updateJob: updateJobState,
    removeJob: removeJobState,
    clearCompleted: clearCompletedState,
    refreshJobs,
  };

  return (
    <BackgroundJobsContext.Provider value={value}>
      {children}
    </BackgroundJobsContext.Provider>
  );
}

export function useBackgroundJobs() {
  const ctx = useContext(BackgroundJobsContext);
  if (!ctx) {
    throw new Error("useBackgroundJobs must be used within a BackgroundJobsProvider");
  }
  return ctx;
}

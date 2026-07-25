/**
 * Shared SSE (Server-Sent Events) streaming utilities.
 *
 * Extracted from conversations.ts SSE streaming pattern for reuse
 * across routes (conversations, architecture, etc.).
 */

import type { Response } from "express";
import { LLMProviderError } from "./llm";

/**
 * Initialize an SSE response with the required headers.
 */
export function initSSEStream(res: Response): void {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
}

/**
 * Write a data chunk to the SSE stream.
 */
export function writeSSEChunk(res: Response, data: Record<string, unknown>): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * End the SSE stream with an optional final payload.
 */
export function endSSEStream(res: Response, finalData?: Record<string, unknown>): void {
  if (finalData) {
    res.write(`data: ${JSON.stringify({ done: true, ...finalData })}\n\n`);
  } else {
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  }
  res.end();
}

/**
 * Send an error event and end the SSE stream.
 */
export function errorSSEStream(res: Response, err: unknown): void {
  if (err instanceof LLMProviderError) {
    const statusMap: Record<string, number> = {
      PROVIDER_UNAVAILABLE: 503,
      QUOTA_EXCEEDED: 429,
      VALIDATION_ERROR: 400,
      UNEXPECTED_ERROR: 500,
    };
    const status = statusMap[err.code] ?? 500;
    res.status(status);
    res.write(
      `data: ${JSON.stringify({ code: err.code, provider: err.provider, message: err.message })}\n\n`,
    );
    res.end();
    return;
  }

  const message = err instanceof Error ? err.message : "Internal server error";
  res.status(500);
  res.write(
    `data: ${JSON.stringify({ code: "UNEXPECTED_ERROR", provider: "unknown", message })}\n\n`,
  );
  res.end();
}

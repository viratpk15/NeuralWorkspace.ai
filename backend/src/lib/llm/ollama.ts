/**
 * Ollama LLM Provider
 *
 * Communicates with a local Ollama server via its REST API.
 * Supports both non-streaming and streaming generation.
 *
 * API reference: https://github.com/ollama/ollama/blob/main/docs/api.md
 */

import type { GenerateOptions, LLMProvider } from "./types";
import { LLMProviderError } from "./types";

// Simple logger that only uses allowed console methods
const logger = {
  error: (obj: Record<string, unknown>, msg?: string) => {
    console.error(msg || "Ollama provider error", obj);
  },
  warn: (obj: Record<string, unknown>, msg?: string) => {
    console.warn(msg || "Ollama provider warning", obj);
  },
};

export class OllamaOfflineError extends LLMProviderError {
  constructor(message = "Local Ollama server is not running.") {
    super("PROVIDER_UNAVAILABLE", "ollama", message);
    this.name = "OllamaOfflineError";
  }
}

interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

interface OllamaStreamResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
}

export interface OllamaProviderConfig {
  baseUrl: string;
  model: string;
}

export class OllamaProvider implements LLMProvider {
  readonly name = "Ollama";
  readonly model: string;
  private readonly baseUrl: string;

  constructor(config: OllamaProviderConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.model = config.model;
  }

  /**
   * Check if the Ollama server is reachable.
   * Throws OllamaOfflineError if it is not.
   */
  private async checkHealth(): Promise<void> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) {
        throw new OllamaOfflineError(
          `Ollama server responded with status ${res.status}.`,
        );
      }
    } catch (err) {
      if (err instanceof OllamaOfflineError) throw err;
      throw new OllamaOfflineError();
    }
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    await this.checkHealth();

    const body: Record<string, unknown> = {
      model: this.model,
      prompt,
      stream: false,
    };

    if (options?.systemInstruction) {
      body.system = options.systemInstruction;
    }
    if (options?.temperature !== undefined) {
      body.temperature = options.temperature;
    }
    if (options?.maxOutputTokens !== undefined) {
      body.num_predict = options.maxOutputTokens;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const requestStart = Date.now();
    const url = `${this.baseUrl}/api/generate`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        let rawError = "";
        try {
          rawError = await res.text();
        } catch {
          rawError = "<failed to read error body>";
        }
        logger.error(
          {
            provider: this.name,
            model: this.model,
            url,
            status: res.status,
            rawError: rawError.slice(0, 300),
          },
          "Ollama provider generate response error body"
        );
        if (res.status === 400) {
          throw new LLMProviderError(
            "VALIDATION_ERROR",
            this.name,
            `Ollama rejected the request: ${res.statusText}`,
          );
        }
        throw new LLMProviderError(
          "PROVIDER_UNAVAILABLE",
          this.name,
          `Ollama server responded with status ${res.status}.`,
        );
      }

      const rawText = await res.text();
      const data = JSON.parse(rawText) as OllamaGenerateResponse;
      return data.response ?? "";
    } catch (err) {
      clearTimeout(timeout);
      if ((err as Error)?.name === "AbortError") {
        logger.warn(
          {
            provider: this.name,
            model: this.model,
            url,
            timeoutMs: 30000,
            requestMs: Date.now() - requestStart,
          },
          "Ollama provider generate aborted"
        );
      }
      throw err;
    }
  }

  async *stream(prompt: string, options?: GenerateOptions): AsyncIterable<string> {
    await this.checkHealth();

    const body: Record<string, unknown> = {
      model: this.model,
      prompt,
      stream: true,
    };

    if (options?.systemInstruction) {
      body.system = options.systemInstruction;
    }
    if (options?.temperature !== undefined) {
      body.temperature = options.temperature;
    }
    if (options?.maxOutputTokens !== undefined) {
      body.num_predict = options.maxOutputTokens;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      if (res.status === 400) {
        throw new LLMProviderError(
          "VALIDATION_ERROR",
          this.name,
          `Ollama rejected the request: ${res.statusText}`,
        );
      }
      throw new LLMProviderError(
        "PROVIDER_UNAVAILABLE",
        this.name,
        `Ollama server responded with status ${res.status}.`,
      );
    }

    if (!res.body) {
      throw new LLMProviderError(
        "PROVIDER_UNAVAILABLE",
        this.name,
        "Ollama returned an empty response body.",
      );
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(Boolean);

        for (const line of lines) {
          try {
            const data = JSON.parse(line) as OllamaStreamResponse;
            if (data.response) {
              yield data.response;
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
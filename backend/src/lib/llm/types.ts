/**
 * LLM Provider Abstraction Layer
 *
 * Defines a common interface for all LLM providers so that the application
 * code never depends on a specific vendor (Gemini, Ollama, OpenAI, etc.).
 * Each provider implements this interface and is selected at runtime via
 * configuration.
 */

export interface GenerateOptions {
  systemInstruction?: string;
  maxOutputTokens?: number;
  temperature?: number;
}

export interface LLMProvider {
  /**
   * Generate a single (non-streaming) completion.
   * Returns the full response text.
   */
  generate(prompt: string, options?: GenerateOptions): Promise<string>;

  /**
   * Generate a streaming completion.
   * Yields text chunks as they arrive.
   */
  stream(prompt: string, options?: GenerateOptions): AsyncIterable<string>;

  /**
   * Human-readable name of the provider (e.g. "Ollama", "Gemini").
   */
  readonly name: string;

  /**
    * The model identifier in use (e.g. "qwen2.5:3b").
   */
  readonly model: string;
}

/**
 * Error codes returned by LLM providers mapped to HTTP status codes:
 *   "PROVIDER_UNAVAILABLE" → 503
 *   "QUOTA_EXCEEDED"       → 429
 *   "VALIDATION_ERROR"     → 400
 *   "UNEXPECTED_ERROR"     → 500
 */
export type LLMErrorCode =
  | "PROVIDER_UNAVAILABLE"
  | "QUOTA_EXCEEDED"
  | "VALIDATION_ERROR"
  | "UNEXPECTED_ERROR";

/**
 * Structured error thrown by LLM providers.
 * Routes catch this error to return consistent JSON responses.
 */
export class LLMProviderError extends Error {
  public readonly code: LLMErrorCode;
  public readonly provider: string;

  constructor(code: LLMErrorCode, provider: string, message: string) {
    super(message);
    this.name = "LLMProviderError";
    this.code = code;
    this.provider = provider;
  }
}

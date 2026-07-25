/**
 * LLM Provider Factory
 *
 * Selects and instantiates the appropriate LLM provider based on configuration.
 * The default provider is Ollama for local development.
 *
 * To add a new provider (Groq, OpenAI, Anthropic, OpenRouter):
 * 1. Implement the LLMProvider interface
 * 2. Add the provider to the ProviderType union
 * 3. Add a case to the createLLMProvider function
 * 4. Add corresponding environment variables and configuration
 */

import type { LLMProvider } from "./types";
import { OllamaProvider } from "./ollama";
import { GeminiProvider } from "./gemini";

// Re-export types and errors
export type { LLMProvider, GenerateOptions, LLMErrorCode } from "./types";
export { LLMProviderError } from "./types";
export { OllamaOfflineError } from "./ollama";
export { getAgentSystemInstruction } from "./system-prompts";

// Provider configuration types
export type ProviderType = "ollama" | "gemini";

export interface ProviderConfig {
  ollamaBaseUrl?: string;
  ollamaModel?: string;
  geminiApiKey?: string;
  geminiModel?: string;
}

export interface ProviderOptions {
  provider: ProviderType;
  config?: ProviderConfig;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Required<Pick<ProviderConfig, "ollamaBaseUrl" | "ollamaModel" | "geminiModel">> = {
  ollamaBaseUrl: "http://localhost:11434",
  ollamaModel: "qwen2.5:3b",
  geminiModel: "gemini-2.5-flash",
};

/**
 * Validates that required configuration is present for the given provider
 */
function validateProviderConfig(provider: ProviderType, config: ProviderConfig): void {
  switch (provider) {
    case "gemini":
      if (!config.geminiApiKey) {
        throw new Error(
          `GEMINI_API_KEY must be set when using the ${provider} provider. ` +
          `Please set the environment variable or pass it in the configuration.`
        );
      }
      break;
    case "ollama":
      // Ollama has no required environment variables
      break;
    default:
      // Type-safe exhaustive check - this should never happen
      throw new Error(`Unknown LLM provider: ${provider}`);
  }
}

/**
 * Creates an LLM provider instance based on the specified provider type and configuration
 * 
 * @param provider - The provider type to instantiate
 * @param config - Configuration options for the provider
 * @returns An instance of the requested LLM provider
 * @throws {Error} If the provider is unknown or required configuration is missing
 * 
 * @example
 * ```typescript
 * // Using Ollama with default settings
 * const ollamaProvider = createLLMProvider("ollama");
 * 
 * // Using Gemini with custom configuration
 * const geminiProvider = createLLMProvider("gemini", {
 *   geminiApiKey: "your-api-key",
 *   geminiModel: "gemini-2.5-pro"
 * });
 * ```
 */
export function createLLMProvider(
  provider: ProviderType,
  config: ProviderConfig = {}
): LLMProvider {
  // Merge with defaults
  const mergedConfig: ProviderConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  // Validate configuration
  validateProviderConfig(provider, mergedConfig);

  // Instantiate the appropriate provider
  switch (provider) {
    case "ollama": {
      return new OllamaProvider({
        baseUrl: mergedConfig.ollamaBaseUrl ?? DEFAULT_CONFIG.ollamaBaseUrl,
        model: mergedConfig.ollamaModel ?? DEFAULT_CONFIG.ollamaModel,
      });
    }

    case "gemini": {
      // Type assertion is safe here because validation ensures geminiApiKey exists
      return new GeminiProvider(
        mergedConfig.geminiApiKey!,
        mergedConfig.geminiModel ?? DEFAULT_CONFIG.geminiModel,
      );
    }

    default:
      // This should never happen due to the validation
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}

/**
 * Convenience function to create a provider from environment variables
 * 
 * @param provider - The provider type (defaults to "ollama")
 * @returns An instance of the requested LLM provider
 * 
 * @example
 * ```typescript
 * // Will read from environment variables
 * const provider = createLLMProviderFromEnv("gemini");
 * ```
 */
export function createLLMProviderFromEnv(
  provider: ProviderType = "ollama"
): LLMProvider {
  const config: ProviderConfig = {
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL,
    ollamaModel: process.env.OLLAMA_MODEL,
    geminiApiKey: process.env.GEMINI_API_KEY,
    geminiModel: process.env.GEMINI_MODEL,
  };

  return createLLMProvider(provider, config);
}

/**
 * Creates a provider using the LLM_PROVIDER environment variable
 * Falls back to "ollama" if not set
 * 
 * @returns An instance of the LLM provider specified in environment variables
 * 
 * @example
 * ```typescript
 * // Reads LLM_PROVIDER from environment
 * const provider = createLLMProviderFromEnv();
 * ```
 */
export function createDefaultLLMProvider(): LLMProvider {
  const provider = (process.env.LLM_PROVIDER as ProviderType) || "ollama";
  return createLLMProviderFromEnv(provider);
}

// Export the factory as a default for convenience
export default createDefaultLLMProvider;
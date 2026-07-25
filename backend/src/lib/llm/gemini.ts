/**
 * Gemini LLM Provider (optional)
 *
 * This provider is kept for backward compatibility and can be selected
 * via configuration (LLM_PROVIDER=gemini). It is NOT used by default.
 *
 * The default provider is Ollama for local development.
 */

import { GoogleGenAI } from "@google/genai";
import type { GenerateOptions, LLMProvider } from "./types";
import { LLMProviderError } from "./types";

/**
 * Helper to classify Google GenAI errors into LLMErrorCode.
 */
function classifyGeminiError(err: unknown, providerName: string): LLMProviderError {
  const message = err instanceof Error ? err.message : String(err);

  // Google API errors often include status codes or quota messages
  const lower = message.toLowerCase();
  if (lower.includes("quota") || lower.includes("rate") || lower.includes("429") || lower.includes("resource exhausted")) {
    return new LLMProviderError("QUOTA_EXCEEDED", providerName, message);
  }
  if (lower.includes("permission") || lower.includes("api key") || lower.includes("403") || lower.includes("invalid")) {
    return new LLMProviderError("VALIDATION_ERROR", providerName, message);
  }
  if (lower.includes("unavailable") || lower.includes("503") || lower.includes("network") || lower.includes("fetch")) {
    return new LLMProviderError("PROVIDER_UNAVAILABLE", providerName, message);
  }

  return new LLMProviderError("UNEXPECTED_ERROR", providerName, message);
}

export class GeminiProvider implements LLMProvider {
  readonly name = "Gemini";
  readonly model: string;
  private readonly genai: GoogleGenAI;

  constructor(apiKey: string, model: string = "gemini-2.5-flash") {
    this.genai = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    try {
      const result = await this.genai.models.generateContent({
        model: this.model,
        config: {
          systemInstruction: options?.systemInstruction,
          maxOutputTokens: options?.maxOutputTokens,
          temperature: options?.temperature,
        },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      return result.text ?? "";
    } catch (err) {
      throw classifyGeminiError(err, this.name);
    }
  }

  async *stream(prompt: string, options?: GenerateOptions): AsyncIterable<string> {
    let chat;
    try {
      chat = this.genai.chats.create({
        model: this.model,
        config: {
          systemInstruction: options?.systemInstruction,
          maxOutputTokens: options?.maxOutputTokens,
          temperature: options?.temperature,
        },
      });
    } catch (err) {
      throw classifyGeminiError(err, this.name);
    }

    let result;
    try {
      result = await chat.sendMessageStream({ message: prompt });
    } catch (err) {
      throw classifyGeminiError(err, this.name);
    }

    try {
      for await (const chunk of result) {
        if (chunk.text) {
          yield chunk.text;
        }
      }
    } catch (err) {
      throw classifyGeminiError(err, this.name);
    }
  }
}

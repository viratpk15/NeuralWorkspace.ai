import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY must be set in environment variables.");
}

export const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const DEFAULT_MODEL = "gemini-2.5-flash";

export type ChatMessage = { role: "user" | "model"; parts: [{ text: string }] };

export function buildHistory(messages: Array<{ role: string; content: string }>): ChatMessage[] {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

/**
 * Re-exported from the provider-independent system prompt utility.
 * @deprecated Import from "../lib/llm/system-prompts" instead.
 */
export { getAgentSystemInstruction } from "./llm/system-prompts";

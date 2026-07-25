/**
 * Environment configuration loader.
 *
 * Loads environment variables from the workspace-root `.env` file **before**
 * any application module accesses `process.env`. This must be imported with
 * the **very first** `import` statement in the entry point (`index.ts`) so
 * that all subsequent modules see the populated environment.
 *
 * On production platforms the outside environment is expected to already
 * contain the required variables, so `dotenv` loading is a no-op there.
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import dotenv from "dotenv";

// ---------------------------------------------------------------------------
// Help dotenv find the `.env` file regardless of where we are running from
// ---------------------------------------------------------------------------

function findDotEnvPath(): string | undefined {
  const candidates: string[] = [];

  // 1. Explicit DOTENV_CONFIG_PATH environment variable
  if (process.env["DOTENV_CONFIG_PATH"]) {
    candidates.push(process.env["DOTENV_CONFIG_PATH"]);
  }

  // 2. Current working directory (works when `pnpm run dev` is executed from the workspace root)
  candidates.push(resolve(process.cwd(), ".env"));

  // 3. Relative to this source file's expected location in the workspace
  //    src/lib/config.ts → go up 4 levels to reach the workspace root
  const __sourceDirname = dirname(fileURLToPath(import.meta.url));
  candidates.push(resolve(__sourceDirname, "..", "..", "..", "..", ".env"));

  // 4. Relative to the bundled dist output (dist/index.mjs → up 2 to artifact root, then up 1 to workspace root)
  const __distDirname = dirname(fileURLToPath(import.meta.url));
  candidates.push(resolve(__distDirname, "..", "..", ".env"));

  // 5. Search up from the artifact until we find a workspace root marker
  let current = resolve(__sourceDirname);
  for (let i = 0; i < 10; i++) {
    const candidate = resolve(current, ".env");
    if (existsSync(candidate)) {
      return candidate;
    }
    const parent = dirname(current);
    if (parent === current) break; // reached filesystem root
    current = parent;
  }

  // Return the highest-priority candidate that actually exists
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// Load .env
// ---------------------------------------------------------------------------

const dotenvPath = findDotEnvPath();
if (dotenvPath) {
  const result = dotenv.config({ path: dotenvPath });
  if (result.error) {
    console.warn(`[config] Failed to load ${dotenvPath}: ${result.error.message}`);
  } else {
    console.log(`[config] Loaded environment from ${dotenvPath}`);
  }
} else {
  console.log("[config] No .env file found – using existing process.env (production / CI)");
}

// ---------------------------------------------------------------------------
// Required variable validation
// ---------------------------------------------------------------------------

const REQUIRED_VARS = ["DATABASE_URL"] as const;

const missing: string[] = [];

for (const key of REQUIRED_VARS) {
  if (!process.env[key]) {
    missing.push(key);
  }
}

if (missing.length > 0) {
  const message = [
    `Missing required environment variable(s): ${missing.join(", ")}`,
    "",
    "  Ensure your .env file exists at the workspace root and contains:",
    ...missing.map((k) => `    ${k}=<your-value>`),
    "",
    "  Tip: Copy .env.example to .env and fill in the values.",
    "  Tip: On deployment platforms these variables are set in the environment configuration.",
    "",
  ].join("\n");
  console.error(message);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// LLM Provider Configuration
// ---------------------------------------------------------------------------

// The LLM provider is selected via the LLM_PROVIDER environment variable.
// Default: "ollama" (local development)
// Set to "gemini" to use Google's Gemini API (requires GEMINI_API_KEY).
const LLM_PROVIDER = (process.env["LLM_PROVIDER"] ?? "ollama") as "ollama" | "gemini";

const OLLAMA_BASE_URL = process.env["OLLAMA_BASE_URL"] ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env["OLLAMA_MODEL"] ?? "qwen2.5:3b";

// ---------------------------------------------------------------------------
// Exported configuration
// ---------------------------------------------------------------------------

export const env = {
  PORT: Number(process.env["PORT"] ?? "3001"),
  BASE_PATH: process.env["BASE_PATH"] ?? "/",
  DATABASE_URL: process.env["DATABASE_URL"]!,
  GEMINI_API_KEY: process.env["GEMINI_API_KEY"],
  GROQ_API_KEY: process.env["GROQ_API_KEY"],
  NODE_ENV: process.env["NODE_ENV"] ?? "development",
  LOG_LEVEL: process.env["LOG_LEVEL"] ?? "info",
  LLM_PROVIDER,
  OLLAMA_BASE_URL,
  OLLAMA_MODEL,
} as const;

// ---------------------------------------------------------------------------
// LLM Provider Singleton
// ---------------------------------------------------------------------------

import { createLLMProvider } from "./llm";
import type { LLMProvider } from "./llm";

let _llmProvider: LLMProvider | null = null;

export function getLLMProvider(): LLMProvider {
  if (_llmProvider) return _llmProvider;

  _llmProvider = createLLMProvider(LLM_PROVIDER, {
    ollamaBaseUrl: OLLAMA_BASE_URL,
    ollamaModel: OLLAMA_MODEL,
    geminiApiKey: env.GEMINI_API_KEY,
  });

  return _llmProvider;
}

# Neural Workspace – AI-Powered Development Environment

Neural Workspace is a full-stack AI collaboration platform that integrates LLM capabilities (Google Gemini, Ollama) with a comprehensive workspace management system. It provides developers and teams with an intelligent assistant for conversations, documentation generation, architecture planning, task management, and workflow optimization.

## What This Is

A monorepo containing a **modern web-based workspace application** that combines:
- **Real-time AI conversations** powered by LLM providers (Google Gemini or local Ollama)
- **Rich documentation and docs studio** for managing project knowledge
- **Architecture design and visualization** tools
- **Task and project management** with milestone tracking
- **Memory and prompt management** for AI context and templates
- **Workflow planning and execution** with kanban-style task boards

Perfect for teams and individuals who want a unified AI-assisted development and documentation hub.

### Stack

- **Language(s):** TypeScript (100% type-safe across frontend, backend, and libraries)
- **Framework / runtime:** 
  - Frontend: React 19.1.0 + Vite 7 with Tailwind CSS 4 + shadcn UI
  - Backend: Express 5 + Node.js with pnpm monorepo
- **Notable libraries:** 
  - **Google Generative AI SDK** (`@google/genai`) for LLM integration
  - **Drizzle ORM** for type-safe database queries
  - **Radix UI** for accessible component primitives
  - **React Query (TanStack)** for server state management
  - **Zod** for runtime schema validation across API boundaries

## How It's Organized

```
NeuralWorkspace.ai/
├── backend/                    Express API server, LLM routes, database integration
│   ├── src/
│   │   ├── routes/            Endpoint modules: conversations, documentation, architecture, etc.
│   │   ├── lib/               Logger, config, utilities
│   │   ├── app.ts             Express middleware setup (CORS, logging, JSON)
│   │   └── index.ts           Server entry point (port 3001)
│   ├── build.mjs              ESBuild configuration for production
│   └── package.json           Backend dependencies
│
├── frontend/                   React + Vite SPA with premium UI
│   ├── src/
│   │   ├── pages/             Page components (dashboard, assistant, architecture, etc.)
│   │   ├── components/        Reusable UI components (buttons, cards, dialogs, etc.)
│   │   ├── contexts/          React Context for app state
│   │   ├── hooks/             Custom React hooks
│   │   ├── lib/               API client, utilities
│   │   ├── index.css          Design system with dark/light themes, glassmorphism
│   │   ├── App.tsx            Router and main layout
│   │   └── main.tsx           React DOM mount point
│   ├── vite.config.ts         Vite build configuration
│   └── package.json           Frontend dependencies
│
├── lib/                       Shared libraries
│   ├── api-zod/              Zod schemas for API request/response validation
│   ├── api-spec/             API specification and types
│   ├── api-client-react/     React hooks for API communication
│   └── db/                    Database schema, migrations, and Drizzle ORM setup
│
├── scripts/                   Development utilities and automation
├── .env.example              Environment variables template
├── pnpm-workspace.yaml       pnpm monorepo configuration with supply-chain security settings
├── tsconfig.base.json        Base TypeScript configuration
└── TODO.md                   Premium visual design refresh (completed)
```

**How it fits together:**

The frontend is a React SPA served by Vite that communicates with the Express backend via JSON REST APIs. The backend integrates with external LLM providers (Google Gemini or local Ollama) to handle AI tasks like conversations and documentation generation. Both frontend and backend consume shared libraries (`api-zod` for validation, `db` for database access) to maintain type safety across the entire stack. All packages coordinate through pnpm's centralized dependency management with built-in supply-chain attack defense.

## How to Run It

### Prerequisites

- **Node.js** 18+ and **pnpm** 9+
- **Database:** PostgreSQL (configured via `DATABASE_URL` environment variable)
- **LLM Provider:** Either a local Ollama instance or Google Gemini API key

### Setup

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/viratpk15/NeuralWorkspace.ai.git
   cd NeuralWorkspace.ai
   pnpm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and fill in:
   - `DATABASE_URL=postgresql://...` (required)
   - `LLM_PROVIDER=ollama` or `gemini`
   - For Ollama: `OLLAMA_BASE_URL` and `OLLAMA_MODEL`
   - For Gemini: `GEMINI_API_KEY` (get from https://aistudio.google.com/app/apikey)
   - `PORT=3001` (backend port)

3. **Build the monorepo:**
   ```bash
   pnpm build
   ```

4. **Run development servers:**

   **Backend (in one terminal):**
   ```bash
   cd backend
   pnpm dev
   ```
   Server starts on `http://localhost:3001`

   **Frontend (in another terminal):**
   ```bash
   cd frontend
   pnpm dev
   ```
   App opens on `http://localhost:5173` (Vite default)

5. **Run tests (if available):**
   ```bash
   pnpm typecheck    # Full TypeScript check across monorepo
   pnpm lint         # ESLint on lib/ and artifacts/
   pnpm format:check # Prettier formatting check
   ```

### Database Migrations

If using Drizzle ORM, run migrations before starting the backend:
```bash
cd lib/db
pnpm db:push  # Push schema changes
# or
pnpm db:studio  # Interactive Drizzle Studio
```

## Key Features

- **AI Conversations** – Real-time chat with memory persistence
- **Documentation Studio** – Write, edit, and manage project documentation
- **Architecture Planning** – Design system architecture with visual tools
- **Dashboard** – Overview of recent activity, projects, and metrics
- **Workspace Management** – Organize agents, projects, and workspace settings
- **Memory System** – Store and retrieve context for smarter AI interactions
- **Prompt Library** – Manage and organize reusable prompts
- **Task Planning** – Kanban-style task boards with workflow tracking
- **Premium UI** – Dark/light theme support, glassmorphism design, monochrome styling

## Try Asking

- "How do I set up a local Ollama instance for development?"
- "What pages and routes are available in the workspace application?"
- "How does the conversation stream from the backend to the frontend work?"
- "What's the database schema for storing conversations and memory?"
- "How do I integrate a new LLM provider beyond Gemini and Ollama?"

## Development Tips

- **Hot reload:** Both frontend (Vite) and backend (watch mode) support hot reloading during development
- **Type safety:** Run `pnpm typecheck` frequently—the entire codebase is fully typed
- **Monorepo scripts:** Use `pnpm -r` to run commands across all packages
- **API validation:** All API requests/responses are validated via `lib/api-zod`
- **Supply chain security:** pnpm enforces a 1-day minimum release age for npm packages (configurable in `pnpm-workspace.yaml`)

## License

MIT

---

**Created:** July 2026 | **Author:** [@viratpk15](https://github.com/viratpk15)

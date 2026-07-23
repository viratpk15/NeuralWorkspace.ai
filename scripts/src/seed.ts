import { db } from "@workspace/db";
import {
  projectsTable,
  tasksTable,
  milestonesTable,
  conversationsTable,
  messagesTable,
  memoryItemsTable,
  promptsTable,
  architectureDocsTable,
  documentationTable,
  settingsTable,
} from "@workspace/db";

async function seed() {
  console.log("Seeding database...");

  // Settings
  const existingSettings = await db.select().from(settingsTable).limit(1);
  if (existingSettings.length === 0) {
    await db.insert(settingsTable).values({
      theme: "dark",
      aiModel: "gemini-2.5-flash",
      workspaceName: "Neural Workspace",
      memoryEnabled: true,
    });
    console.log("Created settings");
  }

  // Projects
  const existingProjects = await db.select().from(projectsTable).limit(1);
  if (existingProjects.length > 0) {
    console.log("Data already seeded, skipping.");
    return;
  }

  const [project1] = await db
    .insert(projectsTable)
    .values({
      name: "Neural Workspace",
      description: "AI-powered development environment for modern software engineers",
      status: "active",
      techStack: ["React", "TypeScript", "Node.js", "PostgreSQL", "Gemini AI"],
      requirements: [
        "Multi-agent AI workspace",
        "Project planning and task management",
        "Architecture generation",
        "Documentation studio",
      ],
    })
    .returning();

  const [project2] = await db
    .insert(projectsTable)
    .values({
      name: "Distributed Cache Service",
      description: "High-performance distributed caching layer with Redis cluster",
      status: "planning",
      techStack: ["Go", "Redis", "gRPC", "Kubernetes", "Prometheus"],
      requirements: [
        "Sub-millisecond latency",
        "99.99% uptime SLA",
        "Multi-region support",
        "Automatic failover",
      ],
    })
    .returning();

  const [project3] = await db
    .insert(projectsTable)
    .values({
      name: "Real-time Analytics Dashboard",
      description: "Event-driven analytics platform with streaming data visualization",
      status: "paused",
      techStack: ["Python", "Apache Kafka", "ClickHouse", "React", "WebSockets"],
      requirements: [
        "Process 1M events/second",
        "Real-time chart updates",
        "Custom metric builder",
      ],
    })
    .returning();

  console.log("Created projects");

  // Milestones
  const [m1] = await db
    .insert(milestonesTable)
    .values({
      projectId: project1.id,
      name: "MVP Launch",
      description: "Core features working end-to-end",
      status: "completed",
      dueDate: "2025-06-01",
    })
    .returning();

  const [m2] = await db
    .insert(milestonesTable)
    .values({
      projectId: project1.id,
      name: "Beta Release",
      description: "Full feature set with AI integrations",
      status: "in_progress",
      dueDate: "2025-08-15",
    })
    .returning();

  // Tasks for project1
  await db.insert(tasksTable).values([
    {
      projectId: project1.id,
      milestoneId: m1.id,
      title: "Set up monorepo structure",
      description: "Configure pnpm workspace with TypeScript project references",
      status: "done",
      priority: "high",
    },
    {
      projectId: project1.id,
      milestoneId: m1.id,
      title: "Design OpenAPI specification",
      description: "Define all API contracts for Neural Workspace",
      status: "done",
      priority: "high",
    },
    {
      projectId: project1.id,
      milestoneId: m2.id,
      title: "Implement streaming AI chat",
      description: "SSE-based streaming for real-time AI responses",
      status: "in_progress",
      priority: "urgent",
    },
    {
      projectId: project1.id,
      milestoneId: m2.id,
      title: "Build Architecture Studio UI",
      description: "Generator interface with Mermaid diagram support",
      status: "in_progress",
      priority: "high",
    },
    {
      projectId: project1.id,
      title: "Add prompt version history",
      description: "Track changes to prompts across versions",
      status: "todo",
      priority: "medium",
    },
    {
      projectId: project1.id,
      title: "Write comprehensive test suite",
      description: "Unit and integration tests for all API routes",
      status: "todo",
      priority: "medium",
    },
  ]);

  // Tasks for project2
  await db.insert(tasksTable).values([
    {
      projectId: project2.id,
      title: "Research Redis Cluster topology",
      description: "Evaluate sharding strategies for distributed cache",
      status: "done",
      priority: "high",
    },
    {
      projectId: project2.id,
      title: "Design gRPC service contracts",
      description: "Define .proto files for cache operations",
      status: "in_progress",
      priority: "high",
    },
    {
      projectId: project2.id,
      title: "Implement consistent hashing",
      description: "Distribute keys evenly across nodes",
      status: "todo",
      priority: "urgent",
    },
  ]);

  console.log("Created tasks");

  // Conversations
  const [conv1] = await db
    .insert(conversationsTable)
    .values({
      title: "System Design: Distributed Cache",
      agentType: "architecture",
      pinned: true,
      projectId: project2.id,
    })
    .returning();

  const [conv2] = await db
    .insert(conversationsTable)
    .values({
      title: "TypeScript generics deep dive",
      agentType: "coding",
      pinned: false,
      projectId: project1.id,
    })
    .returning();

  // Messages
  await db.insert(messagesTable).values([
    {
      conversationId: conv1.id,
      role: "user",
      content: "I need to design a distributed cache service that handles 1M requests per second. What architecture would you recommend?",
    },
    {
      conversationId: conv1.id,
      role: "assistant",
      content: `# Distributed Cache Architecture

For handling 1M requests/second, I recommend a **Redis Cluster** with a consistent hashing ring.

## Core Architecture

\`\`\`mermaid
graph TB
  Client --> LB[Load Balancer]
  LB --> Node1[Cache Node 1]
  LB --> Node2[Cache Node 2]
  LB --> Node3[Cache Node 3]
  Node1 <--> Node2
  Node2 <--> Node3
  Node3 <--> Node1
\`\`\`

## Key Design Decisions

1. **Consistent Hashing** - Minimizes cache invalidation during node additions/removals
2. **Read Replicas** - 2 replicas per primary for high availability
3. **Connection Pooling** - Use pgbouncer-style pooling for the cache layer

## Tech Stack
- **Redis 7.x** with cluster mode enabled
- **Go** for the proxy layer (low latency, high concurrency)
- **gRPC** for internal communication
- **Prometheus + Grafana** for monitoring`,
    },
  ]);

  await db.insert(messagesTable).values([
    {
      conversationId: conv2.id,
      role: "user",
      content: "Can you explain how to use TypeScript conditional types with infer?",
    },
    {
      conversationId: conv2.id,
      role: "assistant",
      content: `# TypeScript Conditional Types with \`infer\`

The \`infer\` keyword lets you extract types within conditional types.

## Basic Pattern

\`\`\`typescript
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

// Usage
type Fn = () => string;
type Result = ReturnType<Fn>; // string
\`\`\`

## Practical Examples

### Extract Promise value
\`\`\`typescript
type Awaited<T> = T extends Promise<infer U> ? U : T;
type Value = Awaited<Promise<number>>; // number
\`\`\`

### Extract array element type
\`\`\`typescript
type ElementType<T> = T extends Array<infer E> ? E : never;
type Elem = ElementType<string[]>; // string
\`\`\`

This is extremely powerful for building type-safe utilities.`,
    },
  ]);

  console.log("Created conversations and messages");

  // Memory items
  await db.insert(memoryItemsTable).values([
    {
      title: "Neural Workspace Tech Stack Decision",
      content: "Chose React + Vite over Next.js for better control over routing and bundle size. Express over Fastify for better TypeScript support in the monorepo.",
      category: "decisions",
      tags: ["architecture", "stack", "frontend"],
      pinned: true,
      projectId: project1.id,
    },
    {
      title: "API Design Principles",
      content: "All APIs follow REST conventions. Use PATCH for partial updates, never PUT. Response shapes always match the OpenAPI spec. Error responses use { error: string } shape.",
      category: "requirements",
      tags: ["api", "backend", "standards"],
      pinned: true,
      projectId: null,
    },
    {
      title: "Gemini AI Model Selection",
      content: "Using gemini-2.5-flash for chat (low latency), gemini-2.5-pro for architecture generation (higher quality). Streaming via SSE for real-time UX.",
      category: "decisions",
      tags: ["ai", "gemini", "streaming"],
      pinned: false,
      projectId: project1.id,
    },
    {
      title: "Database Schema Conventions",
      content: "All tables use snake_case columns. Timestamps always include timezone. Soft deletes not used - hard delete with cascade. No UUIDs - serial IDs for simplicity.",
      category: "context",
      tags: ["database", "drizzle", "conventions"],
      pinned: false,
      projectId: null,
    },
  ]);

  console.log("Created memory items");

  // Prompts
  await db.insert(promptsTable).values([
    {
      title: "Generate REST API Design",
      content: `Design a RESTful API for {resource_name} with the following requirements:
- {requirements}

Include:
1. All CRUD endpoints with proper HTTP methods
2. Request/response schemas
3. Error handling patterns
4. Authentication requirements
5. Rate limiting considerations

Output as OpenAPI 3.1 YAML format.`,
      category: "architecture",
      tags: ["api", "rest", "openapi"],
      favorite: true,
      version: 2,
    },
    {
      title: "Code Review Checklist",
      content: `Review the following code for:

\`\`\`
{code}
\`\`\`

Check for:
1. Security vulnerabilities (injection, XSS, CSRF)
2. Performance issues (N+1 queries, unnecessary re-renders)
3. Error handling completeness
4. Type safety and null checks
5. Code duplication and DRY violations
6. Documentation and naming clarity

Provide specific line-by-line feedback with severity levels (critical/high/medium/low).`,
      category: "coding",
      tags: ["review", "security", "quality"],
      favorite: true,
      version: 1,
    },
    {
      title: "System Design Interview",
      content: `Design a system for {use_case} that handles:
- {scale_requirements}

Walk through:
1. Requirements clarification (functional + non-functional)
2. High-level architecture diagram
3. Database design and data model
4. API design
5. Scaling strategy (horizontal/vertical)
6. Caching layer
7. Monitoring and alerting
8. Failure modes and mitigation

Use Mermaid diagrams for the architecture.`,
      category: "architecture",
      tags: ["system-design", "interview", "scalability"],
      favorite: false,
      version: 1,
    },
    {
      title: "Write Unit Tests",
      content: `Write comprehensive unit tests for the following {language} function:

\`\`\`
{code}
\`\`\`

Requirements:
- Use {testing_framework}
- Cover happy path, edge cases, and error cases
- Aim for 100% branch coverage
- Mock external dependencies
- Use descriptive test names following the pattern: "should {expected_behavior} when {condition}"`,
      category: "testing",
      tags: ["testing", "unit-tests", "coverage"],
      favorite: false,
      version: 1,
    },
  ]);

  console.log("Created prompts");

  // Architecture doc
  await db.insert(architectureDocsTable).values({
    title: "Full System Architecture - Neural Workspace",
    content: `# Neural Workspace System Architecture

## Overview

Neural Workspace is a monorepo-based full-stack application with a React frontend and Node.js/Express backend.

## High-Level Architecture

\`\`\`mermaid
graph TB
  Browser --> Vite[React + Vite Frontend]
  Vite --> Express[Express API Server]
  Express --> PG[(PostgreSQL)]
  Express --> Gemini[Gemini AI API]
  
  subgraph Monorepo
    Vite
    Express
    PG
  end
\`\`\`

## Folder Structure

\`\`\`
workspace/
├── artifacts/
│   ├── api-server/          # Express API server
│   └── neural-workspace/    # React frontend
├── lib/
│   ├── api-spec/            # OpenAPI specification
│   ├── api-client-react/    # Generated React Query hooks
│   ├── api-zod/             # Generated Zod validators
│   └── db/                  # Drizzle ORM schema
└── scripts/                 # Utility scripts
\`\`\`

## Database Schema

\`\`\`mermaid
erDiagram
  projects ||--o{ tasks : has
  projects ||--o{ milestones : has
  projects ||--o{ conversations : linked_to
  conversations ||--o{ messages : contains
  milestones ||--o{ tasks : groups
\`\`\`

## API Design

All API endpoints follow REST conventions under the \`/api\` base path.
Authentication is planned for a future release.`,
    docType: "full",
    projectId: project1.id,
  });

  console.log("Created architecture doc");

  // Documentation
  await db.insert(documentationTable).values({
    title: "README - Neural Workspace",
    docType: "readme",
    content: `# Neural Workspace

> AI Development Environment for Modern Software Engineers

Neural Workspace is a premium AI-powered development platform that helps engineers throughout the software development lifecycle using intelligent automation.

## Features

- **Multi-Agent Workspace** - Specialized AI agents for coding, architecture, planning, and more
- **AI Coding Assistant** - Streaming chat with markdown and syntax highlighting
- **Project Planner** - Kanban board with tasks, milestones, and priorities  
- **Architecture Studio** - AI-generated architecture documents and Mermaid diagrams
- **Documentation Studio** - Auto-generate READMEs, API docs, and developer guides
- **Workspace Memory** - Persistent context and knowledge base
- **Prompt Library** - Curated prompts with version history

## Tech Stack

- **Frontend**: React, TypeScript, Vite, TailwindCSS, shadcn/ui, Framer Motion
- **Backend**: Node.js, Express 5, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: Google Gemini API (gemini-2.5-flash)

## Quick Start

\`\`\`bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Add GEMINI_API_KEY and DATABASE_URL

# Push database schema
pnpm --filter @workspace/db run push

# Start development
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/neural-workspace run dev
\`\`\``,
    projectId: project1.id,
  });

  console.log("Seeding complete!");
}

seed().catch(console.error);

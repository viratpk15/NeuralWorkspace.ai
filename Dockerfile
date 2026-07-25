# syntax=docker/dockerfile:1

# Build stage
FROM node:22-bookworm AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@11.16.0 --activate

# Copy workspace manifests first for better caching
COPY package.json .
COPY pnpm-lock.yaml .
COPY pnpm-workspace.yaml .
COPY tsconfig*.json ./

# Copy workspace packages
COPY backend ./backend
COPY frontend ./frontend
COPY lib ./lib
COPY scripts ./scripts

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build backend (production only)
RUN pnpm --filter @workspace/api-server build

# Production stage
FROM node:22-bookworm

WORKDIR /app

# Copy only built artifacts from builder
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser -d /app -s /sbin/nologin appuser && \
  chown -R appuser:appuser /app

USER appuser

EXPOSE 3001

# Health check for Railway
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })" || exit 1

CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
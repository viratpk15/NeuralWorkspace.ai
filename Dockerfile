# ---------- Base ----------
FROM node:22-bookworm-slim

WORKDIR /app

# Enable pnpm
RUN corepack enable

# Copy workspace files first
COPY package.json .
COPY pnpm-lock.yaml .
COPY pnpm-workspace.yaml .
COPY tsconfig*.json ./

# Copy workspace packages
COPY backend ./backend
COPY frontend ./frontend
COPY lib ./lib
COPY scripts ./scripts

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build backend only
RUN pnpm --filter @workspace/api-server build

EXPOSE 3001

CMD ["pnpm", "--filter", "@workspace/api-server", "start"]
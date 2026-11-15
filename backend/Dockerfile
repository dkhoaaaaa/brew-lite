# ==========================================
# BrewLite Backend - Production Dockerfile
# ==========================================

FROM node:22-alpine

WORKDIR /app

# Enable Corepack and install the project's pnpm version
RUN corepack enable \
    && corepack prepare pnpm@12.8.1 --activate

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package manifests
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma Client
# A placeholder connection string is sufficient for generation.
# No database connection is made during this step.
RUN DATABASE_URL="postgresql://user:password@localhost:5432/brewlite" \
    DIRECT_URL="postgresql://user:password@localhost:5432/brewlite" \
    pnpm --dir backend exec prisma --config prisma7.config.ts generate

# Build NestJS
RUN pnpm --dir backend build

# Production environment
ENV NODE_ENV=production

# Render provides PORT automatically
EXPOSE 3000

# Start NestJS in production mode
CMD ["pnpm", "--dir", "backend", "start:prod"]

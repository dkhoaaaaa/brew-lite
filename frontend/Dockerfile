FROM node:22-alpine

WORKDIR /app

RUN corepack enable \
    && corepack prepare pnpm@12.8.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json

RUN pnpm install --no-frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["pnpm", "--dir", "frontend", "dev", "--hostname", "0.0.0.0"]
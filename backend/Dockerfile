FROM node:22-alpine

WORKDIR /app

RUN corepack enable \
    && corepack prepare pnpm@12.8.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json

RUN pnpm install --frozen-lockfile

COPY . .

# Thêm dòng này để ép Docker đưa thư mục public vào đúng trong thư mục backend của container
COPY backend/public ./backend/public

EXPOSE 3000

CMD ["pnpm", "--dir", "backend", "start:dev"]
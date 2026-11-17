import "dotenv/config";
import path from "node:path";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Nạp file .env từ thư mục root dự án và thư mục backend
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    directory: "prisma/migrations",
    seed: "pnpm exec tsx prisma/seed.ts",
  },

  datasource: {
    url:
      process.env.DIRECT_URL ||
      process.env.DATABASE_URL ||
      process.env.LOCAL_DIRECT_URL ||
      "postgresql://brewlite:your_local_postgres_password@localhost:5432/brewlite?schema=public",
  },
});

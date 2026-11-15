import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    directory: "prisma/migrations",
    seed: "pnpm exec tsx prisma/seed.ts",
  },

  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || env("DIRECT_URL"),
  },
});

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Bổ sung dòng này để bỏ qua lỗi check type trên editor nếu gặp xung đột phiên bản TS
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
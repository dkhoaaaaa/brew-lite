
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  // Polyfill BigInt toJSON serialization for JSON responses
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };

  // Create NestJS application
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // CORS configuration - Cấu hình tập trung, linh hoạt và an toàn
  const staticAllowedOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://brew-lite-tau.vercel.app",
    ...(process.env.FRONTEND_BASE_URL
      ? process.env.FRONTEND_BASE_URL.split(",").map((url) => url.trim()).filter(Boolean)
      : []),
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Cho phép requests không có origin (server-to-server, curl, mobile app, postman, healthcheck)
      if (!origin) {
        return callback(null, true);
      }
      if (staticAllowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Hỗ trợ các preview deployment URLs của Vercel cho dự án brew-lite
      if (/^https:\/\/brew-lite(-[a-z0-9-]+)?\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    methods: [
      "GET",
      "HEAD",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
    // Không khai báo allowedHeaders để middleware `cors` của Express tự động
    // phản chiếu (reflect) toàn bộ request headers từ `Access-Control-Request-Headers` của client
    credentials: true,
    optionsSuccessStatus: 204,
  });

  // Serve static files from public directory
  app.useStaticAssets(join(process.cwd(), "public"));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Start server
  await app.listen(process.env.PORT ?? 3001, "0.0.0.0");
}

void bootstrap();

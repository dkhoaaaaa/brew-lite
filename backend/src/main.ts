
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

  // CORS configuration
  const allowedOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://brew-lite-tau.vercel.app",
    ...(process.env.FRONTEND_BASE_URL
      ? process.env.FRONTEND_BASE_URL.split(",").map((url) => url.trim())
      : []),
  ];

  app.enableCors({
    origin: allowedOrigins,
    methods: [
      "GET",
      "HEAD",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
    ],
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

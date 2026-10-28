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

  // Sử dụng NestExpressApplication để bật tính năng phục vụ file tĩnh
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  });

  // Cấu hình để backend phục vụ thư mục public/image
  app.useStaticAssets(join(process.cwd(), "public"));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3001, "0.0.0.0");
}

void bootstrap();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix('api');

  // 1. Cấu hình CORS để cho phép Frontend (Next.js chạy ở port khác) gọi API sang
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  // 2. Bật Global Validation Pipe để tự động kiểm tra DTO (class-validator)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Tự động loại bỏ các field không được khai báo trong DTO
      forbidNonWhitelisted: true, // Trả về lỗi nếu gửi field thừa không có trong DTO
      transform: true, // Tự động chuyển đổi kiểu dữ liệu (vd: string "123" -> number 123)
    }),
  );

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`BrewLite Backend đang chạy tại: http://localhost:${port}`);
}
bootstrap();
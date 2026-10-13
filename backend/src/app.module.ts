// src/app.module.ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
// Import các module khác...

@Module({
  imports: [
    DatabaseModule, // Đưa DatabaseModule vào đây để khởi chạy kết nối chung
    // Các modules code xong nhớ ghi vào đây
  ],
})
export class AppModule {}
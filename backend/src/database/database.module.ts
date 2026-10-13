import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Đánh dấu @Global giúp các module khác dùng được PrismaService mà không cần import lại DatabaseModule thủ công ở từng nơi
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Xuất ra để module khác dùng chung
})
export class DatabaseModule {}
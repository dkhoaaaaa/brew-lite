import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  // Kết nối đến database ngay khi NestJS khởi động module
  async onModuleInit() {
    await this.$connect();
  }

  // Ngắt kết nối an toàn khi ứng dụng tắt
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
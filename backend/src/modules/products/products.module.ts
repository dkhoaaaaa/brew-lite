import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';

// Nếu PrismaModule không phải @Global(), thêm: imports: [PrismaModule]
@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}

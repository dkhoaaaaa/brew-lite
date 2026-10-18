import { Injectable } from '@nestjs/common';
// Chỉnh đường dẫn cho khớp PrismaService hiện có trong src/prisma/
import { PrismaService } from '../../prisma/prisma.service.js';
import { ProductResponseDto } from './dto/product-response.dto.js';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<ProductResponseDto[]> {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
      select: { id: true, name: true, price: true, imageUrl: true },
    });

    return products.map((p) => ({
      id: p.id.toString(),
      name: p.name,
      price: p.price.toNumber(), // Decimal -> number
      imageUrl: p.imageUrl,
    }));
  }
}

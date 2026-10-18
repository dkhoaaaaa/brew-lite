import { Controller, Get } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { ProductResponseDto } from './dto/product-response.dto.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(): Promise<ProductResponseDto[]> {
    return this.productsService.findAll();
  }
}

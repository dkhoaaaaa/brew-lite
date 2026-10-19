import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
} from "@nestjs/common";
import { ProductsService } from "./products.service.js";

@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    // Tối đa 18 chữ số để BigInt không vượt giới hạn của PostgreSQL (trả 400 thay vì 500).
    if (!/^\d{1,18}$/.test(id)) {
      throw new BadRequestException("Product id must be a positive integer.");
    }

    const product = await this.productsService.findOne(BigInt(id));
    if (!product) throw new NotFoundException("Product not found.");
    return product;
  }
}
